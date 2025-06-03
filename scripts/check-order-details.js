#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkOrderDetails(orderId = "cmbh1bdqk00002010g6kehdp5") {
  try {
    // Check the order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            inventory: {
              select: {
                sku: true,
                quantity: true,
                reservedStock: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      console.log(`❌ Order not found: ${orderId}`);
      return;
    }

    console.log(`📋 Order Details: ${orderId}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Total: $${order.total}`);
    console.log(`   Created: ${order.createdAt}`);
    console.log(`   Updated: ${order.updatedAt}`);

    console.log("\n💳 Payment:");
    if (order.payment) {
      console.log(`   Status: ${order.payment.status}`);
      console.log(`   Provider: ${order.payment.provider}`);
      console.log(`   Payment ID: ${order.payment.paymentId || "N/A"}`);
      console.log(`   Updated: ${order.payment.updatedAt}`);
    } else {
      console.log("   No payment record");
    }

    console.log("\n📦 Items:");
    order.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name}:`);
      console.log(`      Quantity Ordered: ${item.quantity}`);
      console.log(`      Price: $${item.price}`);
      console.log(`      Inventory (${item.inventory.sku}):`);
      console.log(`        Current Stock: ${item.inventory.quantity}`);
      console.log(`        Reserved Stock: ${item.inventory.reservedStock}`);
      console.log(
        `        Available: ${item.inventory.quantity - item.inventory.reservedStock}`
      );
    });
  } catch (error) {
    console.error("Error checking order details:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get order ID from command line argument or use default
const orderId = process.argv[2];
checkOrderDetails(orderId).catch(console.error);
