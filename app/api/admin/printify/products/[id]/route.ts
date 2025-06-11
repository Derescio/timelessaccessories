import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting product ${id}...`);

    // Check if product exists and get its details
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        inventories: true,
        orderItems: true,
        cartItems: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has active orders
    if (product.orderItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete product with existing orders',
          details: `This product has ${product.orderItems.length} order items. Archive it instead.`
        },
        { status: 409 }
      );
    }

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // First, delete cart items (these are safe to delete)
      if (product.cartItems.length > 0) {
        await tx.cartItem.deleteMany({
          where: { productId: id }
        });
        console.log(`🧹 Removed ${product.cartItems.length} cart items`);
      }

      // Delete product inventories (this will cascade delete related records)
      await tx.productInventory.deleteMany({
        where: { productId: id }
      });
      console.log(`📦 Deleted ${product.inventories.length} inventory records`);

      // Finally, delete the product itself
      await tx.product.delete({
        where: { id }
      });

      return {
        deletedProduct: product.name,
        deletedInventories: product.inventories.length,
        removedFromCarts: product.cartItems.length
      };
    });

    console.log(`✅ Successfully deleted product: ${result.deletedProduct}`);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      details: result
    });

  } catch (error) {
    console.error('❌ Error deleting product:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { 
            error: 'Cannot delete product due to dependencies',
            details: 'This product is referenced by other records. Try archiving it instead.'
          },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: Add a PATCH endpoint for archiving instead of deleting
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { action } = body;

    if (action === 'archive') {
      console.log(`📁 Archiving product ${id}...`);

      const product = await prisma.product.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Product archived successfully',
        product: {
          id: product.id,
          name: product.name,
          isActive: product.isActive
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: archive' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error updating product:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 