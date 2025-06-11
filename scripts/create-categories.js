const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createDefaultCategories() {
  console.log("🏷️ Creating default categories for Printify POD...");

  const categories = [
    {
      name: "T-Shirts & Apparel",
      slug: "t-shirts-apparel",
      description: "Custom printed t-shirts, hoodies, and clothing",
    },
    {
      name: "Phone Cases",
      slug: "phone-cases",
      description: "Custom printed phone cases and mobile accessories",
    },
    {
      name: "Bags & Totes",
      slug: "bags-totes",
      description: "Custom printed bags, totes, and carrying accessories",
    },
    {
      name: "Home & Living",
      slug: "home-living",
      description: "Custom printed mugs, pillows, and home decor",
    },
    {
      name: "Stickers & Prints",
      slug: "stickers-prints",
      description: "Custom stickers, posters, and printed materials",
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Custom printed accessories and miscellaneous items",
    },
  ];

  for (const categoryData of categories) {
    try {
      // Check if category already exists
      const existingCategory = await prisma.category.findUnique({
        where: { slug: categoryData.slug },
      });

      if (existingCategory) {
        console.log(`✅ Category "${categoryData.name}" already exists`);
        continue;
      }

      // Create new category
      const category = await prisma.category.create({
        data: categoryData,
      });

      console.log(`✅ Created category: ${category.name} (ID: ${category.id})`);
    } catch (error) {
      console.error(
        `❌ Error creating category "${categoryData.name}":`,
        error.message
      );
    }
  }

  console.log("🎉 Categories setup complete!");
}

createDefaultCategories()
  .catch((error) => {
    console.error("❌ Error setting up categories:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
