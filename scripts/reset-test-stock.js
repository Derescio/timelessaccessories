#!/usr/bin/env node

/**
 * Reset Test Stock Script
 *
 * This script resets the test inventory back to original state
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function resetTestStock() {
  try {
    console.log("🔄 Resetting test stock...");

    // Reset the Classic Chain Necklace inventory
    const result = await prisma.productInventory.update({
      where: { id: "cm8g42vo6000a20usr57lfoen" },
      data: {
        quantity: 2,
        reservedStock: 2,
      },
    });

    console.log(`✅ Reset inventory ${result.sku}:`);
    console.log(`   Quantity: ${result.quantity}`);
    console.log(`   Reserved Stock: ${result.reservedStock}`);
    console.log(
      `   Available Stock: ${result.quantity - result.reservedStock}`
    );
  } catch (error) {
    console.error("❌ Error resetting stock:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestStock();
