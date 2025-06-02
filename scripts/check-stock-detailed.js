#!/usr/bin/env node

/**
 * Check Stock Details Script
 *
 * This script checks detailed stock information for debugging inventory issues.
 *
 * Usage: node scripts/check-stock-detailed.js [inventoryId]
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const inventoryId = process.argv[2];

async function checkStock() {
  try {
    if (inventoryId) {
      // Check specific inventory item
      console.log(`🔍 Checking stock for inventory ID: ${inventoryId}`);

      const inventory = await prisma.productInventory.findUnique({
        where: { id: inventoryId },
        include: {
          product: {
            select: { name: true, slug: true },
          },
        },
      });

      if (!inventory) {
        console.error(`❌ Inventory item not found: ${inventoryId}`);
        return;
      }

      console.log(
        `📊 Stock Details for ${inventory.product.name} (${inventory.sku}):`
      );
      console.log(`   Total Quantity: ${inventory.quantity}`);
      console.log(`   Reserved Stock: ${inventory.reservedStock}`);
      console.log(
        `   Available Stock: ${inventory.quantity - inventory.reservedStock}`
      );
      console.log(`   Low Stock Threshold: ${inventory.lowStock}`);
      console.log(`   Is Default: ${inventory.isDefault}`);
    } else {
      // Check all inventory with reserved stock
      console.log(`🔍 Checking all items with reserved stock...`);

      const inventoriesWithReservedStock =
        await prisma.productInventory.findMany({
          where: {
            reservedStock: { gt: 0 },
          },
          include: {
            product: {
              select: { name: true, slug: true },
            },
          },
          orderBy: [{ reservedStock: "desc" }, { product: { name: "asc" } }],
        });

      if (inventoriesWithReservedStock.length === 0) {
        console.log(`✅ No items have reserved stock`);
      } else {
        console.log(
          `📊 Found ${inventoriesWithReservedStock.length} items with reserved stock:`
        );
        console.log("");

        inventoriesWithReservedStock.forEach((inventory) => {
          const availableStock = inventory.quantity - inventory.reservedStock;
          console.log(`📦 ${inventory.product.name} (${inventory.sku}):`);
          console.log(`   ID: ${inventory.id}`);
          console.log(
            `   Total: ${inventory.quantity} | Reserved: ${inventory.reservedStock} | Available: ${availableStock}`
          );
          console.log(
            `   Status: ${availableStock <= 0 ? "❌ Out of Stock" : availableStock <= inventory.lowStock ? "⚠️ Low Stock" : "✅ In Stock"}`
          );
          console.log("");
        });
      }
    }
  } catch (error) {
    console.error("❌ Error checking stock:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStock();
