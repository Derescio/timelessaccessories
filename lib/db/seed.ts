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
//   const clothing = await prisma.category.create({
//     data: {
//       name: 'Clothing',
//       slug: 'clothing',
//       description: 'Stylish and comfortable clothing collection',
//     },
//   });

//   // Create subcategories
//   const tops = await prisma.category.create({
//     data: {
//       name: 'Tops',
//       slug: 'tops',
//       description: 'T-shirts, shirts, and tops',
//       parentId: clothing.id,
//     },
//   });

//   const bottoms = await prisma.category.create({
//     data: {
//       name: 'Bottoms',
//       slug: 'bottoms',
//       description: 'Pants, shorts, and skirts',
//       parentId: clothing.id,
//     },
//   });

//   // Create category attributes
//   const sizeAttr = await prisma.categoryAttribute.create({
//     data: {
//       name: 'Size',
//       type: 'SIZE',
//       required: true,
//       options: ['XS', 'S', 'M', 'L', 'XL'],
//       categoryId: tops.id,
//     },
//   });

//   const colorAttr = await prisma.categoryAttribute.create({
//     data: {
//       name: 'Color',
//       type: 'COLOR',
//       required: true,
//       options: ['Blue', 'Yellow', 'Green', 'White', 'Red'],
//       categoryId: tops.id,
//     },
//   });

//   // Create products
//   const products = [
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
//     },
//     {
//       name: 'Blue Long Sleeve',
//       slug: 'blue-long-sleeve',
//       description: 'Comfortable blue long sleeve shirt',
//       price: 49.99,
//       hasDiscount: false,
//       sku: 'BLS-001',
//       categoryId: tops.id,
//       images: ['/images/blue_tall_sleeve.jpg'],
//     },
//     {
//       name: 'Yellow Long Sleeve',
//       slug: 'yellow-long-sleeve',
//       description: 'Vibrant yellow long sleeve shirt',
//       price: 49.99,
//       hasDiscount: true,
//       discountPercentage: 15,
//       compareAtPrice: 59.99,
//       sku: 'YLS-001',
//       categoryId: tops.id,
//       images: ['/images/yellow_tall_sleeve.jpg'],
//     },
//   ];

//   for (const productData of products) {
//     const { images, ...data } = productData;
//     const product = await prisma.product.create({
//       data: {
//         ...data,
//         images: {
//           create: images.map((url, index) => ({
//             url,
//             alt: productData.name,
//             position: index,
//           })),
//         },
//       },
//     });

//     // Create variants for each product
//     const sizes = ['S', 'M', 'L'];
//     const colors = productData.name.toLowerCase().includes('blue') ? ['Blue'] : 
//                   productData.name.toLowerCase().includes('yellow') ? ['Yellow'] : ['White'];

//     for (const size of sizes) {
//       for (const color of colors) {
//         const variant = await prisma.productVariant.create({
//           data: {
//             productId: product.id,
//             sku: `${productData.sku}-${size}-${color}`,
//             price: productData.price,
//             attributes: {
//               create: [
//                 {
//                   attributeId: sizeAttr.id,
//                   value: size,
//                   productId: product.id,
//                 },
//                 {
//                   attributeId: colorAttr.id,
//                   value: color,
//                   productId: product.id,
//                 },
//               ],
//             },
//             inventory: {
//               create: {
//                 productId: product.id,
//                 quantity: 10,
//                 lowStock: 3,
//               },
//             },
//           },
//         });
//       }
//     }
//   }

//   // Create a test user
//   const hashedPassword = await hash('password123', 10);
//   const user = await prisma.user.create({
//     data: {
//       email: 'test@example.com',
//       password: hashedPassword,
//       name: 'Test User',
//       role: 'USER',
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