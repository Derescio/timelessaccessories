import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order.actions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});

// Disable automatic body parsing (important for webhooks)
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    console.log(`✅ Received Stripe event: ${event.type}`);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle specific event
  if (event.type === 'charge.succeeded') {
    const charge = event.data.object as Stripe.Charge;

    if (!charge.metadata?.orderId) {
      console.error('⚠️ Missing orderId in charge metadata.');
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    try {
      await updateOrderToPaid({
        orderId: charge.metadata.orderId,
        paymentResult: {
          id: charge.id,
          status: 'COMPLETED',
          email_address: charge.billing_details?.email || 'unknown@example.com',
          pricePaid: (charge.amount / 100).toFixed(2),
        },
      });

      console.log(`✅ Order ${charge.metadata.orderId} marked as paid`);
      return NextResponse.json({ message: 'Order updated successfully' });
    } catch (error) {
      console.error(`❌ Failed to update order: ${error}`);
      return NextResponse.json({ error: 'Order update failed' }, { status: 500 });
    }
  }

  // For unhandled event types
  return NextResponse.json({ message: `Unhandled event type: ${event.type}` });
}
