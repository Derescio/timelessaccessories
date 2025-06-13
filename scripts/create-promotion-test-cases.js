const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createPromotionTestCases() {
  console.log("🎯 Creating comprehensive promotion test cases...");

  try {
    // First, let's get existing categories and products to create realistic test cases
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
    });

    const products = await prisma.product.findMany({
      include: {
        inventories: {
          select: { id: true, retailPrice: true, sku: true },
          where: { isDefault: true },
        },
      },
    });

    console.log(
      `Found ${categories.length} categories and ${products.length} products`
    );

    // Clear existing test promotions (optional - comment out if you want to keep existing ones)
    await prisma.promotion.deleteMany({
      where: {
        name: {
          contains: "[TEST]",
        },
      },
    });

    const testPromotions = [];

    // 1. PERCENTAGE DISCOUNT PROMOTIONS
    // ================================

    // 1a. Site-wide percentage discount
    testPromotions.push({
      name: "[TEST] Site-wide 20% Off",
      description: "Get 20% off your entire order - no restrictions!",
      promotionType: "PERCENTAGE_DISCOUNT",
      value: 20,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
      couponCode: "SAVE20",
      applyToAllItems: true,
      usageLimit: 1000,
      requiresAuthentication: false,
    });

    // 1b. New customer welcome discount
    testPromotions.push({
      name: "[TEST] Welcome New Customers",
      description: "Welcome! Get 15% off your first order",
      promotionType: "PERCENTAGE_DISCOUNT",
      value: 15,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
      couponCode: "WELCOME15",
      applyToAllItems: true,
      isOneTimeUse: true,
      requiresAuthentication: false,
    });

    // 1c. VIP members only discount
    testPromotions.push({
      name: "[TEST] VIP Members 25% Off",
      description: "Exclusive 25% discount for signed-in VIP members",
      promotionType: "PERCENTAGE_DISCOUNT",
      value: 25,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
      couponCode: "VIP25",
      applyToAllItems: true,
      requiresAuthentication: true,
      usageLimit: 500,
    });

    // 1d. Category-specific discount (if we have categories)
    if (categories.length > 0) {
      testPromotions.push({
        name: "[TEST] Bracelets 30% Off",
        description: "Special discount on all bracelet items",
        promotionType: "PERCENTAGE_DISCOUNT",
        value: 30,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-12-31"),
        isActive: true,
        couponCode: "BRACELETS30",
        applyToAllItems: false,
        usageLimit: 200,
      });
    }

    // 2. FIXED AMOUNT DISCOUNT PROMOTIONS
    // ===================================

    // 2a. Fixed amount off entire order
    testPromotions.push({
      name: "[TEST] $50 Off Orders Over $200",
      description: "Get $50 off when you spend $200 or more",
      promotionType: "FIXED_AMOUNT_DISCOUNT",
      value: 50,
      minimumOrderValue: 200,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
      couponCode: "SAVE50",
      applyToAllItems: true,
      usageLimit: 300,
    });

    // 2b. Small fixed discount for testing
    testPromotions.push({
      name: "[TEST] $10 Off Any Order",
      description: "Get $10 off any order - perfect for testing",
      promotionType: "FIXED_AMOUNT_DISCOUNT",
      value: 10,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
      couponCode: "TEST10",
      applyToAllItems: true,
      usageLimit: 100,
    });

    // 2c. High-value customer discount
    testPromotions.push({
      name: "[TEST] $100 Off Premium Orders",
      description: "Exclusive $100 discount for orders over $500",
      promotionType: "FIXED_AMOUNT_DISCOUNT",
      value: 100,
      minimumOrderValue: 500,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
      couponCode: "PREMIUM100",
      applyToAllItems: true,
      requiresAuthentication: true,
      usageLimit: 50,
    });

    // 3. BUY ONE GET ONE PROMOTIONS
    // =============================

    // 3a. BOGO on all items
    testPromotions.push({
      name: "[TEST] Buy One Get One 50% Off",
      description: "Buy any item and get the cheapest item 50% off",
      promotionType: "BUY_ONE_GET_ONE",
      value: 50, // 50% off the cheaper item
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
      couponCode: "BOGO50",
      applyToAllItems: true,
      usageLimit: 200,
    });

    // 3b. Category-specific BOGO
    if (categories.length > 0) {
      testPromotions.push({
        name: "[TEST] BOGO Bracelets",
        description: "Buy one bracelet, get the second one free!",
        promotionType: "BUY_ONE_GET_ONE",
        value: 100, // 100% off = free
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-12-31"),
        isActive: true,
        couponCode: "BOGOBRACELET",
        applyToAllItems: false,
      });
    }

    // 4. FREE ITEM PROMOTIONS
    // =======================

    // Note: FREE_ITEM promotions require a specific product to be free
    // We'll create this if we have products available
    if (products.length > 0) {
      const freeItemProduct = products[0]; // Use first product as free item

      testPromotions.push({
        name: "[TEST] Free Gift with Purchase",
        description: `Get a free ${freeItemProduct.name} with any order over $300`,
        promotionType: "FREE_ITEM",
        value: 0, // Not used for free item
        minimumOrderValue: 300,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-12-31"),
        isActive: true,
        couponCode: "FREEGIFT",
        applyToAllItems: true,
        freeItemId: freeItemProduct.id,
        usageLimit: 100,
      });
    }

    // 5. EDGE CASE AND ERROR TESTING PROMOTIONS
    // =========================================

    // 5a. Expired promotion
    testPromotions.push({
      name: "[TEST] Expired Promotion",
      description: "This promotion has expired - should not work",
      promotionType: "PERCENTAGE_DISCOUNT",
      value: 50,
      startDate: new Date("2023-01-01"),
      endDate: new Date("2023-12-31"), // Expired
      isActive: true,
      couponCode: "EXPIRED50",
      applyToAllItems: true,
    });

    // 5b. Inactive promotion
    testPromotions.push({
      name: "[TEST] Inactive Promotion",
      description: "This promotion is inactive - should not work",
      promotionType: "PERCENTAGE_DISCOUNT",
      value: 40,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      isActive: false, // Inactive
      couponCode: "INACTIVE40",
      applyToAllItems: true,
    });

    // 5c. Limited usage promotion (for testing usage limits)
    testPromotions.push({
      name: "[TEST] Limited Use - 2 Uses Only",
      description: "This promotion can only be used 2 times total",
      promotionType: "FIXED_AMOUNT_DISCOUNT",
      value: 25,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
      couponCode: "LIMITED2",
      applyToAllItems: true,
      usageLimit: 2, // Very low limit for testing
    });

    // 5d. High minimum order value (for testing minimum requirements)
    testPromotions.push({
      name: "[TEST] High Minimum Order",
      description: "Requires $1000 minimum order - for testing",
      promotionType: "PERCENTAGE_DISCOUNT",
      value: 15,
      minimumOrderValue: 1000, // Very high minimum
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
      couponCode: "HIGHMIN15",
      applyToAllItems: true,
    });

    // 6. SEASONAL/THEMED PROMOTIONS
    // =============================

    // 6a. Holiday promotion
    testPromotions.push({
      name: "[TEST] Holiday Special",
      description: "Special holiday discount for the season",
      promotionType: "PERCENTAGE_DISCOUNT",
      value: 35,
      startDate: new Date("2024-12-01"),
      endDate: new Date("2025-01-15"),
      isActive: true,
      couponCode: "HOLIDAY35",
      applyToAllItems: true,
      usageLimit: 500,
    });

    // 6b. Flash sale (short duration)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    testPromotions.push({
      name: "[TEST] Flash Sale 48 Hours",
      description: "48-hour flash sale - act fast!",
      promotionType: "PERCENTAGE_DISCOUNT",
      value: 45,
      startDate: tomorrow,
      endDate: dayAfterTomorrow,
      isActive: true,
      couponCode: "FLASH45",
      applyToAllItems: true,
      usageLimit: 100,
    });

    // Create all promotions
    console.log(`Creating ${testPromotions.length} test promotions...`);

    for (const promotion of testPromotions) {
      try {
        const created = await prisma.promotion.create({
          data: promotion,
        });
        console.log(`✅ Created: ${created.name} (${created.couponCode})`);
      } catch (error) {
        console.error(`❌ Failed to create ${promotion.name}:`, error.message);
      }
    }

    // If we have categories, connect category-specific promotions
    if (categories.length > 0) {
      const braceletCategory = categories.find((cat) =>
        cat.name.toLowerCase().includes("bracelet")
      );
      if (braceletCategory) {
        // Connect bracelet promotions to bracelet category
        const braceletPromotions = await prisma.promotion.findMany({
          where: {
            OR: [{ couponCode: "BRACELETS30" }, { couponCode: "BOGOBRACELET" }],
          },
        });

        for (const promo of braceletPromotions) {
          await prisma.promotion.update({
            where: { id: promo.id },
            data: {
              categories: {
                connect: { id: braceletCategory.id },
              },
            },
          });
          console.log(
            `🔗 Connected ${promo.couponCode} to ${braceletCategory.name} category`
          );
        }
      }
    }

    // Create test summary
    const allTestPromotions = await prisma.promotion.findMany({
      where: {
        name: { contains: "[TEST]" },
      },
      include: {
        categories: { select: { name: true } },
        products: { select: { name: true } },
        freeItem: { select: { name: true } },
      },
    });

    console.log("\n🎉 Test Promotion Summary:");
    console.log("=".repeat(50));

    allTestPromotions.forEach((promo) => {
      console.log(`\n📋 ${promo.name}`);
      console.log(`   Code: ${promo.couponCode}`);
      console.log(`   Type: ${promo.promotionType}`);
      console.log(
        `   Value: ${promo.value}${promo.promotionType.includes("PERCENTAGE") ? "%" : "$"}`
      );
      console.log(`   Active: ${promo.isActive ? "✅" : "❌"}`);
      console.log(
        `   Auth Required: ${promo.requiresAuthentication ? "🔐" : "🌐"}`
      );
      console.log(`   One-time Use: ${promo.isOneTimeUse ? "1️⃣" : "♻️"}`);
      if (promo.minimumOrderValue) {
        console.log(`   Min Order: $${promo.minimumOrderValue}`);
      }
      if (promo.usageLimit) {
        console.log(`   Usage Limit: ${promo.usageLimit}`);
      }
      if (promo.categories.length > 0) {
        console.log(
          `   Categories: ${promo.categories.map((c) => c.name).join(", ")}`
        );
      }
      if (promo.freeItem) {
        console.log(`   Free Item: ${promo.freeItem.name}`);
      }
    });

    console.log("\n🧪 Testing Instructions:");
    console.log("=".repeat(50));
    console.log("1. Use these coupon codes in your checkout process");
    console.log("2. Test with different cart totals and items");
    console.log("3. Test as both guest and authenticated users");
    console.log("4. Try using codes multiple times to test usage limits");
    console.log("5. Test expired and inactive codes to verify error handling");
    console.log("\n📝 Quick Test Codes:");
    console.log("   SAVE20     - 20% off everything");
    console.log("   TEST10     - $10 off any order");
    console.log("   WELCOME15  - 15% off (one-time use)");
    console.log("   VIP25      - 25% off (requires login)");
    console.log("   EXPIRED50  - Should fail (expired)");
    console.log("   LIMITED2   - Only 2 uses allowed");
  } catch (error) {
    console.error("❌ Error creating test promotions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createPromotionTestCases();
