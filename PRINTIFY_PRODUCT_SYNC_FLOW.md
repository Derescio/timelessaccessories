# Printify Product Sync & Order Flow - Technical Details

## Complete Workflow: Design → Website → Sale → Fulfillment

### **Step 1: You Create Products in Printify** 🎨

```
Your Process:
1. Login to Printify dashboard
2. Choose product (t-shirt, mug, etc.)
3. Upload your design in GIMP/Printify editor
4. Set colors, sizes, positioning
5. Generate mockups
6. Publish product in Printify

Result: Printify assigns unique IDs to your product
```

**Important Printify IDs Created:**
- `printify_product_id`: "64b8f2e4c1a2b3d4e5f6g7h8" (your complete product)
- `printify_variant_ids`: ["12345", "12346", "12347"] (each size/color combo)

### **Step 2: Sync Products to Your Website** 🔄

**Method A: Manual Import (Recommended)**
```javascript
// Admin panel button: "Import from Printify"
async function importPrintifyProduct(printifyProductId) {
  // 1. Fetch product data from Printify API
  const printifyProduct = await printifyClient.getProduct(printifyProductId);
  
  // 2. Create product in your database
  const localProduct = await db.product.create({
    data: {
      name: printifyProduct.title,
      description: printifyProduct.description,
      fulfillmentType: 'PRINTIFY_POD',
      printifyProductId: printifyProductId,
      printifyShopId: YOUR_PRINTIFY_SHOP_ID,
      // ... other fields
    }
  });

  // 3. Create inventory records for each variant
  for (const variant of printifyProduct.variants) {
    await db.productInventory.create({
      data: {
        productId: localProduct.id,
        sku: `PRINTIFY_${variant.id}`,
        printifyVariantId: variant.id.toString(),
        retailPrice: variant.price,
        quantity: 999999, // Unlimited for POD
        images: printifyProduct.images.map(img => img.src),
        // ... other fields
      }
    });
  }
}
```

**Method B: Automated Sync (Future Enhancement)**
```javascript
// Scheduled job runs daily
async function syncPrintifyProducts() {
  const printifyProducts = await printifyClient.getProducts();
  
  for (const product of printifyProducts) {
    // Check if product exists locally
    const existingProduct = await db.product.findFirst({
      where: { printifyProductId: product.id }
    });
    
    if (!existingProduct) {
      await importPrintifyProduct(product.id);
    } else {
      // Update pricing, availability, etc.
      await updateLocalProduct(existingProduct.id, product);
    }
  }
}
```

### **Step 3: Product Display on Your Website** 🛒

Your products show up exactly like local inventory products:

```javascript
// Customer sees on product page:
{
  name: "TimelessAccessories Logo T-Shirt",
  price: "$24.99",
  images: ["mockup1.jpg", "mockup2.jpg", "mockup3.jpg"],
  variants: [
    { size: "S", color: "Black", id: "12345" },
    { size: "M", color: "Black", id: "12346" },
    { size: "L", color: "Black", id: "12347" },
  ],
  inStock: true, // Always true for POD
  fulfillmentType: "PRINTIFY_POD" // Hidden from customer
}
```

### **Step 4: Customer Purchase Flow** 💳

**When customer buys your Printify product:**

```javascript
// 1. Customer adds to cart
const cartItem = {
  productId: "local_product_id_123",
  inventoryId: "local_inventory_id_456", 
  quantity: 1,
  selectedAttributes: { size: "M", color: "Black" }
};

// 2. Customer checks out → Stripe/PayPal payment
// 3. Webhook receives payment confirmation
// 4. Your fulfillment service processes order

async function processOrder(orderId) {
  const order = await getOrderWithItems(orderId);
  
  for (const item of order.items) {
    if (item.product.fulfillmentType === 'PRINTIFY_POD') {
      // This item goes to Printify
      await submitToPrintify(item, order);
    }
  }
}
```

### **Step 5: Order Submission to Printify** 📦

**Exact data sent to Printify:**

```javascript
async function submitToPrintify(orderItem, customerOrder) {
  const printifyOrderData = {
    // Link to your Printify product
    line_items: [{
      product_id: orderItem.inventory.printifyVariantId, // "12346" (M, Black)
      quantity: orderItem.quantity, // 1
      variant_id: parseInt(orderItem.inventory.printifyVariantId) // 12346
    }],
    
    // Customer shipping address
    shipping_address: {
      first_name: customerOrder.shippingAddress.firstName,
      last_name: customerOrder.shippingAddress.lastName,
      email: customerOrder.guestEmail || customerOrder.user.email,
      phone: customerOrder.shippingAddress.phone,
      country: customerOrder.shippingAddress.country,
      region: customerOrder.shippingAddress.state,
      address1: customerOrder.shippingAddress.street,
      address2: customerOrder.shippingAddress.address2,
      city: customerOrder.shippingAddress.city,
      zip: customerOrder.shippingAddress.postalCode
    },
    
    // Order reference
    external_id: customerOrder.id // Your local order ID
  };

  // Send to Printify
  const printifyOrder = await printifyClient.submitOrder(printifyOrderData);
  
  // Save Printify order ID for tracking
  await db.order.update({
    where: { id: customerOrder.id },
    data: { 
      printifyOrderId: printifyOrder.id,
      fulfillmentStatus: 'PROCESSING'
    }
  });
}
```

### **Step 6: Printify Processes & Ships** 🚚

**What happens in Printify:**
1. Receives your order with exact product variant ID
2. Knows exactly which design, size, color to print
3. Prints and ships to customer address you provided
4. Sends tracking info back via webhook

**Printify webhook to your site:**
```javascript
// app/api/webhook/printify/route.ts
export async function POST(request) {
  const event = await request.json();
  
  if (event.type === 'order:shipped') {
    // Update your order with tracking
    await db.order.update({
      where: { printifyOrderId: event.data.id },
      data: {
        fulfillmentStatus: 'SHIPPED',
        trackingNumber: event.data.tracking_number,
        trackingUrl: event.data.tracking_url
      }
    });
    
    // Send tracking email to customer
    await sendShippingNotification(localOrderId);
  }
}
```

## **Real Example Flow:**

### **Your Actions:**
1. **Create in Printify**: Logo t-shirt with variants (S/M/L in Black/White)
2. **Import to website**: Click "Import from Printify" in your admin panel
3. **Product goes live**: Shows on your website as available

### **Customer Journey:**
1. **Visits your site**: Sees "TimelessAccessories Logo T-Shirt - $24.99"
2. **Selects variant**: Medium, Black
3. **Adds to cart**: Stores inventory ID that links to Printify variant "12346"
4. **Checks out**: Pays via Stripe/PayPal
5. **Order created**: Your system creates order with shipping address

### **Automatic Processing:**
1. **Webhook receives payment**: Triggers order fulfillment
2. **System identifies POD item**: Sees `fulfillmentType: 'PRINTIFY_POD'`
3. **Submits to Printify**: Sends exact variant ID + customer address
4. **Printify receives**: 
   - Product: Your logo t-shirt design
   - Variant: Medium, Black  
   - Ship to: Customer's exact address
5. **Printify fulfills**: Prints, packages, ships
6. **Tracking updates**: Webhook updates your order status
7. **Customer notified**: Gets tracking email from your system

## **Database Linking Structure:**

```sql
-- Your local product
Product {
  id: "local_prod_123"
  name: "TimelessAccessories Logo T-Shirt"
  fulfillmentType: "PRINTIFY_POD"
  printifyProductId: "64b8f2e4c1a2b3d4e5f6g7h8"
}

-- Each size/color variant
ProductInventory {
  id: "local_inv_456"
  productId: "local_prod_123"
  sku: "PRINTIFY_12346"
  printifyVariantId: "12346" -- Links to Printify's Medium/Black
  attributes: { size: "M", color: "Black" }
}

-- Customer order
OrderItem {
  orderId: "customer_order_789"
  inventoryId: "local_inv_456" -- Points to M/Black variant
  quantity: 1
}
```

**The key is the `printifyVariantId` - this tells Printify exactly which product variant to print and ship.**

## **Summary:**
1. **You create designs in Printify** (get product/variant IDs)
2. **Import to your website** (links local products to Printify IDs)  
3. **Customer buys on your site** (selects specific variant)
4. **Your webhook automatically submits to Printify** (exact variant + address)
5. **Printify prints and ships** (knows exactly what to make)
6. **Tracking flows back to customer** (seamless experience)

**Does this clarify the technical flow? The customer never knows it's POD - they just get their order shipped directly from Printify with your branding.** 