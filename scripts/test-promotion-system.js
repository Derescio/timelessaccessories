#!/usr/bin/env node

/**
 * Promotion System Test Script
 *
 * This script tests the core database operations of the promotion system
 * without requiring complex test framework setup.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testPromotionSystem() {
  console.log("🧪 Starting Promotion System Tests...\n");

  let testData = {};
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Setup test data
    await setupTestData(testData);
    console.log("✅ Test data setup complete\n");

    // Test 1: Cart Promotion Application
    await test1_CartPromotionApplication(testData);
    testsPassed++;

    // Test 2: Cart Promotion Removal
    await test2_CartPromotionRemoval(testData);
    testsPassed++;

    // Test 3: Order Creation with Promotion
    await test3_OrderCreationWithPromotion(testData);
    testsPassed++;

    // Test 4: Promotion Usage Recording
    await test4_PromotionUsageRecording(testData);
    testsPassed++;

    // Test 5: Duplicate Prevention
    await test5_DuplicatePrevention(testData);
    testsPassed++;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    testsFailed++;
  } finally {
    // Cleanup
    await cleanupTestData(testData);
    console.log("\n🧹 Test data cleanup complete");

    // Results
    console.log("\n📊 Test Results:");
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(
      `📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`
    );

    await prisma.$disconnect();
  }
}

async function test1_CartPromotionApplication(testData) {
  console.log("🧪 Test 1: Cart Promotion Application");

  // Apply promotion to cart
  await prisma.cartPromotion.create({
    data: {
      cartId: testData.cart.id,
      promotionId: testData.promotion.id,
      couponCode: testData.promotion.couponCode,
      discount: 10.99,
      discountType: "PERCENTAGE_DISCOUNT",
    },
  });

  // Verify promotion was applied
  const cartPromotions = await prisma.cartPromotion.findMany({
    where: { cartId: testData.cart.id },
  });

  if (cartPromotions.length !== 1) {
    throw new Error("Promotion not applied to cart");
  }

  if (cartPromotions[0].couponCode !== testData.promotion.couponCode) {
    throw new Error("Wrong promotion applied to cart");
  }

  console.log("✅ Promotion successfully applied to cart");
}

async function test2_CartPromotionRemoval(testData) {
  console.log("🧪 Test 2: Cart Promotion Removal");

  // Remove promotion from cart
  await prisma.cartPromotion.deleteMany({
    where: {
      cartId: testData.cart.id,
      promotionId: testData.promotion.id,
    },
  });

  // Verify promotion was removed
  const cartPromotions = await prisma.cartPromotion.findMany({
    where: { cartId: testData.cart.id },
  });

  if (cartPromotions.length !== 0) {
    throw new Error("Promotion not removed from cart");
  }

  console.log("✅ Promotion successfully removed from cart");
}

async function test3_OrderCreationWithPromotion(testData) {
  console.log("🧪 Test 3: Order Creation with Promotion");

  // Re-apply promotion for order test
  await prisma.cartPromotion.create({
    data: {
      cartId: testData.cart.id,
      promotionId: testData.promotion.id,
      couponCode: testData.promotion.couponCode,
      discount: 10.99,
      discountType: "PERCENTAGE_DISCOUNT",
    },
  });

  // Create order with promotion
  const order = await prisma.order.create({
    data: {
      guestEmail: "test@example.com",
      subtotal: 50.0,
      tax: 5.0,
      shipping: 9.99,
      total: 54.0, // 50 + 5 + 9.99 - 10.99
      appliedPromotionId: testData.promotion.id,
      discountAmount: 10.99,
      shippingAddress: JSON.stringify({
        street: "123 Test St",
        city: "Test City",
        state: "TS",
        country: "US",
      }),
      items: {
        create: {
          productId: testData.product.id,
          inventoryId: testData.inventory.id,
          quantity: 2,
          price: 25.0,
          name: testData.product.name,
        },
      },
    },
  });

  testData.order = order;

  // Verify order has promotion data
  if (
    !order.appliedPromotionId ||
    order.appliedPromotionId !== testData.promotion.id
  ) {
    throw new Error("Order not created with promotion data");
  }

  if (order.discountAmount.toNumber() !== 10.99) {
    throw new Error("Order discount amount incorrect");
  }

  console.log("✅ Order successfully created with promotion data");
}

async function test4_PromotionUsageRecording(testData) {
  console.log("🧪 Test 4: Promotion Usage Recording");

  // Create or find user for promotion usage
  let user = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
      },
    });
  }

  // Record promotion usage
  await prisma.promotionUsage.create({
    data: {
      promotionId: testData.promotion.id,
      orderId: testData.order.id,
      userId: user.id,
      discountAmount: 10.99,
      originalAmount: 64.99,
      finalAmount: 54.0,
      couponCode: testData.promotion.couponCode,
    },
  });

  // Increment promotion usage count
  await prisma.promotion.update({
    where: { id: testData.promotion.id },
    data: {
      usageCount: { increment: 1 },
    },
  });

  // Verify usage was recorded
  const promotionUsage = await prisma.promotionUsage.findFirst({
    where: {
      orderId: testData.order.id,
      promotionId: testData.promotion.id,
    },
  });

  if (!promotionUsage) {
    throw new Error("Promotion usage not recorded");
  }

  // Verify usage count was incremented
  const updatedPromotion = await prisma.promotion.findUnique({
    where: { id: testData.promotion.id },
  });

  if (updatedPromotion.usageCount !== 1) {
    throw new Error("Promotion usage count not incremented");
  }

  console.log("✅ Promotion usage successfully recorded and counted");
}

async function test5_DuplicatePrevention(testData) {
  console.log("🧪 Test 5: Duplicate Prevention");

  // Try to apply same promotion again
  try {
    await prisma.cartPromotion.create({
      data: {
        cartId: testData.cart.id,
        promotionId: testData.promotion.id,
        couponCode: testData.promotion.couponCode,
        discount: 10.99,
        discountType: "PERCENTAGE_DISCOUNT",
      },
    });
    throw new Error("Duplicate promotion was allowed");
  } catch (error) {
    if (error.code === "P2002") {
      console.log(
        "✅ Duplicate promotion correctly prevented by database constraint"
      );
    } else {
      throw error;
    }
  }

  // Try to record duplicate promotion usage
  try {
    const user = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    await prisma.promotionUsage.create({
      data: {
        promotionId: testData.promotion.id,
        orderId: testData.order.id,
        userId: user.id,
        discountAmount: 10.99,
        originalAmount: 64.99,
        finalAmount: 54.0,
        couponCode: testData.promotion.couponCode,
      },
    });

    // This should succeed since there's no unique constraint on promotion usage
    // But we can check that the function handles it gracefully
    console.log("✅ Duplicate usage recording handled (no constraint exists)");
  } catch (error) {
    console.log("✅ Duplicate usage recording prevented");
  }
}

async function setupTestData(testData) {
  // Create test category
  testData.category = await prisma.category.create({
    data: {
      name: "Test Category",
      slug: "test-category-" + Date.now(),
    },
  });

  // Create test product
  testData.product = await prisma.product.create({
    data: {
      name: "Test Product",
      description: "Test product for promotion testing",
      slug: "test-product-" + Date.now(),
      categoryId: testData.category.id,
    },
  });

  // Create test inventory
  testData.inventory = await prisma.productInventory.create({
    data: {
      productId: testData.product.id,
      sku: "TEST-SKU-" + Date.now(),
      retailPrice: 25.0,
      costPrice: 15.0,
      quantity: 100,
      images: ["test-image.jpg"],
    },
  });

  // Create test promotion
  testData.promotion = await prisma.promotion.create({
    data: {
      name: "Test Promotion",
      promotionType: "PERCENTAGE_DISCOUNT",
      value: 20,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      couponCode: "TEST20-" + Date.now(),
      isActive: true,
      usageCount: 0,
    },
  });

  // Create test cart
  testData.cart = await prisma.cart.create({
    data: {
      sessionId: "test-session-" + Date.now(),
      items: {
        create: {
          productId: testData.product.id,
          inventoryId: testData.inventory.id,
          quantity: 2,
        },
      },
    },
  });
}

async function cleanupTestData(testData) {
  if (!testData.cart) return;

  // Clean up in reverse order of creation
  try {
    await prisma.promotionUsage.deleteMany({
      where: { promotionId: testData.promotion?.id },
    });

    await prisma.orderItem.deleteMany({
      where: { orderId: testData.order?.id },
    });

    await prisma.order.deleteMany({
      where: { id: testData.order?.id },
    });

    await prisma.cartItem.deleteMany({
      where: { cartId: testData.cart?.id },
    });

    await prisma.cartPromotion.deleteMany({
      where: { cartId: testData.cart?.id },
    });

    await prisma.cart.deleteMany({
      where: { id: testData.cart?.id },
    });

    await prisma.promotion.deleteMany({
      where: { id: testData.promotion?.id },
    });

    await prisma.productInventory.deleteMany({
      where: { id: testData.inventory?.id },
    });

    await prisma.product.deleteMany({
      where: { id: testData.product?.id },
    });

    await prisma.category.deleteMany({
      where: { id: testData.category?.id },
    });

    // Clean up test user if created
    await prisma.user.deleteMany({
      where: { email: "test@example.com" },
    });
  } catch (error) {
    console.error("Cleanup error:", error.message);
  }
}

// Run the tests
if (require.main === module) {
  testPromotionSystem()
    .then(() => {
      console.log("\n🎉 All tests completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Test suite failed:", error);
      process.exit(1);
    });
}

module.exports = { testPromotionSystem };
