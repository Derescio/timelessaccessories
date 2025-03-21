// import { PrismaClient, Prisma } from '@prisma/client';
// import { hash } from 'bcrypt-ts-edge';

// const prisma = new PrismaClient();

// async function main() {
//   try {
//     console.log('Starting seed process...');

//     // Create main categories
//     const jewelry = await prisma.category.create({
//       data: {
//         name: 'Jewelry',
//         slug: 'jewelry',
//         description: 'Elegant and timeless jewelry collection',
//         imageUrl: '/images/categories/jewelry.jpg',
//       },
//     });

//     // Create jewelry subcategories
//     const necklaces = await prisma.category.create({
//       data: {
//         name: 'Necklaces',
//         slug: 'necklaces',
//         description: 'Beautiful necklaces for any occasion',
//         imageUrl: '/images/categories/necklaces.jpg',
//         parentId: jewelry.id,
//       },
//     });

//     const rings = await prisma.category.create({
//       data: {
//         name: 'Rings',
//         slug: 'rings',
//         description: 'Elegant rings for every occasion',
//         imageUrl: '/images/categories/rings.jpg',
//         parentId: jewelry.id,
//       },
//     });

//     const bracelets = await prisma.category.create({
//       data: {
//         name: 'Bracelets',
//         slug: 'bracelets',
//         description: 'Stunning bracelets to complement your style',
//         imageUrl: '/images/categories/bracelets.jpg',
//         parentId: jewelry.id,
//       },
//     });

//     console.log('Categories created successfully');

//     // Create products with their inventories
//     // 1. Necklace product with variants
//     const necklace = await prisma.product.create({
//       data: {
//         name: 'Classic Chain Necklace',
//         slug: 'classic-chain-necklace',
//         description: 'Timeless chain necklace perfect for any outfit',
//         categoryId: necklaces.id,
//         isActive: true,
//         metadata: {
//           featured: true,
//           collection: 'Summer 2024',
//           materials: ['Gold', 'Silver'],
//           style: 'Classic'
//         },
//       },
//     });

//     // Create necklace inventories
//     await prisma.productInventory.create({
//       data: {
//         productId: necklace.id,
//         sku: 'NCK001-G-18',
//         costPrice: new Prisma.Decimal(150.00),
//         retailPrice: new Prisma.Decimal(299.99),
//         compareAtPrice: new Prisma.Decimal(349.99),
//         discountPercentage: 15,
//         hasDiscount: true,
//         quantity: 10,
//         images: ['/images/necklace.png'],
//         attributes: {
//           material: 'Gold',
//           length: '18 inches',
//           weight: '3.5g'
//         },
//         isDefault: true,
//       },
//     });

//     await prisma.productInventory.create({
//       data: {
//         productId: necklace.id,
//         sku: 'NCK001-S-18',
//         costPrice: new Prisma.Decimal(75.00),
//         retailPrice: new Prisma.Decimal(199.99),
//         quantity: 15,
//         images: ['/images/necklace.png'],
//         attributes: {
//           material: 'Silver',
//           length: '18 inches',
//           weight: '3.5g'
//         },
//       },
//     });

//     // 2. Ring product with variants
//     const ring = await prisma.product.create({
//       data: {
//         name: 'Diamond Solitaire Ring',
//         slug: 'diamond-solitaire-ring',
//         description: 'Classic solitaire ring with brilliant cut diamond',
//         categoryId: rings.id,
//         isActive: true,
//         metadata: {
//           featured: true,
//           collection: 'Bridal',
//           materials: ['Gold', 'Platinum'],
//           style: 'Classic'
//         },
//       },
//     });

//     await prisma.productInventory.create({
//       data: {
//         productId: ring.id,
//         sku: 'RNG001-G-7',
//         costPrice: new Prisma.Decimal(500.00),
//         retailPrice: new Prisma.Decimal(999.99),
//         compareAtPrice: new Prisma.Decimal(1299.99),
//         discountPercentage: 23,
//         hasDiscount: true,
//         quantity: 5,
//         images: ['/images/rings.png'],
//         attributes: {
//           material: 'Gold',
//           size: '7',
//           caratWeight: '1.0',
//           clarity: 'VS1'
//         },
//         isDefault: true,
//       },
//     });

//     // 3. Bracelet product
//     const bracelet = await prisma.product.create({
//       data: {
//         name: 'Charm Bracelet',
//         slug: 'charm-bracelet',
//         description: 'Beautiful charm bracelet with customizable charms',
//         categoryId: bracelets.id,
//         isActive: true,
//         metadata: {
//           featured: false,
//           collection: 'Summer 2024',
//           materials: ['Silver'],
//           style: 'Modern'
//         },
//       },
//     });

//     await prisma.productInventory.create({
//       data: {
//         productId: bracelet.id,
//         sku: 'BRC001-S-7',
//         costPrice: new Prisma.Decimal(100.00),
//         retailPrice: new Prisma.Decimal(199.99),
//         quantity: 8,
//         images: ['/images/Bracelets.png'],
//         attributes: {
//           material: 'Silver',
//           length: '7 inches',
//           charms: 3
//         },
//         isDefault: true,
//       },
//     });

//     console.log('Products and inventories created successfully');

//     // Create users
//     const hashedPassword = await hash('password123', 10);

//     const user = await prisma.user.create({
//       data: {
//         email: 'newuser@example.com',
//         password: hashedPassword,
//         name: 'Regular User',
//         role: 'USER',
//       },
//     });

//     const admin = await prisma.user.create({
//       data: {
//         email: 'despo@example.com',
//         password: hashedPassword,
//         name: 'Admin User',
//         role: 'ADMIN',
//       },
//     });

//     // Create an address for the user
//     await prisma.address.create({
//       data: {
//         userId: user.id,
//         street: '123 Main St',
//         city: 'New York',
//         state: 'NY',
//         postalCode: '10001',
//         country: 'USA',
//       },
//     });

//     // // Create a wishlist for the user
//     const wishlist = await prisma.wishlist.create({
//       data: {
//         userId: user.id,
//         items: {
//           create: [
//             { productId: necklace.id },
//             { productId: ring.id },
//           ],
//         },
//       },
//     });

//     console.log('Users and related data created successfully');
//     console.log('Seed completed successfully!');

//   } catch (error) {
//     console.error('Error in seed script:', error);
//     throw error;
//   }
// }

// main()
//   .catch((e) => {
//     console.error('Seed error:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });