import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { approvePayPalOrder } from '@/lib/actions/order.actions';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to complete payment' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, paypalOrderId } = body;

    if (!orderId || !paypalOrderId) {
      return NextResponse.json(
        { error: 'Order ID and PayPal Order ID are required' },
        { status: 400 }
      );
    }

    const result = await approvePayPalOrder(orderId, { orderID: paypalOrderId });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      redirectUrl: result.redirectTo
    });
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return NextResponse.json(
      { error: 'Failed to capture PayPal payment' },
      { status: 500 }
    );
  }
} 