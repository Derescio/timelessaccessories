import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt-ts-edge';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productInventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create main categories
  const Jewelery = await prisma.category.create({
    data: {
      name: 'Jewelery',
      slug: 'Jewelery',
      description: 'Elegant and timeless Jewelery collection',
    },
  });

  const clothing = await prisma.category.create({
    data: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Stylish and comfortable clothing collection',
    },
  });

  const shoes = await prisma.category.create({
    data: {
      name: 'Shoes',
      slug: 'shoes',
      description: 'Trendy and comfortable footwear',
    },
  });

  // Create Jewelery subcategories
  const necklaces = await prisma.category.create({
    data: {
      name: 'Necklaces',
      slug: 'necklaces',
      description: 'Beautiful necklaces for any occasion',
      parentId: Jewelery.id,
    },
  });

  const rings = await prisma.category.create({
    data: {
      name: 'Rings',
      slug: 'rings',
      description: 'Elegant rings for every occasion',
      parentId: Jewelery.id,
    },
  });

  // Products data with their inventories
  const products = [
    {
      name: 'Classic Chain Necklace',
      slug: 'classic-chain-necklace',
      description: 'Timeless chain necklace perfect for any outfit',
      categoryId: necklaces.id,
      isActive: true,
      isFeatured: true,
      inventories: [
        {
          sku: 'NCK001-G-18',
          costPrice: 150.00,
          retailPrice: 299.99,
          compareAtPrice: 349.99,
          discountPercentage: 15,
          hasDiscount: true,
          quantity: 10,
          images: ['/images/necklace.png'],
          attributes: {
            material: 'Gold',
            length: '18 inches',
          },
          isDefault: true,
        },
        {
          sku: 'NCK001-S-18',
          costPrice: 75.00,
          retailPrice: 199.99,
          quantity: 15,
          images: ['/images/necklace.png'],
          attributes: {
            material: 'Silver',
            length: '18 inches',
          },
        },
      ],
    },
    {
      name: 'Diamond Solitaire Ring',
      slug: 'diamond-solitaire-ring',
      description: 'Classic solitaire ring with brilliant cut diamond',
      categoryId: rings.id,
      isActive: true,
      isFeatured: true,
      inventories: [
        {
          sku: 'RNG001-G-7',
          costPrice: 500.00,
          retailPrice: 999.99,
          compareAtPrice: 1299.99,
          discountPercentage: 23,
          hasDiscount: true,
          quantity: 5,
          images: ['/images/rings.png'],
          attributes: {
            material: 'Gold',
            size: '7',
            caratWeight: '1.0',
          },
          isDefault: true,
        },
        {
          sku: 'RNG001-P-7',
          costPrice: 600.00,
          retailPrice: 1199.99,
          quantity: 3,
          images: ['/images/rings.png'],
          attributes: {
            material: 'Platinum',
            size: '7',
            caratWeight: '1.0',
          },
        },
      ],
    },
    {
      name: 'Classic Blue Blazer',
      slug: 'classic-blue-blazer',
      description: 'Timeless blue blazer for any formal occasion',
      categoryId: clothing.id,
      isActive: true,
      isFeatured: true,
      inventories: [
        {
          sku: 'BLZ001-BL-M',
          costPrice: 89.99,
          retailPrice: 199.99,
          compareAtPrice: 249.99,
          discountPercentage: 20,
          hasDiscount: true,
          quantity: 20,
          images: ['/images/blue_blazer.jpg'],
          attributes: {
            color: 'Blue',
            size: 'M',
          },
          isDefault: true,
        },
        {
          sku: 'BLZ001-BL-L',
          costPrice: 89.99,
          retailPrice: 199.99,
          compareAtPrice: 249.99,
          discountPercentage: 20,
          hasDiscount: true,
          quantity: 15,
          images: ['/images/blue_blazer.jpg'],
          attributes: {
            color: 'Blue',
            size: 'L',
          },
        },
      ],
    },
    {
      name: 'Classic Leather Loafers',
      slug: 'classic-leather-loafers',
      description: 'Comfortable and elegant leather loafers',
      categoryId: shoes.id,
      isActive: true,
      isFeatured: true,
      inventories: [
        {
          sku: 'SHO001-BLK-42',
          costPrice: 79.99,
          retailPrice: 159.99,
          compareAtPrice: 189.99,
          discountPercentage: 15,
          hasDiscount: true,
          quantity: 10,
          images: ['/images/loafers.jpg'],
          attributes: {
            color: 'Black',
            size: '42',
            material: 'Leather',
          },
          isDefault: true,
        },
        {
          sku: 'SHO001-BRW-42',
          costPrice: 79.99,
          retailPrice: 159.99,
          quantity: 8,
          images: ['/images/loafers.jpg'],
          attributes: {
            color: 'Brown',
            size: '42',
            material: 'Leather',
          },
        },
      ],
    },
  ];

  // Create products and their inventories
  for (const productData of products) {
    const { inventories, ...productInfo } = productData;
    
    const product = await prisma.product.create({
      data: {
        ...productInfo,
        inventories: {
          create: inventories,
        },
      },
    });

    console.log(`Created product: ${product.name}`);
  }

  // Create a test user
  const hashedPassword = await hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      role: 'USER',
    },
  });
  console.log(`Created test user: ${user.email}`);

  // Create an admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });