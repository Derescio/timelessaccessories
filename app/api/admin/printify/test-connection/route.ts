import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/auth-helpers';

export async function POST() {
  try {
    // Require admin authentication
    const authResult = await requireAdmin();
    if (authResult.error) {
      return authResult.error;
    }

    console.log('🔄 Testing Printify API connection...');

    // Check if required environment variables are set
    if (!process.env.PRINTIFY_ACCESS_TOKEN) {
      return NextResponse.json(
        { 
          error: 'Printify API token not configured',
          details: 'PRINTIFY_ACCESS_TOKEN environment variable is missing'
        },
        { status: 400 }
      );
    }

    const baseUrl = 'https://api.printify.com/v1';
    const headers = {
      'Authorization': `Bearer ${process.env.PRINTIFY_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'shop-dw/1.0',
    };

    // Test API connection by fetching shops
    console.log('📡 Making API request to Printify...');
    const response = await fetch(`${baseUrl}/shops.json`, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Printify API error:', response.status, errorText);
      
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Invalid Printify API token',
            details: 'The provided API token is not valid or has expired'
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Printify API connection failed',
          details: `HTTP ${response.status}: ${response.statusText}`
        },
        { status: 500 }
      );
    }

    const shops = await response.json();
    console.log('✅ Printify API connection successful');
    console.log('🏪 Retrieved shops:', shops.length);

    // Find the primary shop or use the first one
    let primaryShop = shops.find((shop: any) => shop.sales_channel === 'api') || shops[0];
    
    if (!primaryShop && shops.length > 0) {
      primaryShop = shops[0];
    }

    if (!primaryShop) {
      return NextResponse.json(
        { 
          error: 'No shops found',
          details: 'Your Printify account has no shops configured'
        },
        { status: 400 }
      );
    }

    // Additional validation: try to fetch catalog to ensure full API access
    const catalogResponse = await fetch(`${baseUrl}/catalog/blueprints.json`, { headers });
    if (!catalogResponse.ok) {
      console.warn('⚠️ Could not access catalog, but shop access works');
    }

    console.log('🎉 Connection test completed successfully');

    return NextResponse.json({
      success: true,
      shopId: primaryShop.id,
      shopName: primaryShop.title,
      salesChannel: primaryShop.sales_channel,
      totalShops: shops.length,
      catalogAccess: catalogResponse.ok,
      message: 'Printify API connection successful'
    });

  } catch (error) {
    console.error('❌ Printify connection test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 