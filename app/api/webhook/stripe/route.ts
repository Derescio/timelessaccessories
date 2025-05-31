import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order.actions';
import { sendOrderConfirmationEmail } from '@/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});
 
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const webhookSecret =
    process.env.NODE_ENV === 'development'
      ? 'whsec_test_12345678901234567890123456789012' // replace with your test secret
      : process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret!);
    console.log(`✅ Received Stripe event: ${event.type}`);
  } catch (err: any) {
    console.error('❌ Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  if (event.type === 'charge.succeeded') {
    const charge = event.data.object as Stripe.Charge;
    const orderId = charge.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId in charge metadata' }, { status: 400 });
    }

    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: charge.id,
        status: 'COMPLETED',
        email_address: charge.billing_details.email || 'unknown@example.com',
        pricePaid: (charge.amount / 100).toFixed(2),
      },
    });

    try {
      await sendOrderConfirmationEmail(orderId);
    } catch (e) {
      console.warn('Email sending failed but continuing:', e);
    }

    return NextResponse.json({ message: 'Order updated and confirmed via charge.succeeded' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId || session.payment_status !== 'paid') {
      return NextResponse.json({ message: 'Checkout session incomplete or missing order ID' });
    }

    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: session.payment_intent as string,
        status: 'COMPLETED',
        email_address: session.customer_email || 'unknown@example.com',
        pricePaid: (session.amount_total! / 100).toFixed(2),
      },
    });

    try {
      await sendOrderConfirmationEmail(orderId);
    } catch (e) {
      console.warn('Email sending failed but continuing:', e);
    }

    return NextResponse.json({ message: 'Order updated via checkout.session.completed' });
  }

  return NextResponse.json({ message: `Unhandled event: ${event.type}` });
}
