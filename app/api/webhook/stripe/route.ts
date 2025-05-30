import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { updateOrderToPaid } from "@/lib/actions/order.actions";
import { sendOrderConfirmationEmail } from "@/email";

// Initialize Stripe with the secret API key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Define the POST handler function for the Stripe webhook
export async function POST(req: NextRequest) {
  console.log('🔔 Stripe webhook - Received webhook request');
  
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('🔔 Stripe webhook - No signature found');
    return NextResponse.json(
      { error: "No signature found" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    console.log('🔔 Stripe webhook - Event constructed successfully:', event.type);
  } catch (err) {
    console.error('🔔 Stripe webhook - Error constructing event:', err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  console.log('🔔 Stripe webhook - Processing event type:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('🔔 Stripe webhook - Checkout session completed');
    console.log('🔔 Stripe webhook - Session ID:', session.id);
    console.log('🔔 Stripe webhook - Payment status:', session.payment_status);
    console.log('🔔 Stripe webhook - Customer email:', session.customer_email);

    if (session.payment_status === 'paid') {
      console.log('🔔 Stripe webhook - Payment confirmed, processing order');
      
      const orderId = session.metadata?.orderId;
      console.log('🔔 Stripe webhook - Order ID from metadata:', orderId);

      if (!orderId) {
        console.error('🔔 Stripe webhook - No order ID found in session metadata');
        return NextResponse.json(
          { error: "No order ID found in session metadata" },
          { status: 400 }
        );
      }

      try {
        console.log('🔔 Stripe webhook - Looking up order in database');
        // Get the order from the database
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            user: { select: { email: true, name: true } },
            items: true,
          },
        });

        if (!order) {
          console.error('🔔 Stripe webhook - Order not found:', orderId);
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 }
          );
        }

        console.log('🔔 Stripe webhook - Order found:', {
          id: order.id,
          userEmail: order.user?.email,
          guestEmail: order.guestEmail,
          total: order.total,
          status: order.status
        });

        // Update the order status to PROCESSING (since payment is completed)
        console.log('🔔 Stripe webhook - Updating order status');
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PROCESSING',
          },
        });

        console.log('🔔 Stripe webhook - Order status updated successfully');

        // Create payment record
        console.log('🔔 Stripe webhook - Creating payment record');
        await prisma.payment.create({
          data: {
            orderId: orderId,
            provider: 'stripe',
            paymentId: session.payment_intent as string,
            amount: Number(session.amount_total) / 100, // Convert from cents
            status: 'COMPLETED',
          },
        });

        console.log('🔔 Stripe webhook - Payment record created successfully');

        // Send order confirmation email
        try {
          console.log('🔔 Stripe webhook - Sending order confirmation email');
          await sendOrderConfirmationEmail(orderId);
          console.log('🔔 Stripe webhook - Order confirmation email sent successfully');
        } catch (emailError) {
          console.error('🔔 Stripe webhook - Error sending confirmation email:', emailError);
          // Don't fail the webhook for email errors
        }

        console.log('🔔 Stripe webhook - Order processing completed successfully');

        return NextResponse.json({
          message: "Order processed successfully",
          orderId: orderId,
          orderType: order.userId ? 'authenticated' : 'guest'
        });
      } catch (error) {
        console.error('🔔 Stripe webhook - Error processing order:', error);
        return NextResponse.json(
          { error: "Error processing order" },
          { status: 500 }
        );
      }
    } else {
      console.log('🔔 Stripe webhook - Payment not completed, status:', session.payment_status);
    }
  } else {
    console.log('🔔 Stripe webhook - Unhandled event type:', event.type);
  }

  console.log('🔔 Stripe webhook - Webhook processing completed');
  return NextResponse.json({
    message: `Event ${event.type} received but not processed`,
  });
}