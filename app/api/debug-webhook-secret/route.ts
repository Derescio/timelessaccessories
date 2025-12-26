import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/auth-helpers';

export async function GET() {
  // Always require admin authentication for this sensitive endpoint
  const authResult = await requireAdmin();
  if (authResult.error) {
    return authResult.error;
  }

  // In production, don't expose secret preview at all
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      hasSecret: !!webhookSecret,
      secretLength: webhookSecret?.length || 0,
      environment: process.env.NODE_ENV,
      message: 'Secret preview disabled in production for security'
    });
  }
  
  return NextResponse.json({
    hasSecret: !!webhookSecret,
    secretLength: webhookSecret?.length || 0,
    secretPreview: webhookSecret?.substring(0, 20) + '...' || 'Not found',
    environment: process.env.NODE_ENV
  });
} 