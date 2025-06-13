import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, promotionId } = await req.json();
    if (!email || !promotionId) {
      return NextResponse.json({ success: false, error: 'Missing email or promotionId' }, { status: 400 });
    }
    const order = await db.order.findFirst({
      where: {
        guestEmail: email,
        status: 'PROCESSING',
        appliedPromotionId: promotionId,
      },
      select: { id: true },
    });
    return NextResponse.json({ success: true, used: !!order });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
} 