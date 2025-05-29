import { NextResponse } from "next/server";
import { updateOrderPaymentStatus } from "@/lib/actions/payment.actions";
import { cleanupCartAfterSuccessfulPayment } from "@/lib/actions/cart.actions";
import { PaymentStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    // Get the raw request body
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    //console.log("Received PayPal webhook:", payload.event_type);

    // In production, you should verify the webhook signature here
    // const isVerified = await verifyPayPalWebhook(request.headers, rawBody);
    // if (!isVerified) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    // }

    // Process webhook event
    if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      // Extract order ID from custom_id field in the payload
      const customId = payload.resource?.purchase_units?.[0]?.custom_id;

      if (customId) {
        // Update order and payment status
        await updateOrderPaymentStatus({
          orderId: customId,
          status: PaymentStatus.COMPLETED,
          paymentId: payload.resource.id,
          paymentMethod: "PayPal"
        });

        // Clean up cart
        await cleanupCartAfterSuccessfulPayment(customId);
      } else {
        console.error("Missing custom_id in PayPal webhook payload");
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PAYPAL_WEBHOOK_ERROR]", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
} 