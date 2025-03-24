import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { approvePayPalOrder } from '@/lib/actions/order.actions';

export async function POST(request: NextRequest) {
  try {
    // In some cases, we might receive a retry request after a successful payment
    // This prevents duplicate processing
    //const requestId = request.headers.get('x-request-id') || '';
    //console.log(`Processing PayPal capture request ID: ${requestId}`);

    const session = await auth();

    if (!session) {
      console.warn('Unauthorized payment capture attempt without session');
      return NextResponse.json(
        { success: false, message: 'You must be logged in to complete payment' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, paypalOrderId } = body;

    if (!orderId || !paypalOrderId) {
      console.error('Missing required parameters', { orderId, paypalOrderId });
      return NextResponse.json(
        { success: false, message: 'Order ID and PayPal Order ID are required' },
        { status: 400 }
      );
    }

    //console.log(`Capturing PayPal payment for order ${orderId} with PayPal ID ${paypalOrderId}`);
    const result = await approvePayPalOrder(orderId, { orderID: paypalOrderId });

    if (!result.success) {
      console.error('Payment capture failed', result);
      return NextResponse.json(
        { success: false, message: result.message || 'Payment capture failed' },
        { status: 400 }
      );
    }

    //console.log('Payment captured successfully', { orderId, paypalOrderId });
    return NextResponse.json({
      success: true,
      message: result.message || 'Payment processed successfully',
      redirectUrl: result.redirectTo
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error capturing PayPal payment:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to capture PayPal payment',
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 