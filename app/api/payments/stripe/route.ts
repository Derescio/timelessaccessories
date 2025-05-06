// import { NextResponse } from "next/server";
// import { auth } from "@/auth";
// import Stripe from "stripe";
// import { z } from "zod";
// import { db } from "@/lib/db";
// import { type Order, type Payment } from "@prisma/client";
// import { log } from "@/lib/logger";
// import { Decimal } from "@prisma/client/runtime/library";

// Initialize Stripe with the secret key
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
//     apiVersion: "2023-10-16" as any, // Use the latest API version with type assertion
// });

// Validation schema for the request body
// const paymentIntentSchema = z.object({
//     orderId: z.string().min(1, "Order ID is required"),
// });

// Type for order with payment included
// type OrderWithPayment = Order & {
//     payment?: Payment | null;
// };

export async function POST(request: Request) {

    const variable = request.headers.get('x-request-id') || '';
    //console.log(variable);

    //   try {
    //     // log.info("Stripe payment intent request received");

    //     // Get the request body first
    //     const body = await request.json();
    //     // log.info(`Request body: ${JSON.stringify(body)}`);

    //     const validation = paymentIntentSchema.safeParse(body);

    //     if (!validation.success) {
    //     //   log.error(`Validation error: ${JSON.stringify(validation.error.format())}`);
    //       return NextResponse.json(
    //         { success: false, error: validation.error.format() },
    //         { status: 400 }
    //       );
    //     }

    //     const { orderId } = validation.data;
    //     // log.info(`Creating Stripe payment intent for order: ${orderId}`);

    //     // Attempt to authenticate the user, but don't fail if no session
    //     const session = await auth();
    //     // log.info(`Authentication status: ${session ? "Authenticated" : "Not authenticated"}`);
    //     // log.info(`User ID from session: ${session?.user?.id || "none"}`);

    //     // Prepare order query based on authentication status
    //     const whereClause: any = {
    //       id: orderId,
    //     };

    //     // If user is authenticated, add the userId filter
    //     if (session?.user?.id) {
    //       whereClause.userId = session.user.id;
    //     //   log.info(`User authenticated: ${session.user.id}`);
    //     } else {
    //     //   log.warn(`No authenticated user for order: ${orderId}`);
    //     }

    //     //log.info(`Order query where clause: ${JSON.stringify(whereClause)}`);

    //     // Fetch the order from the database
    //     const order = await db.order.findUnique({
    //       where: whereClause,
    //       include: {
    //         payment: true,
    //       },
    //     }) as OrderWithPayment | null;

    //     if (!order) {
    //      // log.error(`Order not found: ${orderId}`);
    //       return NextResponse.json(
    //         { success: false, error: "Order not found" },
    //         { status: 404 }
    //       );
    //     }

    //     //log.info(`Order found: ${order.id}, User ID: ${order.userId}`);

    //     // Check if payment already exists and is not pending
    //     if (
    //       order.payment &&
    //       order.payment.status !== PaymentStatus.PENDING &&
    //       order.payment.status !== PaymentStatus.FAILED
    //     ) {
    //       //log.warn(`Order ${orderId} is already paid with status: ${order.payment.status}`);
    //       return NextResponse.json(
    //         { success: false, error: "Order is already paid" },
    //         { status: 400 }
    //       );
    //     }

    //     // Calculate amount in cents (Stripe uses smallest currency unit)
    //     const amount = Math.round(parseFloat(String(order.total)) * 100);
    //   //  log.info(`Creating payment intent for amount: ${amount} cents ($${order.total})`);

    //     try {
    //       // Create a PaymentIntent with the order amount and currency
    //       const paymentIntent = await stripe.paymentIntents.create({
    //         amount,
    //         currency: "usd",
    //         metadata: {
    //           orderId: order.id,
    //           userId: order.userId || "",
    //         },
    //         automatic_payment_methods: {
    //           enabled: true,
    //         },
    //       });

    //      // log.info(`Payment intent created: ${paymentIntent.id}`);
    //      // log.debug(`Payment intent details: ${JSON.stringify(paymentIntent)}`);

    //       // Update or create payment record in database
    //     //   if (order.payment) {
    //     //     await db.payment.update({
    //     //       where: { id: order.payment.id },
    //     //       data: {
    //     //         status: PaymentStatus.PENDING,
    //     //         paymentId: paymentIntent.id,
    //     //       },
    //     //     });
    //     //     //log.info(`Updated existing payment record: ${order.payment.id}`);
    //     //   } else {
    //     //     await db.payment.create({
    //     //       data: {
    //     //         orderId: order.id,
    //     //         amount: new Decimal(order.total.toString()),
    //     //         provider: "Stripe",
    //     //         status: PaymentStatus.PENDING,
    //     //         paymentId: paymentIntent.id,
    //     //       },
    //     //     });
    //     //     log.info(`Created new payment record for order: ${order.id}`);
    //     //   }

    //       // Return the client secret
    //       const responseData = {
    //         success: true,
    //         clientSecret: paymentIntent.client_secret,
    //       };

    //       log.info(`Returning success response with client secret`);
    //       return NextResponse.json(responseData);
    //     } catch (stripeError: any) {
    //       log.error(`Stripe API error: ${stripeError.message}`);
    //       log.error(`Stripe error details: ${JSON.stringify(stripeError)}`);

    //       return NextResponse.json(
    //         { success: false, error: `Stripe API error: ${stripeError.message}` },
    //         { status: 500 }
    //       );
    //     }
    //   } catch (error: any) {
    //     log.error(`Error creating payment intent: ${error.message}`);
    //     log.error(`Error stack: ${error.stack}`);

    //     return NextResponse.json(
    //       { success: false, error: "Failed to create payment intent" },
    //       { status: 500 }
    //     );
    //   }
} 