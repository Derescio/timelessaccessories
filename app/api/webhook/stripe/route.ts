import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
//import { updateOrderToPaid } from "@/lib/actions/order.actions";
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

  // Handle checkout.session.completed events
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

      return await processOrderPayment(orderId, session.payment_intent as string, 'checkout_session');
    } else {
      console.log('🔔 Stripe webhook - Payment not completed, status:', session.payment_status);
    }
  }
  
  // Handle charge.succeeded events (for Payment Elements)
  else if (event.type === 'charge.succeeded') {
    const charge = event.data.object as Stripe.Charge;
    console.log('🔔 Stripe webhook - Charge succeeded');
    console.log('🔔 Stripe webhook - Charge ID:', charge.id);
    console.log('🔔 Stripe webhook - Payment Intent:', charge.payment_intent);
    console.log('🔔 Stripe webhook - Amount:', charge.amount);
    console.log('🔔 Stripe webhook - Status:', charge.status);

    const orderId = charge.metadata?.orderId;
    console.log('🔔 Stripe webhook - Order ID from charge metadata:', orderId);

    if (!orderId) {
      console.error('🔔 Stripe webhook - No order ID found in charge metadata');
      return NextResponse.json(
        { error: "No order ID found in charge metadata" },
        { status: 400 }
      );
    }

    return await processOrderPayment(orderId, charge.payment_intent as string, 'charge', charge.id);
  }
  
  else {
    console.log('🔔 Stripe webhook - Unhandled event type:', event.type);
  }

  console.log('🔔 Stripe webhook - Webhook processing completed');
  return NextResponse.json({
    message: `Event ${event.type} received but not processed`,
  });
}

// Helper function to process order payment
async function processOrderPayment(orderId: string, paymentIntentId: string, eventType: string, chargeId?: string) {
  try {
    console.log(`🔔 Stripe webhook - Processing ${eventType} for order:`, orderId);
    
    // Get the order from the database
    const order = await db.order.findUnique({
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
      status: order.status,
      isGuest: !order.userId
    });

    // Check if order is already processed
    if (order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      console.log('🔔 Stripe webhook - Order already processed, status:', order.status);
      return NextResponse.json({
        message: "Order already processed",
        orderId: orderId,
        status: order.status
      });
    }

    // Update the order status to PROCESSING
    console.log('🔔 Stripe webhook - Updating order status to PROCESSING');
    await db.order.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        chargeId: chargeId || undefined,
      },
    });

    console.log('🔔 Stripe webhook - Order status updated successfully');

    // Create or update payment record
    console.log('🔔 Stripe webhook - Creating/updating payment record');
    
    // Check if payment record already exists
    const existingPayment = await db.payment.findFirst({
      where: { orderId: orderId }
    });

    if (existingPayment) {
      console.log('🔔 Stripe webhook - Updating existing payment record');
      await db.payment.update({
        where: { id: existingPayment.id },
        data: {
          paymentId: paymentIntentId,
          status: 'COMPLETED',
          lastUpdated: new Date(),
        },
      });
    } else {
      console.log('🔔 Stripe webhook - Creating new payment record');
      await db.payment.create({
        data: {
          orderId: orderId,
          provider: 'stripe',
          paymentId: paymentIntentId,
          amount: Number(order.total),
          status: 'COMPLETED',
        },
      });
    }

    console.log('🔔 Stripe webhook - Payment record processed successfully');

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
      orderType: order.userId ? 'authenticated' : 'guest',
      eventType: eventType
    });
  } catch (error) {
    console.error('🔔 Stripe webhook - Error processing order payment:', error);
    return NextResponse.json(
      { error: "Error processing order payment" },
      { status: 500 }
    );
  }
}