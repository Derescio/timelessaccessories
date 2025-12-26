import { NextRequest, NextResponse } from 'next/server';
import { createPrintifyClient } from '@/lib/services/printify';
import { requireAdmin } from '@/lib/utils/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin();
    if (authResult.error) {
      return authResult.error;
    }

    // Check if required environment variables are set
    if (!process.env.PRINTIFY_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Printify API token not configured' },
        { status: 500 }
      );
    }

    console.log('🔄 Fetching Printify catalog...');

    // Create Printify client
    const printifyClient = createPrintifyClient();

    // Fetch catalog
    const blueprints = await printifyClient.getCatalog();

    console.log(`✅ Retrieved ${blueprints.length} products from Printify catalog`);

    return NextResponse.json({
      success: true,
      blueprints,
      total: blueprints.length,
    });

  } catch (error) {
    console.error('❌ Error fetching Printify catalog:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Printify catalog',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 