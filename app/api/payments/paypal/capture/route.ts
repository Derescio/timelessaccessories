import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { savePaymentResult } from "@/lib/actions/payment.actions";
import { db } from "@/lib/db";
import { paypal } from "@/lib/paypal/paypal";

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { orderId, paypalOrderId } = body;

    if (!orderId || !paypalOrderId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the order from the database
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Capture the PayPal payment
    const captureData = await paypal.capturePayment(paypalOrderId);
    
    if (!captureData || captureData.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, message: "Payment capture failed" },
        { status: 400 }
      );
    }

    // Save payment result to database
    const result = await savePaymentResult({
      orderId,
      paymentId: captureData.id,
      paymentProvider: "PayPal",
      amount: Number(order.total),
      status: "COMPLETED",
      details: JSON.stringify({
        provider: "PayPal",
        transactionId: captureData.id,
        payerEmail: captureData.payer?.email_address || '',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to save payment result");
    }

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      paymentId: captureData.id,
    });
  } catch (error) {
    console.error("Error capturing PayPal payment:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to process payment",
      },
      { status: 500 }
    );
  }
} 