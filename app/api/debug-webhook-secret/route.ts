import { NextResponse } from 'next/server';

export async function GET() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  return NextResponse.json({
    hasSecret: !!webhookSecret,
    secretLength: webhookSecret?.length || 0,
    secretPreview: webhookSecret?.substring(0, 20) + '...' || 'Not found',
    environment: process.env.NODE_ENV
  });
} 