// scripts/product-types/seed-product-types.ts
import { PrismaClient, AttributeType } from '@prisma/client';

// Create a new PrismaClient instance
const prisma = new PrismaClient();

async function main() {
  console.log("Starting product type migration...");
  
  try {
    // Create basic product types
    const jewelryType = await prisma.productType.create({
      data: {
        name: 'Jewelry',
        description: 'Jewelry products including rings, necklaces, etc.'
      }
    });
    
    const footwearType = await prisma.productType.create({
      data: {
        name: 'Footwear',
        description: 'Shoes, boots, and other footwear'
      }
    });
    
    const electronicsType = await prisma.productType.create({
      data: {
        name: 'Electronics',
        description: 'Electronic devices and accessories'
      }
    });
    
    const clothingType = await prisma.productType.create({
      data: {
        name: 'Clothing',
        description: 'Apparel and clothing items'
      }
    });
    
    // Create attributes for jewelry products
    const jewelryProductAttributes = [
      {
        name: 'style',
        displayName: 'Style',
        description: 'Style of the jewelry piece',
        type: AttributeType.STRING,
        isRequired: true,
        options: JSON.stringify(['Classic', 'Modern', 'Vintage', 'Art Deco', 'Minimalist']),
        isForProduct: true,
        productTypeId: jewelryType.id
      },
      {
        name: 'materials',
        displayName: 'Materials',
        description: 'Materials used in the jewelry',
        type: AttributeType.ARRAY,
        isRequired: true,
        options: JSON.stringify(['Gold', 'Silver', 'Platinum', 'Diamond', 'Pearl', 'Gemstones']),
        isForProduct: true,
        productTypeId: jewelryType.id
      },
      {
        name: 'collection',
        displayName: 'Collection',
        description: 'Collection the jewelry belongs to',
        type: AttributeType.STRING,
        isRequired: false,
        isForProduct: true,
        productTypeId: jewelryType.id
      }
    ];
    
    // Create attributes for jewelry inventory
    const jewelryInventoryAttributes = [
      {
        name: 'size',
        displayName: 'Size',
        description: 'Size of the jewelry item',
        type: AttributeType.STRING,
        isRequired: true,
        isForProduct: false,
        productTypeId: jewelryType.id
      },
      {
        name: 'material',
        displayName: 'Material',
        description: 'Primary material of this specific variant',
        type: AttributeType.STRING,
        isRequired: true,
        options: JSON.stringify(['Gold', 'Silver', 'Platinum', 'White Gold', 'Rose Gold']),
        isForProduct: false,
        productTypeId: jewelryType.id
      },
      {
        name: 'caratWeight',
        displayName: 'Carat Weight',
        description: 'Weight in carats for diamonds or gems',
        type: AttributeType.NUMBER,
        isRequired: false,
        isForProduct: false,
        productTypeId: jewelryType.id
      },
      {
        name: 'clarity',
        displayName: 'Clarity',
        description: 'Clarity grade for diamonds',
        type: AttributeType.STRING,
        isRequired: false,
        options: JSON.stringify(['VS1', 'VS2', 'SI1', 'SI2', 'VVS1', 'VVS2']),
        isForProduct: false,
        productTypeId: jewelryType.id
      }
    ];
    
    // Create attributes for footwear
    const footwearProductAttributes = [
      {
        name: 'brand',
        displayName: 'Brand',
        description: 'Brand name of the footwear',
        type: AttributeType.STRING,
        isRequired: true,
        isForProduct: true,
        productTypeId: footwearType.id
      },
      {
        name: 'gender',
        displayName: 'Gender',
        description: 'Target gender for the footwear',
        type: AttributeType.STRING,
        isRequired: true,
        options: JSON.stringify(['Men', 'Women', 'Unisex', 'Kids']),
        isForProduct: true,
        productTypeId: footwearType.id
      },
      {
        name: 'style',
        displayName: 'Style',
        description: 'Style of the footwear',
        type: AttributeType.STRING,
        isRequired: true,
        options: JSON.stringify(['Casual', 'Formal', 'Sports', 'Sandals', 'Boots']),
        isForProduct: true,
        productTypeId: footwearType.id
      }
    ];
    
    const footwearInventoryAttributes = [
      {
        name: 'size',
        displayName: 'Size',
        description: 'Size of the footwear',
        type: AttributeType.STRING,
        isRequired: true,
        isForProduct: false,
        productTypeId: footwearType.id
      },
      {
        name: 'color',
        displayName: 'Color',
        description: 'Color of the footwear',
        type: AttributeType.COLOR,
        isRequired: true,
        isForProduct: false,
        productTypeId: footwearType.id
      },
      {
        name: 'material',
        displayName: 'Material',
        description: 'Primary material of the footwear',
        type: AttributeType.STRING,
        isRequired: true,
        options: JSON.stringify(['Leather', 'Canvas', 'Synthetic', 'Suede', 'Mesh']),
        isForProduct: false,
        productTypeId: footwearType.id
      },
      {
        name: 'width',
        displayName: 'Width',
        description: 'Width of the footwear',
        type: AttributeType.STRING,
        isRequired: false,
        options: JSON.stringify(['Narrow', 'Regular', 'Wide', 'Extra Wide']),
        isForProduct: false,
        productTypeId: footwearType.id
      }
    ];

    // Create all the attributes for jewelry
    await prisma.productTypeAttribute.createMany({
      data: [...jewelryProductAttributes, ...jewelryInventoryAttributes]
    });
    
    // Create all the attributes for footwear
    await prisma.productTypeAttribute.createMany({
      data: [...footwearProductAttributes, ...footwearInventoryAttributes]
    });

    console.log("Product type migration completed successfully!");
    
  } catch (error) {
    console.error("Error in migration:", error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });