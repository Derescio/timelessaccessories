import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
    
    if (!paypalClientId) {
      return NextResponse.json(
        { error: 'PayPal client ID not configured' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      clientId: paypalClientId,
    });
  } catch (error) {
    console.error('Error fetching PayPal client ID:', error);
    return NextResponse.json(
      { error: 'Failed to get PayPal configuration' },
      { status: 500 }
    );
  }
} 