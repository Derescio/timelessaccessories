// import { PrismaClient } from '@prisma/client';
// import { hash } from 'bcrypt-ts-edge';

// const prisma = new PrismaClient();

// async function main() {
//   // Clear existing data
//   await prisma.productInventory.deleteMany();
//   await prisma.productAttributeValue.deleteMany();
//   await prisma.productVariant.deleteMany();
//   await prisma.productImage.deleteMany();
//   await prisma.product.deleteMany();
//   await prisma.categoryAttribute.deleteMany();
//   await prisma.category.deleteMany();
//   await prisma.user.deleteMany();

//   // Create main categories
//   const jewelry = await prisma.category.create({
//     data: {
//       name: 'Jewelry',
//       slug: 'jewelry',
//       description: 'Elegant and timeless jewelry collection',
//     },
//   });

//   const clothing = await prisma.category.create({
//     data: {
//       name: 'Clothing',
//       slug: 'clothing',
//       description: 'Stylish and comfortable clothing collection',
//     },
//   });

//   const shoes = await prisma.category.create({
//     data: {
//       name: 'Shoes',
//       slug: 'shoes',
//       description: 'Trendy and comfortable footwear',
//     },
//   });

//   // Create jewelry subcategories
//   const necklaces = await prisma.category.create({
//     data: {
//       name: 'Necklaces',
//       slug: 'necklaces',
//       description: 'Beautiful necklaces for any occasion',
//       parentId: jewelry.id,
//     },
//   });

//   const bracelets = await prisma.category.create({
//     data: {
//       name: 'Bracelets',
//       slug: 'bracelets',
//       description: 'Stunning bracelets to complement your style',
//       parentId: jewelry.id,
//     },
//   });

//   const rings = await prisma.category.create({
//     data: {
//       name: 'Rings',
//       slug: 'rings',
//       description: 'Elegant rings for every occasion',
//       parentId: jewelry.id,
//     },
//   });

//   const charms = await prisma.category.create({
//     data: {
//       name: 'Charms',
//       slug: 'charms',
//       description: 'Unique charms to tell your story',
//       parentId: jewelry.id,
//     },
//   });

//   // Create clothing subcategories
//   const tops = await prisma.category.create({
//     data: {
//       name: 'Tops',
//       slug: 'tops',
//       description: 'Stylish tops and shirts',
//       parentId: clothing.id,
//     },
//   });

//   const pants = await prisma.category.create({
//     data: {
//       name: 'Pants',
//       slug: 'pants',
//       description: 'Comfortable pants and trousers',
//       parentId: clothing.id,
//     },
//   });

//   // Create category attributes
//   const materialAttr = await prisma.categoryAttribute.create({
//     data: {
//       name: 'Material',
//       type: 'MATERIAL',
//       required: true,
//       options: ['Gold', 'Silver', 'Rose Gold', 'Platinum'],
//       categoryId: jewelry.id,
//     },
//   });

//   const jewelrySizeAttr = await prisma.categoryAttribute.create({
//     data: {
//       name: 'Size',
//       type: 'SIZE',
//       required: true,
//       options: ['XS', 'S', 'M', 'L'],
//       categoryId: jewelry.id,
//     },
//   });

//   const clothingSizeAttr = await prisma.categoryAttribute.create({
//     data: {
//       name: 'Size',
//       type: 'SIZE',
//       required: true,
//       options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
//       categoryId: clothing.id,
//     },
//   });

//   const shoeSizeAttr = await prisma.categoryAttribute.create({
//     data: {
//       name: 'Size',
//       type: 'SIZE',
//       required: true,
//       options: ['6', '7', '8', '9', '10', '11', '12'],
//       categoryId: shoes.id,
//     },
//   });

//   const colorAttr = await prisma.categoryAttribute.create({
//     data: {
//       name: 'Color',
//       type: 'COLOR',
//       required: true,
//       options: ['Black', 'White', 'Blue', 'Red', 'Green'],
//       categoryId: clothing.id,
//     },
//   });

//   // Create products array combining jewelry and clothing
//   const products = [
//     // Jewelry Products
//     {
//       name: 'Classic Chain Necklace',
//       slug: 'classic-chain-necklace',
//       description: 'Timeless chain necklace perfect for any outfit',
//       price: 299.99,
//       hasDiscount: true,
//       discountPercentage: 15,
//       compareAtPrice: 349.99,
//       sku: 'NCK-001',
//       categoryId: necklaces.id,
//       images: ['/images/necklace.png'],
//       type: 'jewelry',
//     },
//     {
//       name: 'Elegant Charm Bracelet',
//       slug: 'elegant-charm-bracelet',
//       description: 'Beautiful bracelet with customizable charms',
//       price: 199.99,
//       hasDiscount: false,
//       sku: 'BRC-001',
//       categoryId: bracelets.id,
//       images: ['/images/Bracelets.png'],
//       type: 'jewelry',
//     },
//     {
//       name: 'Diamond Solitaire Ring',
//       slug: 'diamond-solitaire-ring',
//       description: 'Classic solitaire ring with brilliant cut diamond',
//       price: 999.99,
//       hasDiscount: true,
//       discountPercentage: 10,
//       compareAtPrice: 1099.99,
//       sku: 'RNG-001',
//       categoryId: rings.id,
//       images: ['/images/rings.png'],
//       type: 'jewelry',
//     },
//     {
//       name: 'Butterfly Charm Collection',
//       slug: 'butterfly-charm-collection',
//       description: 'Set of delicate butterfly charms',
//       price: 79.99,
//       hasDiscount: true,
//       discountPercentage: 20,
//       compareAtPrice: 99.99,
//       sku: 'CHM-001',
//       categoryId: charms.id,
//       images: ['/images/charms.png'],
//       type: 'jewelry',
//     },
//     // Clothing Products
//     {
//       name: 'Blue Blazer',
//       slug: 'blue-blazer',
//       description: 'Classic blue blazer for a sophisticated look',
//       price: 199.99,
//       hasDiscount: true,
//       discountPercentage: 20,
//       compareAtPrice: 249.99,
//       sku: 'BLZ-001',
//       categoryId: tops.id,
//       images: ['/images/blue_blazer.jpg'],
//       type: 'clothing',
//     },
//     {
//       name: 'Cargo Pants',
//       slug: 'cargo-pants',
//       description: 'Comfortable and stylish cargo pants',
//       price: 89.99,
//       hasDiscount: false,
//       sku: 'PNT-001',
//       categoryId: pants.id,
//       images: ['/images/baggy_cargo_pants.jpg'],
//       type: 'clothing',
//     },
//     // Shoes Products
//     {
//       name: 'Classic Loafers',
//       slug: 'classic-loafers',
//       description: 'Timeless leather loafers',
//       price: 159.99,
//       hasDiscount: true,
//       discountPercentage: 15,
//       compareAtPrice: 189.99,
//       sku: 'SHO-001',
//       categoryId: shoes.id,
//       images: ['/images/loafers.jpg'],
//       type: 'shoes',
//     },
//     {
//       name: 'White Adidas Sneakers',
//       slug: 'white-adidas-sneakers',
//       description: 'Comfortable and stylish sneakers',
//       price: 129.99,
//       hasDiscount: false,
//       sku: 'SHO-002',
//       categoryId: shoes.id,
//       images: ['/images/white_addidas_shoes.jpg'],
//       type: 'shoes',
//     },
//   ];

//   // Create products with their variants and inventory
//   for (const productData of products) {
//     const product = await prisma.product.create({
//       data: {
//         name: productData.name,
//         slug: productData.slug,
//         description: productData.description,
//         price: productData.price,
//         hasDiscount: productData.hasDiscount,
//         discountPercentage: productData.discountPercentage,
//         compareAtPrice: productData.compareAtPrice,
//         sku: productData.sku,
//         categoryId: productData.categoryId,
//         images: {
//           create: productData.images.map((url) => ({
//             url,
//             alt: productData.name,
//           })),
//         },
//       },
//     });

//     // Create variants based on product type
//     if (productData.type === 'jewelry') {
//       const sizes = ['S', 'M', 'L'];
//       const materials = ['Gold', 'Silver', 'Rose Gold'];

//       for (const size of sizes) {
//         for (const material of materials) {
//           const variant = await prisma.productVariant.create({
//             data: {
//               productId: product.id,
//               sku: `${product.sku}-${size}-${material}`.toUpperCase(),
//               price: material === 'Gold' 
//                 ? Number(product.price) * 1.5 
//                 : material === 'Silver' 
//                   ? Number(product.price) * 0.8 
//                   : Number(product.price),
//               attributes: {
//                 create: [
//                   {
//                     productId: product.id,
//                     attributeId: jewelrySizeAttr.id,
//                     value: size,
//                   },
//                   {
//                     productId: product.id,
//                     attributeId: materialAttr.id,
//                     value: material,
//                   },
//                 ],
//               },
//             },
//           });

//           // Create inventory for variant
//           await prisma.productInventory.create({
//             data: {
//               variantId: variant.id,
//               productId: product.id,
//               quantity: 10,
//               lowStock: 3,
//             },
//           });
//         }
//       }
//     } else if (productData.type === 'clothing') {
//       const sizes = ['S', 'M', 'L', 'XL'];
//       const colors = ['Black', 'White', 'Blue'];

//       for (const size of sizes) {
//         for (const color of colors) {
//           const variant = await prisma.productVariant.create({
//             data: {
//               productId: product.id,
//               sku: `${product.sku}-${size}-${color}`.toUpperCase(),
//               price: Number(product.price),
//               attributes: {
//                 create: [
//                   {
//                     productId: product.id,
//                     attributeId: clothingSizeAttr.id,
//                     value: size,
//                   },
//                   {
//                     productId: product.id,
//                     attributeId: colorAttr.id,
//                     value: color,
//                   },
//                 ],
//               },
//             },
//           });

//           // Create inventory for variant
//           await prisma.productInventory.create({
//             data: {
//               variantId: variant.id,
//               productId: product.id,
//               quantity: 15,
//               lowStock: 5,
//             },
//           });
//         }
//       }
//     } else if (productData.type === 'shoes') {
//       const sizes = ['7', '8', '9', '10', '11'];
//       const colors = ['Black', 'White'];

//       for (const size of sizes) {
//         for (const color of colors) {
//           const variant = await prisma.productVariant.create({
//             data: {
//               productId: product.id,
//               sku: `${product.sku}-${size}-${color}`.toUpperCase(),
//               price: Number(product.price),
//               attributes: {
//                 create: [
//                   {
//                     productId: product.id,
//                     attributeId: shoeSizeAttr.id,
//                     value: size,
//                   },
//                   {
//                     productId: product.id,
//                     attributeId: colorAttr.id,
//                     value: color,
//                   },
//                 ],
//               },
//             },
//           });

//           // Create inventory for variant
//           await prisma.productInventory.create({
//             data: {
//               variantId: variant.id,
//               productId: product.id,
//               quantity: 8,
//               lowStock: 2,
//             },
//           });
//         }
//       }
//     }
//   }

//   // Create a test user
//   const hashedPassword = await hash('password123', 10);
// //   const user = await prisma.user.create({
// //     data: {
// //       email: 'test@example.com',
// //       password: hashedPassword,
// //       name: 'Test User',
// //       role: 'USER',
// //     },
// //   });

//   console.log('Seed data created successfully!');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });