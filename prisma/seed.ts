// import { PrismaClient } from '@prisma/client';
// import { hash } from 'bcrypt-ts-edge';

// const prisma = new PrismaClient();

// async function main() {
//   // Create main categories
//   const jewelry = await prisma.category.create({
//     data: {
//       name: 'Jewelry',
//       slug: 'jewelry',
//       description: 'Fine jewelry collection',
//     },
//   });

//   // Create subcategories
//   const necklaces = await prisma.category.create({
//     data: {
//       name: 'Necklaces',
//       slug: 'necklaces',
//       description: 'Beautiful necklaces for any occasion',
//       parentId: jewelry.id,
//     },
//   });

//   // Create category attributes
//   const materialAttr = await prisma.categoryAttribute.create({
//     data: {
//       name: 'Material',
//       type: 'MATERIAL',
//       required: true,
//       options: ['Gold', 'Silver', 'Rose Gold'],
//       categoryId: necklaces.id,
//     },
//   });

//   const lengthAttr = await prisma.categoryAttribute.create({
//     data: {
//       name: 'Length',
//       type: 'LENGTH',
//       required: true,
//       options: ['16"', '18"', '20"', '24"'],
//       categoryId: necklaces.id,
//     },
//   });

//   // Create a product
//   const product = await prisma.product.create({
//     data: {
//       name: 'Classic Chain Necklace',
//       slug: 'classic-chain-necklace',
//       description: 'Elegant chain necklace suitable for any occasion',
//       price: 199.99,
//       sku: 'NCK-CHAIN-001',
//       categoryId: necklaces.id,
//       images: {
//         create: [
//           {
//             url: 'https://example.com/images/necklace-1.jpg',
//             alt: 'Classic Chain Necklace - Gold',
//             position: 0,
//           },
//         ],
//       },
//     },
//   });

//   // Create product variants
//   const variants = await Promise.all([
//     // Gold, 18" variant
//     prisma.productVariant.create({
//       data: {
//         productId: product.id,
//         sku: 'NCK-CHAIN-001-G18',
//         price: 199.99,
//         attributes: {
//           create: [
//             {
//               attributeId: materialAttr.id,
//               value: 'Gold',
//               productId: product.id,
//             },
//             {
//               attributeId: lengthAttr.id,
//               value: '18"',
//               productId: product.id,
//             },
//           ],
//         },
//         inventory: {
//           create: {
//             productId: product.id,
//             quantity: 10,
//             lowStock: 3,
//           },
//         },
//       },
//     }),
//     // Silver, 18" variant
//     prisma.productVariant.create({
//       data: {
//         productId: product.id,
//         sku: 'NCK-CHAIN-001-S18',
//         price: 149.99,
//         attributes: {
//           create: [
//             {
//               attributeId: materialAttr.id,
//               value: 'Silver',
//               productId: product.id,
//             },
//             {
//               attributeId: lengthAttr.id,
//               value: '18"',
//               productId: product.id,
//             },
//           ],
//         },
//         inventory: {
//           create: {
//             productId: product.id,
//             quantity: 15,
//             lowStock: 3,
//           },
//         },
//       },
//     }),
//   ]);

//   // Create a test user
//   const hashedPassword = await hash('password123', 10);
//   const user = await prisma.user.create({
//     data: {
//       email: 'test@example.com',
//       password: hashedPassword,
//       name: 'Test User',
//       role: 'CUSTOMER',
//     },
//   });

//   // Create a wishlist for the user
//   const wishlist = await prisma.wishlist.create({
//     data: {
//       userId: user.id,
//       items: {
//         create: {
//           productId: product.id,
//         },
//       },
//     },
//   });

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