import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { paypal } from "@/lib/paypal/paypal";
import { db } from "@/lib/db";

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

    // Get order from database to verify it exists
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Create PayPal order - Pass orderId as custom_id for webhook processing
    const paypalOrder = await paypal.createOrder(amount, orderId);
    
    if (!paypalOrder || !paypalOrder.id) {
      throw new Error("Failed to create PayPal order");
    }

    return NextResponse.json({
      success: true,
      message: "PayPal order created successfully",
      paypalOrderId: paypalOrder.id,
    });
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create PayPal order",
      },
      { status: 500 }
    );
  }
} 