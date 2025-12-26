import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils/auth-helpers';

export async function GET() {
  try {
    // Require admin authentication
    const authResult = await requireAdmin();
    if (authResult.error) {
      return authResult.error;
    }

    console.log('🔄 Fetching Printify products...');

    // Fetch products from database that have Printify integration
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { fulfillmentType: 'PRINTIFY_POD' },
          { fulfillmentType: 'HYBRID' },
          { printifyProductId: { not: null } }
        ]
      },
      include: {
        inventories: {
          select: {
            id: true,
            images: true,
            retailPrice: true,
            isDefault: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log(`✅ Found ${products.length} Printify products`);

    // Transform data to match PrintifyProducts component interface
    const transformedProducts = products.map(product => {
      // Get default inventory for images and pricing
      const defaultInventory = product.inventories.find(inv => inv.isDefault) || product.inventories[0];
      
      return {
        id: product.id,
        title: product.name, // Map name -> title for component compatibility
        description: product.description,
        images: defaultInventory?.images || [],
        printifyProductId: product.printifyProductId,
        fulfillmentType: product.fulfillmentType,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        // Additional useful info
        category: product.category.name,
        price: defaultInventory?.retailPrice || 0,
        variants: product.inventories.length
      };
    });

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      count: transformedProducts.length
    });

  } catch (error) {
    console.error('❌ Error fetching Printify products:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Printify products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 