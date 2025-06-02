import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cleanupExpiredReservations } from '@/lib/actions/inventory.actions';

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin (for manual triggers)
    const session = await auth();
    
    // Allow cron jobs with special header or admin users
    const cronSecret = req.headers.get('x-cron-secret');
    const isValidCron = cronSecret === process.env.CRON_SECRET;
    const isAdmin = session?.user?.role === 'ADMIN';
    
    if (!isValidCron && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get hours parameter (default to 2 hours)
    const body = await req.json().catch(() => ({}));
    const hoursOld = body.hoursOld || 2;

    console.log(`🧹 Stock cleanup triggered - releasing reservations older than ${hoursOld} hours`);
    
    // Run the cleanup
    const result = await cleanupExpiredReservations(hoursOld);
    
    if (result.success) {
      const itemsReleased = result.reservedQuantity || 0;
      console.log(`✅ Stock cleanup completed - ${itemsReleased} items released`);
      
      return NextResponse.json({ 
        success: true,
        message: `Stock cleanup completed successfully`,
        itemsReleased,
        hoursOld
      });
    } else {
      console.error(`❌ Stock cleanup failed:`, result.error);
      
      return NextResponse.json({ 
        success: false,
        error: result.error || 'Cleanup failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in stock cleanup API:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Allow GET requests for health checks
export async function GET() {
  return NextResponse.json({ 
    message: 'Stock cleanup endpoint is healthy',
    usage: 'POST with optional {hoursOld: number} in body'
  });
} 