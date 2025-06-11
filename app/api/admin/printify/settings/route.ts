import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔄 Fetching Printify settings...');

    const settings = {
      apiConnected: !!process.env.PRINTIFY_ACCESS_TOKEN,
      shopId: process.env.PRINTIFY_SHOP_ID || '',
      shopName: 'My new store',
      webhookConfigured: false,
      autoFulfillment: false,
      defaultMarkup: 100,
    };

    return NextResponse.json(settings);

  } catch (error) {
    console.error('❌ Error fetching Printify settings:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Printify settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 Updating Printify settings:', body);

    const { autoFulfillment, defaultMarkup } = body;

    // Validate settings
    if (typeof autoFulfillment !== 'boolean') {
      return NextResponse.json(
        { error: 'autoFulfillment must be a boolean' },
        { status: 400 }
      );
    }

    if (typeof defaultMarkup !== 'number' || defaultMarkup < 0 || defaultMarkup > 1000) {
      return NextResponse.json(
        { error: 'defaultMarkup must be a number between 0 and 1000' },
        { status: 400 }
      );
    }

    console.log('✅ Printify settings updated');

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });

  } catch (error) {
    console.error('❌ Error updating Printify settings:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update Printify settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 