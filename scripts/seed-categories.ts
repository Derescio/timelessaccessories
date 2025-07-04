import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// Category structure definition
const categoryStructure = [
  {
    name: "Jewelry",
    description: "Fine jewelry collections",
    children: [
      { name: "Necklaces", description: "Beautiful necklaces and pendants" },
      { name: "Earrings", description: "Stud, hoop, and dangle earrings" },
      { name: "Bracelets", description: "Bracelets and bangles" },
      { name: "Rings", description: "Engagement, wedding, and fashion rings" },
      { name: "Watches", description: "Luxury and casual timepieces" },
    ]
  },
  // Add more categories as needed
];

// Function to create a single category
async function createCategory(name: string, description: string, parentId: string | null = null, userId: string) {
  const slug = slugify(name);
  
  console.log(`Creating category: ${name} (parent: ${parentId || 'none'})`);
  
  // Check if category already exists
  const existing = await prisma.category.findUnique({
    where: { slug }
  });
  
  if (existing) {
    console.log(`Category '${name}' already exists, skipping.`);
    return existing;
  }
  
  // Create new category
  return prisma.category.create({
    data: {
      name,
      description,
      slug,
      parentId,
      userId,
      imageUrl: "/images/placeholder.svg", // Default placeholder
    }
  });
}

// Recursive function to create categories and their children
async function createCategoryTree(
  categories: any[], 
  parentId: string | null = null,
  level = 0,
  userId: string
) {
  if (!categories || !categories.length) return;
  
  for (const cat of categories) {
    // Create the current category
    const category = await createCategory(
      cat.name, 
      cat.description || "", 
      parentId,
      userId
    );
    
    // Recursively create children if any
    if (cat.children && cat.children.length > 0) {
      await createCategoryTree(cat.children, category.id, level + 1, userId);
    }
  }
}

// Main function to seed all categories
async function seedCategories() {
  console.log("Starting category seeding...");
  
  try {
    // Find the first admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });
    
    if (!adminUser) {
      throw new Error("No admin user found. Please create an admin user first.");
    }
    
    await createCategoryTree(categoryStructure, null, 0, adminUser.id);
    console.log("Category seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding categories:", error);
    throw error;
  }
}

async function main() {
  console.log("Starting category seed script...");
  
  try {
    await seedCategories();
    console.log("Category seed script completed successfully!");
  } catch (error) {
    console.error("Error running seed script:", error);
    process.exit(1);
  }
}

main(); 