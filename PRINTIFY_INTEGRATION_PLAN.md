# Printify API Integration Plan with Existing Webhook System

## Executive Summary

Based on current system analysis and Printify API research, this plan outlines integrating Printify's print-on-demand service with our existing e-commerce platform to create a hybrid fulfillment system.

## Current System Architecture

### Existing Components
- **Next.js 15** e-commerce platform
- **PostgreSQL** database with Prisma ORM
- **Stripe + PayPal** payment processing
- **Webhook System** for payment confirmations
- **Inventory Management** with stock tracking
- **Email System** via Resend

### Current Issues to Address
- ❌ **Overselling Protection**: Orders complete despite stock failures
- ❌ **No Fulfillment Status**: No tracking of order fulfillment state
- ❌ **Manual Stock Management**: Requires constant inventory monitoring

## Printify API Overview

### Key Capabilities
- **600 requests/minute** rate limit
- **Print-on-demand fulfillment** - no inventory management needed
- **Webhook system** for order status updates
- **1,300+ products** available in catalog
- **Global shipping** with multiple print providers
- **Automatic fulfillment** once orders are placed

### Authentication
- **Personal Access Token** for single store
- **OAuth 2.0** for platform integrations
- **Required Scopes**: shops.read, products.read/write, orders.read/write, webhooks.read/write

### Core Endpoints
```
GET /v1/shops.json                     # List shops
GET /v1/catalog/blueprints.json       # Available products
POST /v1/shops/{shop_id}/products.json # Create products
POST /v1/shops/{shop_id}/orders.json   # Submit orders
GET /v1/shops/{shop_id}/orders.json    # Track orders
```

## Integration Architecture

### 1. Product Management System
```
Database Changes:
├── Add `fulfillmentType` to Product model
│   ├── LOCAL_INVENTORY (existing system)
│   ├── PRINTIFY_POD (print-on-demand)
│   └── HYBRID (both options)
├── Add `printifyProductId` to Product model
├── Add `printifyVariantId` to ProductInventory model
└── Add FulfillmentProvider model
```

### 2. Hybrid Order Processing Flow
```
Order Flow:
1. Customer places order → Stripe/PayPal payment
2. Webhook receives payment confirmation
3. NEW: Check product fulfillment types
4. LOCAL_INVENTORY: Use existing stock reduction
5. PRINTIFY_POD: Forward to Printify API
6. HYBRID: Try local first, fallback to Printify
7. Update order fulfillment status
8. Send appropriate confirmation email
```

### 3. Printify Integration Points

#### A. Product Sync Service
```typescript
// Service to sync Printify catalog with local products
class PrintifyProductSync {
  - syncCatalog(): Fetch Printify blueprints
  - createLocalProducts(): Create hybrid products
  - updatePricing(): Sync pricing from Printify
  - syncVariants(): Match sizes/colors
}
```

#### B. Order Fulfillment Service
```typescript
// Handle different fulfillment types
class FulfillmentService {
  - processOrder(orderId): Route to appropriate fulfillment
  - submitToPrintify(orderData): Create Printify order
  - trackFulfillment(): Monitor order status
  - handleFailures(): Fallback strategies
}
```

#### C. Webhook Handler Integration
```typescript
// Extend existing webhook system
class PrintifyWebhookHandler {
  - handleOrderUpdate(): Process Printify order status
  - updateShippingInfo(): Add tracking numbers
  - handleFulfillmentComplete(): Update order status
  - syncWithLocalSystem(): Keep data consistent
}
```

## Implementation Phases

### Phase 1: Infrastructure Setup (Week 1)
✅ **Database Schema Updates**
- Add fulfillment-related fields to existing models
- Create Printify configuration table
- Add order fulfillment status tracking

✅ **Environment Configuration**
- Add Printify API credentials
- Configure webhook endpoints
- Set up rate limiting

### Phase 2: Printify API Integration (Week 2)
✅ **API Client Development**
- Create Printify API wrapper
- Implement authentication handling
- Add error handling and retries

✅ **Product Sync System**
- Catalog import functionality
- Product matching algorithm
- Pricing synchronization

### Phase 3: Order Processing (Week 3)
✅ **Hybrid Fulfillment Logic**
- Extend existing webhook handlers
- Add Printify order submission
- Implement fallback mechanisms

✅ **Order Status Tracking**
- Printify webhook integration
- Status update system
- Customer notification system

### Phase 4: Testing & Optimization (Week 4)
✅ **End-to-End Testing**
- Local inventory scenarios
- Printify fulfillment scenarios
- Hybrid fallback scenarios
- Edge case handling

## Technical Implementation

### 1. Database Schema Updates

```prisma
// prisma/schema.prisma additions
enum FulfillmentType {
  LOCAL_INVENTORY
  PRINTIFY_POD
  HYBRID
}

enum FulfillmentStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  FAILED
}

model Product {
  // ... existing fields ...
  fulfillmentType    FulfillmentType @default(LOCAL_INVENTORY)
  printifyProductId  String?
  printifyShopId     Int?
  // ... rest of model ...
}

model ProductInventory {
  // ... existing fields ...
  printifyVariantId  String?
  // ... rest of model ...
}

model Order {
  // ... existing fields ...
  fulfillmentStatus  FulfillmentStatus @default(PENDING)
  printifyOrderId    String?
  trackingNumber     String?
  trackingUrl        String?
  // ... rest of model ...
}

model PrintifyConfig {
  id              String @id @default(cuid())
  shopId          Int
  accessToken     String
  webhookSecret   String
  isActive        Boolean @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 2. Printify API Client

```typescript
// lib/services/printify.ts
export class PrintifyClient {
  private baseUrl = 'https://api.printify.com/v1'
  private accessToken: string
  private shopId: number

  constructor(accessToken: string, shopId: number) {
    this.accessToken = accessToken
    this.shopId = shopId
  }

  // Core API methods
  async getCatalog(): Promise<PrintifyBlueprint[]>
  async createProduct(productData: PrintifyProductData): Promise<PrintifyProduct>
  async submitOrder(orderData: PrintifyOrderData): Promise<PrintifyOrder>
  async getOrderStatus(orderId: string): Promise<PrintifyOrderStatus>
  async uploadImage(imageUrl: string): Promise<string>

  // Helper methods
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T>
  private handleRateLimit(retryAfter: number): Promise<void>
  private handleError(error: any): never
}
```

### 3. Enhanced Webhook System

```typescript
// app/api/webhook/stripe/route.ts enhancements
export async function POST(request: Request) {
  // ... existing verification ...

  if (eventType === 'checkout.session.completed' || eventType === 'charge.succeeded') {
    // ... existing payment processing ...

    // NEW: Enhanced fulfillment handling
    const fulfillmentResult = await FulfillmentService.processOrder(orderId);
    
    if (!fulfillmentResult.success) {
      // CRITICAL: Handle fulfillment failures properly
      await OrderService.updateFulfillmentStatus(orderId, 'FAILED');
      await AlertService.notifyAdminOfFailure(orderId, fulfillmentResult.error);
      
      // DO NOT send customer confirmation if fulfillment fails
      return NextResponse.json({ 
        success: false, 
        error: 'Fulfillment failed',
        orderId 
      }, { status: 500 });
    }

    // Only send confirmation if fulfillment succeeded
    await EmailService.sendOrderConfirmation(orderId);
    
    return NextResponse.json({ success: true });
  }
}
```

### 4. Fulfillment Service

```typescript
// lib/services/fulfillment.ts
export class FulfillmentService {
  static async processOrder(orderId: string): Promise<FulfillmentResult> {
    const order = await OrderService.getOrderWithItems(orderId);
    
    const results = await Promise.allSettled(
      order.items.map(item => this.processOrderItem(item))
    );

    const failedItems = results.filter(r => r.status === 'rejected');
    
    if (failedItems.length > 0) {
      return {
        success: false,
        error: 'Some items could not be fulfilled',
        failedItems
      };
    }

    return { success: true };
  }

  private static async processOrderItem(item: OrderItem): Promise<FulfillmentResult> {
    const product = await ProductService.getProduct(item.productId);
    
    switch (product.fulfillmentType) {
      case 'LOCAL_INVENTORY':
        return this.fulfillFromLocalInventory(item);
      
      case 'PRINTIFY_POD':
        return this.fulfillFromPrintify(item);
      
      case 'HYBRID':
        // Try local first, fallback to Printify
        const localResult = await this.fulfillFromLocalInventory(item);
        if (localResult.success) {
          return localResult;
        }
        return this.fulfillFromPrintify(item);
      
      default:
        throw new Error(`Unknown fulfillment type: ${product.fulfillmentType}`);
    }
  }

  private static async fulfillFromLocalInventory(item: OrderItem): Promise<FulfillmentResult> {
    // Use existing stock reduction logic
    return InventoryService.reduceStock(item.inventoryId, item.quantity);
  }

  private static async fulfillFromPrintify(item: OrderItem): Promise<FulfillmentResult> {
    const printifyClient = new PrintifyClient(
      process.env.PRINTIFY_ACCESS_TOKEN!,
      parseInt(process.env.PRINTIFY_SHOP_ID!)
    );

    try {
      const printifyOrder = await printifyClient.submitOrder({
        line_items: [{
          product_id: item.inventory.printifyVariantId,
          quantity: item.quantity,
          variant_id: item.inventory.printifyVariantId
        }],
        shipping_address: item.order.shippingAddress,
        // ... other order details
      });

      // Update order with Printify ID
      await OrderService.updatePrintifyOrderId(item.orderId, printifyOrder.id);
      
      return { success: true, printifyOrderId: printifyOrder.id };
    } catch (error) {
      return { 
        success: false, 
        error: `Printify fulfillment failed: ${error.message}` 
      };
    }
  }
}
```

### 5. Printify Webhook Handler

```typescript
// app/api/webhook/printify/route.ts
export async function POST(request: Request) {
  const signature = request.headers.get('X-Printify-Signature');
  const body = await request.text();
  
  // Verify webhook signature
  const isValid = verifyPrintifySignature(body, signature);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);
  
  switch (event.type) {
    case 'order:shipped':
      await handleOrderShipped(event.data);
      break;
    
    case 'order:delivered':
      await handleOrderDelivered(event.data);
      break;
    
    case 'order:failed':
      await handleOrderFailed(event.data);
      break;
  }

  return NextResponse.json({ success: true });
}

async function handleOrderShipped(orderData: any) {
  const localOrder = await OrderService.getByPrintifyOrderId(orderData.id);
  
  if (localOrder) {
    await OrderService.updateFulfillmentStatus(localOrder.id, 'SHIPPED');
    await OrderService.updateTrackingInfo(localOrder.id, {
      trackingNumber: orderData.tracking_number,
      trackingUrl: orderData.tracking_url,
      carrier: orderData.carrier
    });
    
    // Send shipping notification to customer
    await EmailService.sendShippingNotification(localOrder.id);
  }
}
```

## Benefits of This Integration

### For Business
✅ **Eliminates Overselling**: Printify has unlimited "inventory"
✅ **Reduces Inventory Risk**: No need to pre-purchase stock
✅ **Global Fulfillment**: Automatic worldwide shipping
✅ **Product Variety**: Access to 1,300+ products
✅ **Automated Processing**: Orders fulfill automatically

### For Customers
✅ **Faster Availability**: Products never "out of stock"
✅ **Global Shipping**: Printify handles international orders
✅ **Quality Guarantee**: Printify's quality promise
✅ **Tracking**: Full shipment tracking integration

### For Operations
✅ **Hybrid Flexibility**: Keep profitable local inventory
✅ **Fallback Options**: Automatic failover systems
✅ **Reduced Complexity**: Printify handles fulfillment
✅ **Better Data**: Enhanced order tracking and analytics

## Risk Mitigation

### 1. API Rate Limiting
- Implement request queuing
- Add exponential backoff
- Monitor usage patterns

### 2. Quality Control
- Test all Printify products before adding
- Monitor customer feedback
- Implement product approval workflow

### 3. Cost Management
- Compare Printify vs local costs
- Implement dynamic pricing
- Monitor profit margins

### 4. Customer Communication
- Clear delivery timeframes
- Transparent shipping costs
- Proactive status updates

## Success Metrics

### Technical KPIs
- Order fulfillment success rate > 99%
- API response time < 2 seconds
- Webhook processing time < 5 seconds
- Zero overselling incidents

### Business KPIs
- Inventory holding costs reduction
- Order processing automation rate
- Customer satisfaction scores
- Revenue from new products

## Next Steps

1. **Immediate**: Fix current overselling issues
2. **Week 1**: Implement database schema changes
3. **Week 2**: Build Printify API integration
4. **Week 3**: Deploy hybrid fulfillment system
5. **Week 4**: Testing and optimization
6. **Ongoing**: Monitor and iterate

---
*Plan Created: January 4, 2025*
*Status: Ready for Implementation* 