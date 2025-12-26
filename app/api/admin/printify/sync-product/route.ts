import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPrintifyClient } from '@/lib/services/printify';
import { requireAdmin } from '@/lib/utils/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin();
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Syncing product ${productId} with Printify...`);

    // Get the local product
    const localProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventories: true
      }
    });

    if (!localProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!localProduct.printifyProductId) {
      // This is a POD product that hasn't been created in Printify yet
      // We can sync with blueprint data instead
      const metadata = localProduct.metadata as any;
      const blueprintId = metadata?.blueprint?.id;
      
      if (!blueprintId) {
        return NextResponse.json(
          { error: 'Product has no Printify product ID or blueprint data' },
          { status: 400 }
        );
      }

      console.log(`📋 Product not yet created in Printify, syncing with blueprint ${blueprintId}...`);
      
      // Create Printify client and get blueprint data
      const printifyClient = createPrintifyClient();
      const blueprint = await printifyClient.getBlueprint(blueprintId);
      
      // Track what changes we're making
      const changes: any = {};
      const updates: any = {};

      // Sync basic product info with blueprint data
      if (blueprint.title !== localProduct.name) {
        changes.name = { from: localProduct.name, to: blueprint.title };
        updates.name = blueprint.title;
      }

      if (blueprint.description && blueprint.description !== localProduct.description) {
        changes.description = { from: localProduct.description, to: blueprint.description };
        updates.description = blueprint.description;
      }

      // Update product if there are changes
      if (Object.keys(updates).length > 0) {
        await prisma.product.update({
          where: { id: productId },
          data: {
            ...updates,
            updatedAt: new Date()
          }
        });
        console.log(`📝 Updated product with ${Object.keys(updates).length} changes from blueprint`);
      }

      const totalChanges = Object.keys(changes).length;
      
      return NextResponse.json({
        success: true,
        message: totalChanges > 0 
          ? `Product synced with blueprint data (${totalChanges} changes)` 
          : 'Product is already up to date with blueprint',
        changes,
        note: 'Printify product will be created when first order is placed'
      });
    }

    // Create Printify client and fetch latest data
    const printifyClient = createPrintifyClient();
    
    // Try to get the product from Printify shop first
    let printifyProduct;
    try {
      printifyProduct = await printifyClient.getProduct(localProduct.printifyProductId);
    } catch (error) {
      // If product doesn't exist in shop, try to get blueprint data
      if (error instanceof Error && error.message.includes('404')) {
        console.log('Product not found in Printify shop, fetching blueprint data...');
        const blueprint = await printifyClient.getBlueprint(parseInt(localProduct.printifyProductId));
        
        return NextResponse.json({
          success: true,
          message: 'Product synced with catalog data',
          changes: {
            name: blueprint.title !== localProduct.name ? blueprint.title : null,
            description: blueprint.description !== localProduct.description ? blueprint.description : null
          }
        });
      }
      throw error;
    }

    console.log(`✅ Retrieved Printify product: ${printifyProduct.title}`);

    // Track what changes we're making
    const changes: any = {};
    const updates: any = {};

    // Sync basic product info
    if (printifyProduct.title !== localProduct.name) {
      changes.name = { from: localProduct.name, to: printifyProduct.title };
      updates.name = printifyProduct.title;
    }

    if (printifyProduct.description !== localProduct.description) {
      changes.description = { from: localProduct.description, to: printifyProduct.description };
      updates.description = printifyProduct.description;
    }

    // Update product if there are changes
    if (Object.keys(updates).length > 0) {
      await prisma.product.update({
        where: { id: productId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });
      console.log(`📝 Updated product with ${Object.keys(updates).length} changes`);
    }

    // Sync inventory data (images, etc.)
    const inventoryChanges = [];
    for (const inventory of localProduct.inventories) {
      if (inventory.printifyVariantId) {
        // Find matching variant in Printify product
        const printifyVariant = printifyProduct.variants.find(
          v => v.id.toString() === inventory.printifyVariantId
        );

        if (printifyVariant) {
          const inventoryUpdates: any = {};
          
          // Sync images if they've changed
          const printifyImages = printifyProduct.images
            .filter(img => img.variant_ids.includes(printifyVariant.id))
            .map(img => img.src);

          if (JSON.stringify(inventory.images) !== JSON.stringify(printifyImages)) {
            inventoryUpdates.images = printifyImages;
            inventoryChanges.push({
              sku: inventory.sku,
              change: 'images',
              from: inventory.images.length,
              to: printifyImages.length
            });
          }

          // Update inventory if needed
          if (Object.keys(inventoryUpdates).length > 0) {
            await prisma.productInventory.update({
              where: { id: inventory.id },
              data: inventoryUpdates
            });
          }
        }
      }
    }

    const totalChanges = Object.keys(changes).length + inventoryChanges.length;
    
    if (totalChanges === 0) {
      return NextResponse.json({
        success: true,
        message: 'Product is already up to date',
        changes: {}
      });
    }

    console.log(`✅ Sync completed with ${totalChanges} changes`);

    return NextResponse.json({
      success: true,
      message: `Product synced successfully with ${totalChanges} changes`,
      changes: {
        product: changes,
        inventory: inventoryChanges
      }
    });

  } catch (error) {
    console.error('❌ Error syncing product:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to sync product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 