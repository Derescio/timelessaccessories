import { NextResponse } from "next/server";
import { getOrderWithItems } from "@/lib/actions/order.actions";

export async function GET(request: Request) {
  try {
    // Get orderId from query string
    const url = new URL(request.url);
    const orderId = url.searchParams.get('id');
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch order with items
    const result = await getOrderWithItems(orderId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    // Return order data
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
} 