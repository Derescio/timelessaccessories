#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function releaseReservedStock(orderId = "cmbh1jv8c000520440y8dyx4e") {
  try {
    console.log(`🔄 Manually releasing reserved stock for order: ${orderId}`);

    // Get order items
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      include: {
        inventory: true,
      },
    });

    console.log(`📋 Found ${orderItems.length} order items`);

    for (const item of orderItems) {
      const currentReserved = item.inventory.reservedStock;
      const releaseAmount = Math.min(item.quantity, currentReserved);

      console.log(`🔄 Processing ${item.inventory.sku}:`);
      console.log(`   Current Reserved: ${currentReserved}`);
      console.log(`   Order Quantity: ${item.quantity}`);
      console.log(`   Will Release: ${releaseAmount}`);

      if (releaseAmount > 0) {
        const updated = await prisma.inventory.update({
          where: { id: item.inventory.id },
          data: {
            reservedStock: {
              decrement: releaseAmount,
            },
          },
        });
        console.log(
          `✅ Released ${releaseAmount} reserved stock for ${item.inventory.sku}`
        );
        console.log(`   New Reserved Stock: ${updated.reservedStock}`);
      } else {
        console.log(
          `⚠️ No reserved stock to release for ${item.inventory.sku}`
        );
      }
    }

    console.log(
      `✅ Completed manual reserved stock release for order: ${orderId}`
    );
  } catch (error) {
    console.error("❌ Error releasing reserved stock:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get order ID from command line argument or use default
const orderId = process.argv[2];
releaseReservedStock(orderId).catch(console.error);
