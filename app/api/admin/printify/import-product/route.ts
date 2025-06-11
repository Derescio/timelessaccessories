import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPrintifyClient } from '@/lib/services/printify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 Starting product import from Printify...');

    // Validate request body
    const { blueprintId, printProviderId, markup = 100, categoryId } = body;

    if (!blueprintId || !printProviderId || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: blueprintId, printProviderId, categoryId' },
        { status: 400 }
      );
    }

    if (typeof markup !== 'number' || markup < 0 || markup > 1000) {
      return NextResponse.json(
        { error: 'Markup must be a number between 0 and 1000' },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      );
    }

    console.log(`📦 Importing blueprint ${blueprintId} with ${markup}% markup`);

    // Create Printify client and fetch blueprint details
    const printifyClient = createPrintifyClient();
    const blueprint = await printifyClient.getBlueprint(blueprintId);
    
    // Get available print providers for this blueprint
    const printProviders = await printifyClient.getBlueprintPrintProviders(blueprintId);
    
    if (!printProviders || printProviders.length === 0) {
      return NextResponse.json(
        { error: 'No print providers available for this blueprint' },
        { status: 400 }
      );
    }

    // Use the provided print provider or default to the first available one
    let actualPrintProviderId = printProviderId;
    if (!printProviders.find(pp => pp.id === printProviderId)) {
      actualPrintProviderId = printProviders[0].id;
      console.log(`📌 Print provider ${printProviderId} not available. Using ${actualPrintProviderId} instead.`);
    }
    
    // Get variants and pricing from Printify
    const variants = await printifyClient.getBlueprintVariants(blueprintId, actualPrintProviderId);

    console.log(`✅ Retrieved blueprint: ${blueprint.title}`);
    console.log(`📋 Found ${variants.length} variants`);

    // Create slug from title
    const baseSlug = blueprint.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Start transaction to create product and inventories
    const result = await prisma.$transaction(async (tx) => {
      // Create the main Product record
      const product = await tx.product.create({
        data: {
          name: blueprint.title,
          description: blueprint.description || `${blueprint.brand} ${blueprint.model} - Print on demand product`,
          slug,
          categoryId,
          isActive: true,
          fulfillmentType: 'PRINTIFY_POD',
          printifyProductId: null, // Will be created when first order comes in
          printifyShopId: parseInt(process.env.PRINTIFY_SHOP_ID!),
          metadata: {
            blueprint: blueprint as any,
            printProviderId: actualPrintProviderId,
            requestedPrintProviderId: printProviderId,
            availablePrintProviders: printProviders,
            importedAt: new Date().toISOString(),
            originalMarkup: markup
          }
        }
      });

      // Create ProductInventory records for each variant
      const inventoryRecords = [];
      
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        
        // Generate SKU
        const sku = `PF-${blueprintId}-${variant.id}`;
        
        // Calculate pricing (this is simplified - you might want more complex pricing logic)
        const baseCost = 15.00; // Placeholder - you'd get this from Printify pricing API
        const costPrice = baseCost;
        const retailPrice = costPrice * (1 + markup / 100);

        const inventoryData = {
          productId: product.id,
          sku,
          costPrice,
          retailPrice,
          compareAtPrice: null,
          quantity: 999999, // POD has unlimited stock
          reservedStock: 0,
          lowStock: 0,
          images: blueprint.images || [],
          attributes: {
            printifyVariantId: variant.id,
            options: variant.options,
            placeholders: variant.placeholders
          },
          isDefault: i === 0, // First variant is default
          printifyVariantId: variant.id.toString(),
        };

        const inventory = await tx.productInventory.create({
          data: inventoryData
        });

        inventoryRecords.push(inventory);
      }

      console.log(`✅ Created product: ${product.name}`);
      console.log(`📦 Created ${inventoryRecords.length} inventory variants`);

      return {
        product,
        inventories: inventoryRecords
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Product imported successfully',
      product: {
        id: result.product.id,
        name: result.product.name,
        slug: result.product.slug,
        variants: result.inventories.length
      }
    });

  } catch (error) {
    console.error('❌ Error importing Printify product:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Printify API')) {
        return NextResponse.json(
          { error: 'Failed to fetch product from Printify', details: error.message },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to import product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 