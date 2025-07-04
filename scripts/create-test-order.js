#!/usr/bin/env node

/**
 * Create Test Order Script
 *
 * This script creates a test order for testing webhook functionality
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { Decimal } = require("decimal.js");

async function createTestOrder() {
  try {
    console.log("🔄 Creating test order...");

    // First, get the inventory details
    const inventory = await prisma.productInventory.findUnique({
      where: { id: "cm8g42vo6000a20usr57lfoen" },
      include: {
        product: {
          select: { id: true, name: true },
        },
      },
    });

    if (!inventory) {
      console.error("❌ Inventory not found");
      return;
    }

    console.log(
      `📦 Found inventory: ${inventory.product.name} (${inventory.sku})`
    );
    console.log(
      `   Current stock: ${inventory.quantity}, Reserved: ${inventory.reservedStock}`
    );

    // Create the order with guest email
    const order = await prisma.order.create({
      data: {
        total: new Decimal(inventory.retailPrice * 2 * 1.1 + 9.99),
        subtotal: new Decimal(inventory.retailPrice * 2),
        tax: new Decimal(inventory.retailPrice * 2 * 0.1),
        shipping: new Decimal(9.99),
        status: "PENDING",
        guestEmail: "ddw.web.dev.services@gmail.com", // Use real email for testing
        shippingAddress: JSON.stringify({
          street: "123 Test Street",
          city: "Test City",
          state: "TS",
          zipCode: "12345",
          country: "US",
        }),
      },
    });

    console.log(`✅ Created order: ${order.id}`);

    // Create the order item
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: inventory.productId,
        inventoryId: inventory.id,
        quantity: 2, // This should match the reserved stock
        price: inventory.retailPrice,
        name: inventory.product.name,
        image: inventory.images[0] || "/images/placeholder.svg",
      },
    });

    console.log(`✅ Created order item: ${orderItem.id}`);
    console.log(`📋 Order Details:`);
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Total: $${order.total}`);
    console.log(`   Items: ${orderItem.quantity}x ${orderItem.name}`);
    console.log("");
    console.log(`🧪 Ready to test webhook! Use this command:`);
    console.log(`   node scripts/test-webhook-local.js ${order.id}`);
  } catch (error) {
    console.error("❌ Error creating test order:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder();
