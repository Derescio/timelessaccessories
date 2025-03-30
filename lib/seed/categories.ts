// import { db } from "@/lib/db";
// import { slugify } from "@/lib/utils";

// // Category structure definition
// export const categoryStructure = [
//   {
//     name: "Jewelry",
//     description: "Fine jewelry collections",
//     children: [
//       { name: "Necklaces", description: "Beautiful necklaces and pendants" },
//       { name: "Earrings", description: "Stud, hoop, and dangle earrings" },
//       { name: "Bracelets", description: "Bracelets and bangles" },
//       { name: "Rings", description: "Engagement, wedding, and fashion rings" },
//       { name: "Watches", description: "Luxury and casual timepieces" },
//     ]
//   },
//   {
//     name: "Clothing",
//     description: "Fashion apparel for all",
//     children: [
//       {
//         name: "Men's Clothing",
//         description: "Clothing for men",
//         children: [
//           { name: "Men's Shirts", description: "Formal and casual shirts for men" },
//           { name: "Men's Pants", description: "Trousers, jeans, and shorts for men" },
//           { name: "Men's Suits", description: "Formal suits and blazers for men" },
//           { name: "Men's Outerwear", description: "Jackets and coats for men" },
//         ]
//       },
//       {
//         name: "Women's Clothing",
//         description: "Clothing for women",
//         children: [
//           { name: "Women's Tops", description: "Blouses, shirts, and tops for women" },
//           { name: "Women's Bottoms", description: "Pants, skirts, and shorts for women" },
//           { name: "Women's Dresses", description: "Formal and casual dresses" },
//           { name: "Women's Outerwear", description: "Jackets and coats for women" },
//         ]
//       },
//       {
//         name: "Children's Clothing",
//         description: "Clothing for kids",
//         children: [
//           { name: "Boys' Clothing", description: "Clothing for boys" },
//           { name: "Girls' Clothing", description: "Clothing for girls" },
//           { name: "Baby Clothing", description: "Clothing for infants and toddlers" },
//         ]
//       }
//     ]
//   },
//   {
//     name: "Footwear",
//     description: "Shoes and footwear",
//     children: [
//       { name: "Men's Footwear", description: "Shoes for men" },
//       { name: "Women's Footwear", description: "Shoes for women" },
//       { name: "Children's Footwear", description: "Shoes for kids" },
//     ]
//   },
//   {
//     name: "Electronics",
//     description: "Electronic devices and accessories",
//     children: [
//       { name: "Smartphones", description: "Mobile phones and accessories" },
//       { name: "Laptops", description: "Notebook computers and accessories" },
//       { name: "Audio", description: "Headphones, earbuds, and speakers" },
//       { name: "Wearables", description: "Smartwatches and fitness trackers" },
//     ]
//   },
// ];

// // Function to create a single category
// async function createCategory(name: string, description: string, parentId: string | null = null, userId: string) {
//   const slug = slugify(name);
  
//   console.log(`Creating category: ${name} (parent: ${parentId || 'none'})`);
  
//   // Check if category already exists
//   const existing = await db.category.findUnique({
//     where: { slug }
//   });
  
//   if (existing) {
//     console.log(`Category '${name}' already exists, skipping.`);
//     return existing;
//   }
  
//   // Create new category
//   return db.category.create({
//     data: {
//       name,
//       description,
//       slug,
//       parentId,
//       userId,
//       imageUrl: "/placeholder.svg", // Default placeholder
//     }
//   });
// }

// // Recursive function to create categories and their children
// export async function createCategoryTree(
//   categories: any[], 
//   parentId: string | null = null,
//   level = 0,
//   userId: string
// ) {
//   if (!categories || !categories.length) return;
  
//   for (const cat of categories) {
//     // Create the current category
//     const category = await createCategory(
//       cat.name, 
//       cat.description || "", 
//       parentId,
//       userId
//     );
    
//     // Recursively create children if any
//     if (cat.children && cat.children.length > 0) {
//       await createCategoryTree(cat.children, category.id, level + 1, userId);
//     }
//   }
// }

// // Main function to seed all categories
// export async function seedCategories() {
//   console.log("Starting category seeding...");
  
//   try {
//     // Find the first admin user
//     const adminUser = await db.user.findFirst({
//       where: { role: "ADMIN" }
//     });
    
//     if (!adminUser) {
//       throw new Error("No admin user found. Please create an admin user first.");
//     }
    
//     await createCategoryTree(categoryStructure, null, 0, adminUser.id);
//     console.log("Category seeding completed successfully!");
//   } catch (error) {
//     console.error("Error seeding categories:", error);
//     throw error;
//   }
// } 