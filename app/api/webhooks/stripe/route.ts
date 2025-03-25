import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order.actions';

// Initialize Stripe with the secret API key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Define the POST handler function for the Stripe webhook
export async function POST(req: NextRequest) {
  try {
    // Construct the event using the raw request body, the Stripe signature header, and the webhook secret.
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Log the event type for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Stripe webhook event:', event.type);
    }

    // Handle the charge.succeeded event
    if (event.type === 'charge.succeeded') {
      const charge = event.data.object as Stripe.Charge;

      // Log the charge details for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Charge details:', {
          id: charge.id,
          amount: charge.amount,
          currency: charge.currency,
          metadata: charge.metadata,
        });
      }

      // Update the order status to paid
      await updateOrderToPaid({
        orderId: charge.metadata.orderId,
        paymentResult: {
          id: charge.id,
          status: 'COMPLETED',
          email_address: charge.billing_details.email || 'no-email@example.com',
          pricePaid: (charge.amount / 100).toFixed(2),
        },
      });

      return NextResponse.json({
        message: 'updateOrderToPaid was successful',
        orderId: charge.metadata.orderId,
      });
    }

    // Log unhandled events for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({
      message: `Event ${event.type} received but not processed`,
    });
  } catch (error: any) {
    // Log the error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error processing Stripe webhook:', error.message);
    }

    return NextResponse.json(
      { error: `Webhook error: ${error.message}` },
      { status: 500 }
    );
  }
}