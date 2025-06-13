const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function setupWelcome10Promotion() {
  try {
    console.log("Setting up WELCOME10 promotion...");

    // Check if WELCOME10 already exists
    const existingPromotion = await prisma.promotion.findFirst({
      where: { couponCode: "WELCOME10" },
    });

    if (existingPromotion) {
      console.log(
        "WELCOME10 promotion already exists. Updating isOneTimeUse flag..."
      );

      const updatedPromotion = await prisma.promotion.update({
        where: { id: existingPromotion.id },
        data: {
          isOneTimeUse: true,
          description: "Welcome discount for new customers - one time use only",
        },
      });

      console.log("✅ Updated WELCOME10 promotion:", {
        id: updatedPromotion.id,
        name: updatedPromotion.name,
        couponCode: updatedPromotion.couponCode,
        isOneTimeUse: updatedPromotion.isOneTimeUse,
        value: updatedPromotion.value.toString(),
      });
    } else {
      console.log("Creating new WELCOME10 promotion...");

      const newPromotion = await prisma.promotion.create({
        data: {
          name: "Welcome Discount",
          description: "Welcome discount for new customers - one time use only",
          promotionType: "PERCENTAGE_DISCOUNT",
          value: 10, // 10% off
          startDate: new Date("2024-01-01"),
          endDate: new Date("2025-12-31"),
          isActive: true,
          couponCode: "WELCOME10",
          usageLimit: null, // No global limit, but one-time per user
          usageCount: 0,
          isOneTimeUse: true, // This is the key flag
          applyToAllItems: true,
          minimumOrderValue: 25, // Minimum $25 order
        },
      });

      console.log("✅ Created WELCOME10 promotion:", {
        id: newPromotion.id,
        name: newPromotion.name,
        couponCode: newPromotion.couponCode,
        isOneTimeUse: newPromotion.isOneTimeUse,
        value: newPromotion.value.toString(),
        minimumOrderValue: newPromotion.minimumOrderValue?.toString(),
      });
    }

    // Also update any other promotions that should be one-time use
    const otherOneTimePromotions = ["FIRSTTIME", "NEWUSER", "SIGNUP"];

    for (const code of otherOneTimePromotions) {
      const promo = await prisma.promotion.findFirst({
        where: { couponCode: code },
      });

      if (promo) {
        await prisma.promotion.update({
          where: { id: promo.id },
          data: { isOneTimeUse: true },
        });
        console.log(`✅ Updated ${code} to be one-time use`);
      }
    }

    console.log("\n🎉 WELCOME10 promotion setup complete!");
    console.log("\nKey features:");
    console.log("• 10% discount on orders over $25");
    console.log("• One-time use per user (tracked by email)");
    console.log("• Works for both guest and authenticated users");
    console.log("• Prevents reuse when guest becomes authenticated user");
  } catch (error) {
    console.error("❌ Error setting up WELCOME10 promotion:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupWelcome10Promotion();
