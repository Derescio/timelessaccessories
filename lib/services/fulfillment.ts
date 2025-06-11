import { db } from '@/lib/db';
import { FulfillmentType, FulfillmentStatus } from '@prisma/client';
import { 
  createPrintifyClient, 
  convertOrderToPrintifyFormat,
  type FulfillmentResult,
  type PrintifyOrder 
} from './printify';
import { reduceActualStock } from '@/lib/actions/inventory.actions';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  inventoryId: string;
  quantity: number;
  inventory: {
    sku: string;
    quantity: number;
    reservedStock: number;
    printifyVariantId?: string | null;
  };
  product: {
    name: string;
    fulfillmentType: FulfillmentType;
    printifyProductId?: string | null;
  };
}

export interface OrderWithItems {
  id: string;
  guestEmail?: string | null;
  shippingAddress: any;
  total: number;
  user?: {
    email: string;
  } | null;
  items: OrderItem[];
}

export class FulfillmentService {
  static async processOrder(orderId: string): Promise<FulfillmentResult> {
    console.log(`🔄 FulfillmentService: Processing order ${orderId}`);

    try {
      // Get order with all items and related data
      const order = await this.getOrderWithItems(orderId);
      
      if (!order) {
        return {
          success: false,
          error: 'Order not found'
        };
      }

      console.log(`📋 Order ${orderId}: Found ${order.items.length} items to fulfill`);

      // Process each item based on its fulfillment type
      const itemResults = await Promise.allSettled(
        order.items.map(item => this.processOrderItem(item, order))
      );

      // Analyze results
      const successfulItems: any[] = [];
      const failedItems: any[] = [];

      itemResults.forEach((result, index) => {
        const item = order.items[index];
        if (result.status === 'fulfilled') {
          successfulItems.push({
            item,
            result: result.value
          });
        } else {
          failedItems.push({
            item,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      // Update order fulfillment status
      if (failedItems.length === 0) {
        await this.updateOrderFulfillmentStatus(orderId, 'PROCESSING');
        console.log(`✅ FulfillmentService: All items fulfilled successfully for order ${orderId}`);
        
        return {
          success: true,
          printifyOrderId: successfulItems.find(s => s.result.printifyOrderId)?.result.printifyOrderId
        };
      } else {
        await this.updateOrderFulfillmentStatus(orderId, 'FAILED');
        console.error(`❌ FulfillmentService: ${failedItems.length} items failed for order ${orderId}`);
        
        return {
          success: false,
          error: `Failed to fulfill ${failedItems.length} out of ${order.items.length} items`,
          failedItems
        };
      }

    } catch (error) {
      console.error(`❌ FulfillmentService: Error processing order ${orderId}:`, error);
      await this.updateOrderFulfillmentStatus(orderId, 'FAILED');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown fulfillment error'
      };
    }
  }

  private static async processOrderItem(item: OrderItem, order: OrderWithItems): Promise<FulfillmentResult> {
    console.log(`🔄 Processing item: ${item.product.name} (${item.product.fulfillmentType})`);

    switch (item.product.fulfillmentType) {
      case 'LOCAL_INVENTORY':
        return this.fulfillFromLocalInventory(item);
      
      case 'PRINTIFY_POD':
        return this.fulfillFromPrintify(item, order);
      
      case 'HYBRID':
        // Try local first, fallback to Printify
        const localResult = await this.tryLocalInventory(item);
        if (localResult.success) {
          console.log(`✅ HYBRID: Local fulfillment successful for ${item.product.name}`);
          return localResult;
        }
        
        console.log(`⚠️ HYBRID: Local fulfillment failed, trying Printify for ${item.product.name}`);
        return this.fulfillFromPrintify(item, order);
      
      default:
        throw new Error(`Unknown fulfillment type: ${item.product.fulfillmentType}`);
    }
  }

  private static async fulfillFromLocalInventory(item: OrderItem): Promise<FulfillmentResult> {
    console.log(`📦 LOCAL_INVENTORY: Fulfilling ${item.quantity}x ${item.product.name}`);

    try {
      // Use existing stock reduction logic
      await reduceActualStock(item.inventoryId, item.quantity);
      
      console.log(`✅ LOCAL_INVENTORY: Successfully reduced stock for ${item.product.name}`);
      return { 
        success: true,
        localStockReduced: true
      };
    } catch (error) {
      console.error(`❌ LOCAL_INVENTORY: Failed to reduce stock for ${item.product.name}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Local inventory fulfillment failed'
      };
    }
  }

  private static async tryLocalInventory(item: OrderItem): Promise<FulfillmentResult> {
    // Check if we have enough local stock (without throwing)
    const availableStock = item.inventory.quantity - item.inventory.reservedStock;
    
    if (availableStock >= item.quantity) {
      return this.fulfillFromLocalInventory(item);
    } else {
      console.log(`⚠️ HYBRID: Insufficient local stock for ${item.product.name}. Available: ${availableStock}, Requested: ${item.quantity}`);
      return { 
        success: false, 
        error: `Insufficient local stock. Available: ${availableStock}, Requested: ${item.quantity}`
      };
    }
  }

  private static async fulfillFromPrintify(item: OrderItem, order: OrderWithItems): Promise<FulfillmentResult> {
    console.log(`🖨️ PRINTIFY_POD: Fulfilling ${item.quantity}x ${item.product.name}`);

    try {
      // Validate Printify configuration
      if (!item.inventory.printifyVariantId) {
        throw new Error(`Product ${item.product.name} is not configured for Printify fulfillment`);
      }

      const printifyClient = createPrintifyClient();
      
      // Convert order to Printify format
      const printifyOrderData = convertOrderToPrintifyFormat(order);
      
      // Filter line items to only include this specific item
      printifyOrderData.line_items = [{
        product_id: item.inventory.printifyVariantId,
        quantity: item.quantity,
        variant_id: parseInt(item.inventory.printifyVariantId),
      }];

      // Submit order to Printify
      const printifyOrder = await printifyClient.submitOrder(printifyOrderData);

      // Update order with Printify order ID
      await this.updateOrderPrintifyId(item.orderId, printifyOrder.id);
      
      console.log(`✅ PRINTIFY_POD: Successfully submitted order for ${item.product.name}, Printify Order ID: ${printifyOrder.id}`);
      
      return { 
        success: true, 
        printifyOrderId: printifyOrder.id 
      };
    } catch (error) {
      console.error(`❌ PRINTIFY_POD: Failed to fulfill ${item.product.name}:`, error);
      return { 
        success: false, 
        error: `Printify fulfillment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            email: true
          }
        },
        items: {
          include: {
            inventory: {
              select: {
                sku: true,
                quantity: true,
                reservedStock: true,
                printifyVariantId: true
              }
            },
            product: {
              select: {
                name: true,
                fulfillmentType: true,
                printifyProductId: true
              }
            }
          }
        }
      }
    });

    return order as OrderWithItems | null;
  }

  private static async updateOrderFulfillmentStatus(orderId: string, status: FulfillmentStatus): Promise<void> {
    await db.order.update({
      where: { id: orderId },
      data: { fulfillmentStatus: status }
    });
    
    console.log(`📊 Updated order ${orderId} fulfillment status to: ${status}`);
  }

  private static async updateOrderPrintifyId(orderId: string, printifyOrderId: string): Promise<void> {
    await db.order.update({
      where: { id: orderId },
      data: { printifyOrderId }
    });
    
    console.log(`📋 Updated order ${orderId} with Printify order ID: ${printifyOrderId}`);
  }

  // Utility methods for manual fulfillment management
  static async retryFailedFulfillment(orderId: string): Promise<FulfillmentResult> {
    console.log(`🔄 Retrying failed fulfillment for order: ${orderId}`);
    
    // Reset fulfillment status
    await db.order.update({
      where: { id: orderId },
      data: { fulfillmentStatus: 'PENDING' }
    });

    // Attempt fulfillment again
    return this.processOrder(orderId);
  }

  static async getFulfillmentStatus(orderId: string): Promise<{
    status: FulfillmentStatus;
    printifyOrderId?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
  }> {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        fulfillmentStatus: true,
        printifyOrderId: true,
        trackingNumber: true,
        trackingUrl: true
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return {
      status: order.fulfillmentStatus,
      printifyOrderId: order.printifyOrderId,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl
    };
  }

  static async updateTrackingInfo(orderId: string, trackingData: {
    trackingNumber: string;
    trackingUrl?: string;
    carrier?: string;
  }): Promise<void> {
    await db.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: trackingData.trackingNumber,
        trackingUrl: trackingData.trackingUrl,
        fulfillmentStatus: 'SHIPPED'
      }
    });

    console.log(`📦 Updated tracking info for order ${orderId}: ${trackingData.trackingNumber}`);
  }

  // Product management utilities
  static async setProductFulfillmentType(productId: string, fulfillmentType: FulfillmentType): Promise<void> {
    await db.product.update({
      where: { id: productId },
      data: { fulfillmentType }
    });

    console.log(`🏷️ Updated product ${productId} fulfillment type to: ${fulfillmentType}`);
  }

  static async linkProductToPrintify(productId: string, printifyProductId: string, printifyShopId?: number): Promise<void> {
    await db.product.update({
      where: { id: productId },
      data: { 
        printifyProductId,
        printifyShopId: printifyShopId || parseInt(process.env.PRINTIFY_SHOP_ID || '0')
      }
    });

    console.log(`🔗 Linked product ${productId} to Printify product: ${printifyProductId}`);
  }

  static async linkInventoryToPrintify(inventoryId: string, printifyVariantId: string): Promise<void> {
    await db.productInventory.update({
      where: { id: inventoryId },
      data: { printifyVariantId }
    });

    console.log(`🔗 Linked inventory ${inventoryId} to Printify variant: ${printifyVariantId}`);
  }

  // Analytics and reporting
  static async getFulfillmentStats(startDate?: Date, endDate?: Date): Promise<{
    totalOrders: number;
    localFulfilled: number;
    printifyFulfilled: number;
    hybridFulfilled: number;
    failed: number;
    successRate: number;
  }> {
    const whereClause: any = {};
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                fulfillmentType: true
              }
            }
          }
        }
      }
    });

    const stats = {
      totalOrders: orders.length,
      localFulfilled: 0,
      printifyFulfilled: 0,
      hybridFulfilled: 0,
      failed: 0,
      successRate: 0
    };

    orders.forEach(order => {
      if (order.fulfillmentStatus === 'FAILED') {
        stats.failed++;
        return;
      }

      // Determine primary fulfillment method
      const fulfillmentTypes = order.items.map(item => item.product.fulfillmentType);
      
      if (fulfillmentTypes.includes('PRINTIFY_POD')) {
        stats.printifyFulfilled++;
      } else if (fulfillmentTypes.includes('HYBRID')) {
        stats.hybridFulfilled++;
      } else {
        stats.localFulfilled++;
      }
    });

    stats.successRate = stats.totalOrders > 0 
      ? ((stats.totalOrders - stats.failed) / stats.totalOrders) * 100 
      : 0;

    return stats;
  }
}

export default FulfillmentService; 