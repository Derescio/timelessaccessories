import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { savePaymentResult } from "@/lib/actions/payment.actions";

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
    const { orderId, amount } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // For COD, we create a pending payment that will be updated upon delivery
    const paymentId = `cod_${Date.now()}`;

    // Save payment result to database with PENDING status
    const result = await savePaymentResult({
      orderId,
      paymentId,
      paymentProvider: "COD",
      amount,
      status: "PENDING", // COD payments start as pending
      details: JSON.stringify({
        provider: "COD",
        orderId,
        paymentMethod: "Cash on Delivery",
        timestamp: new Date().toISOString(),
        customerEmail: session.user.email,
      }),
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      paymentId,
    });
  } catch (error) {
    console.error("COD order error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to process order",
      },
      { status: 500 }
    );
  }
} 