// import { NextRequest, NextResponse } from "next/server";
// import Stripe from "stripe";
// import { prisma } from "@/lib/prisma";
// import { log } from "@/lib/logger";
// import { OrderStatus, PaymentStatus } from "@prisma/client";
// import { cleanupCartAfterSuccessfulPayment } from "@/lib/actions/cart.actions";
// import { updateOrderToPaid } from "@/lib/actions/order.actions";

// // Initialize Stripe with the secret API key from environment variables
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// // Define the POST handler function for the Stripe webhook
// export async function POST(req: NextRequest) {
//   try {
//     log.info(`Stripe webhook received at ${new Date().toISOString()}`);

//     // Construct the event using the raw request body, the Stripe signature header, and the webhook secret.
//     // This ensures that the request is indeed from Stripe and has not been tampered with.
//     const signature = req.headers.get('stripe-signature');

//     if (!signature) {
//       log.error('Missing stripe-signature header in webhook request');
//       return NextResponse.json(
//         { error: "Missing stripe-signature header" },
//         { status: 400 }
//       );
//     }

//     const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
//     const testWebhookSecret = process.env.NODE_ENV === 'development' ? 'whsec_test_12345678901234567890123456789012' : '';

//     const body = await req.text();
//     let event: Stripe.Event;

//     try {
//       event = stripe.webhooks.constructEvent(
//         body,
//         signature,
//         webhookSecret || testWebhookSecret
//       );
//       log.info(`Received Stripe webhook event: ${event.type}`);
//     } catch (err: any) {
//       log.error(`⚠️ Webhook signature verification failed: ${err.message}`);
//       return NextResponse.json(
//         { error: `Webhook signature verification failed: ${err.message}` },
//         { status: 400 }
//       );
//     }

//     // charge.succeeded indicates a successful payment
//     if (event.type === 'charge.succeeded') {
//       // Retrieve the order ID from the payment metadata
//       const { object } = event.data;
//       const charge = object as Stripe.Charge;

//       if (!charge.metadata?.orderId) {
//         log.error(`No orderId found in charge metadata: ${charge.id}`);
//         return NextResponse.json(
//           { error: "No orderId in charge metadata" },
//           { status: 400 }
//         );
//       }

//       log.info(`Processing payment for order: ${charge.metadata.orderId}`);

//       try {
//         // Update the order status to paid
//         await updateOrderToPaid({
//           orderId: charge.metadata.orderId,
//           paymentResult: {
//             id: charge.id,
//             status: 'COMPLETED',
//             email_address: charge.billing_details?.email || 'no-email@example.com',
//             pricePaid: (charge.amount / 100).toFixed(2),
//           },
//         });

//         log.info(`✅ Order ${charge.metadata.orderId} marked as paid via Stripe webhook`);

//         return NextResponse.json({
//           message: "updateOrderToPaid was successful",
//           orderId: charge.metadata.orderId
//         });
//       } catch (error) {
//         log.error(`❌ Error updating order: ${error}`);
//         return NextResponse.json(
//           { error: `Error updating order: ${error}` },
//           { status: 500 }
//         );
//       }
//     }

//     return NextResponse.json({
//       message: `Event ${event.type} received but not processed`,
//     });
//   } catch (error: any) {
//     log.error(`Webhook error: ${error.message}`);
//     return NextResponse.json(
//       { error: `Webhook error: ${error.message}` },
//       { status: 500 }
//     );
//   }
// } 





import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order.actions';

// Initialize Stripe with the secret API key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Define the POST handler function for the Stripe webhook
export async function POST(req: NextRequest) {
  // Construct the event using the raw request body, the Stripe signature header, and the webhook secret.
  // This ensures that the request is indeed from Stripe and has not been tampered with.
  const event = await stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get('stripe-signature') as string,
    process.env.STRIPE_WEBHOOK_SECRET as string
  );
  //console.log(event)
  // charge.succeeded indicates a successful payment
  if (event.type === 'charge.succeeded') {
    // Retrieve the order ID from the payment metadata
    const { object } = event.data;

    // Update the order status to paid
    await updateOrderToPaid({
      orderId: object.metadata.orderId,
      paymentResult: {
        id: object.id,
        status: 'COMPLETED',
        email_address: object.billing_details.email!,
        pricePaid: (object.amount / 100).toFixed(),
      },
    });

    return NextResponse.json({
      message: 'updateOrderToPaid was successful',
    });
  }
  return NextResponse.json({
    message: 'event is not charge.succeeded',
  });
}