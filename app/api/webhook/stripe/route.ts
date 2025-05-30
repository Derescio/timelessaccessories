import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { updateOrderToPaid } from "@/lib/actions/order.actions";

// Initialize Stripe with the secret API key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Define the POST handler function for the Stripe webhook
export async function POST(req: NextRequest) {
  try {
    console.log(`Stripe webhook received at ${new Date().toISOString()}`);

    // Construct the event using the raw request body, the Stripe signature header, and the webhook secret.
    // This ensures that the request is indeed from Stripe and has not been tampered with.
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header in webhook request');
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const testWebhookSecret = process.env.NODE_ENV === 'development' ? 'whsec_test_12345678901234567890123456789012' : '';

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret || testWebhookSecret
      );
      console.log(`Received Stripe webhook event: ${event.type}`);
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // charge.succeeded indicates a successful payment
    if (event.type === 'charge.succeeded') {
      // Retrieve the order ID from the payment metadata
      const { object } = event.data;
      const charge = object as Stripe.Charge;

      if (!charge.metadata?.orderId) {
        console.error(`No orderId found in charge metadata: ${charge.id}`);
        return NextResponse.json(
          { error: "No orderId in charge metadata" },
          { status: 400 }
        );
      }

      console.log(`Processing payment for order: ${charge.metadata.orderId}`);

      try {
        // Check if order exists (works for both guest and authenticated orders)
        const order = await prisma.order.findUnique({
          where: { id: charge.metadata.orderId },
          include: { user: true }
        });

        if (!order) {
          console.error(`Order not found: ${charge.metadata.orderId}`);
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 }
          );
        }

        console.log(`Order found: ${order.id}, User: ${order.userId || 'Guest'}, Guest Email: ${order.guestEmail || 'N/A'}`);

        // Update the order status to paid (works for both guest and authenticated orders)
        await updateOrderToPaid({
          orderId: charge.metadata.orderId,
          paymentResult: {
            id: charge.id,
            status: 'COMPLETED',
            email_address: charge.billing_details?.email || order.guestEmail || 'no-email@example.com',
            pricePaid: (charge.amount / 100).toFixed(2),
          },
        });

        console.log(`✅ Order ${charge.metadata.orderId} marked as paid via Stripe webhook`);

        return NextResponse.json({
          message: "updateOrderToPaid was successful",
          orderId: charge.metadata.orderId,
          orderType: order.userId ? 'authenticated' : 'guest'
        });
      } catch (error) {
        console.error(`❌ Error updating order: ${error}`);
        return NextResponse.json(
          { error: `Error updating order: ${error}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: `Event ${event.type} received but not processed`,
    });
  } catch (error: any) {
    console.error(`Webhook error: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook error: ${error.message}` },
      { status: 500 }
    );
  }
}