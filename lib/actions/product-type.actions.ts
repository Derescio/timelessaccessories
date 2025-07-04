// lib/actions/product-type.actions.ts
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { db } from '../db';
import { Prisma, AttributeType } from '@prisma/client';
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

// import { revalidatePath } from 'next/cache';
// import { auth } from '@/auth';
// import { AttributeType } from '@prisma/client';

export async function createProductType(name: string, description?: string | null) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }
    
    const productType = await prisma.productType.create({
      data: {
        name,
        description
      }
    });
    
    revalidatePath("/admin/product-types");
    return { success: true, data: productType };
  } catch (error) {
    console.error("Error creating product type:", error);
    return { success: false, error: "Failed to create product type" };
  }
}

export async function getProductTypes() {
  try {
    const productTypes = await prisma.productType.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    return { success: true, data: productTypes };
  } catch (error) {
    console.error("Error fetching product types:", error);
    return { success: false, error: "Failed to fetch product types" };
  }
}

export async function getProductTypeById(id: string) {
  try {
    const productType = await prisma.productType.findUnique({
      where: { id },
      include: {
        attributes: true
      }
    });
    
    if (!productType) {
      return { success: false, error: "Product type not found" };
    }
    
    return { success: true, data: productType };
  } catch (error) {
    console.error("Error fetching product type:", error);
    return { success: false, error: "Failed to fetch product type" };
  }
}

export async function getProductTypeAttributes(productTypeId: string, isForProduct: boolean) {
  try {
    const attributes = await prisma.productTypeAttribute.findMany({
      where: { 
        productTypeId,
        isForProduct
      },
      orderBy: {
        displayName: 'asc'
      }
    });
    
    return { success: true, data: attributes };
  } catch (error) {
    console.error("Error fetching product type attributes:", error);
    return { success: false, error: "Failed to fetch product type attributes" };
  }
}

export async function getProductTypeAttributeById(attributeId: string) {
  try {
    const attribute = await prisma.productTypeAttribute.findUnique({
      where: { id: attributeId }
    });
    
    if (!attribute) {
      return { success: false, error: "Attribute not found" };
    }
    
    return { success: true, data: attribute };
  } catch (error) {
    console.error("Error fetching product type attribute:", error);
    return { success: false, error: "Failed to fetch product type attribute" };
  }
}

export async function getProductAttributeValues(productId: string) {
  try {
    const attributeValues = await prisma.productAttributeValue.findMany({
      where: { productId },
      include: {
        attribute: true
      }
    });
    
    // Transform to a more usable format for the UI
    const formattedValues = attributeValues.reduce((acc, item) => {
      acc[item.attributeId] = item.value;
      return acc;
    }, {} as Record<string, string>);
    
    return { 
      success: true, 
      data: { 
        raw: attributeValues,
        formatted: formattedValues
      } 
    };
  } catch (error) {
    console.error("Error fetching product attribute values:", error);
    return { success: false, error: "Failed to fetch product attribute values" };
  }
}

export async function getInventoryAttributeValues(inventoryId: string) {
  try {
    const attributeValues = await prisma.inventoryAttributeValue.findMany({
      where: { inventoryId },
      include: {
        attribute: true
      }
    });
    
    // Transform to a more usable format for the UI
    const formattedValues = attributeValues.reduce((acc, item) => {
      acc[item.attributeId] = item.value;
      return acc;
    }, {} as Record<string, string>);
    
    return { 
      success: true, 
      data: { 
        raw: attributeValues,
        formatted: formattedValues
      } 
    };
  } catch (error) {
    console.error("Error fetching inventory attribute values:", error);
    return { success: false, error: "Failed to fetch inventory attribute values" };
  }
}

// lib/actions/product-type.actions.ts
export async function updateProductType(data: {
  id: string;
  name: string;
  description: string | null;
}) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }
    
    const productType = await db.productType.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description
      }
    });
    
    revalidatePath("/admin/product-types");
    revalidatePath(`/admin/product-types/${data.id}`);
    return { success: true, data: productType };
  } catch (error) {
    console.error("Error updating product type:", error);
    return { success: false, error: "Failed to update product type" };
  }
}

export async function deleteProductType(id: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    // Check if product type exists
    const existingType = await prisma.productType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!existingType) {
      return { success: false, error: "Product type not found" };
    }

    // Prevent deletion if product type has products
    if (existingType._count.products > 0) {
      return { 
        success: false, 
        error: "Cannot delete product type with associated products" 
      };
    }

    // Delete the product type
    await prisma.productType.delete({
      where: { id },
    });

    revalidatePath("/admin/product-types");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product type:", error);
    return { 
      success: false, 
      error: "Failed to delete product type" 
    };
  }
}

export async function createProductTypeAttribute(data: {
  productTypeId: string;
  name: string;
  displayName: string;
  description?: string | null;
  type: AttributeType;
  isRequired: boolean;
  options?: string | null;
  isForProduct: boolean;
  isForInventory: boolean;
}) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }
    
    console.log("Creating attribute with type:", data.type);
    
    const attribute = await db.productTypeAttribute.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        type: data.type,
        isRequired: data.isRequired,
        options: data.options || Prisma.JsonNull,
        isForProduct: data.isForProduct,
        isForInventory: data.isForInventory,
        productTypeId: data.productTypeId
      }
    });
    
    revalidatePath(`/admin/product-types/${data.productTypeId}`);
    revalidatePath(`/admin/product-types/${data.productTypeId}/attributes`);
    return { success: true, data: attribute };
  } catch (error) {
    console.error("Error creating attribute:", error);
    return { success: false, error: "Failed to create attribute" };
  }
}

export async function updateProductTypeAttribute(data: {
  id: string;
  productTypeId: string;
  name: string;
  displayName: string;
  description?: string;
  type: AttributeType;
  isRequired: boolean;
  options?: string | null;
  isForProduct: boolean;
  isForInventory: boolean;
}) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }
    
    const attribute = await db.productTypeAttribute.update({
      where: { id: data.id },
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        type: data.type,
        isRequired: data.isRequired,
        options: data.options || Prisma.JsonNull,
        isForProduct: data.isForProduct,
        isForInventory: data.isForInventory
      }
    });
    
    revalidatePath(`/admin/product-types/${data.productTypeId}`);
    revalidatePath(`/admin/product-types/${data.productTypeId}/attributes`);
    return { success: true, data: attribute };
  } catch (error) {
    console.error("Error updating attribute:", error);
    return { success: false, error: "Failed to update attribute" };
  }
}

export async function deleteProductTypeAttribute(id: string, productTypeId: string) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }
    
    await db.productTypeAttribute.delete({
      where: { id }
    });
    
    revalidatePath(`/admin/product-types/${productTypeId}`);
    revalidatePath(`/admin/product-types/${productTypeId}/attributes`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting attribute:", error);
    return { success: false, error: "Failed to delete attribute" };
  }
}

// Add these functions to your existing product-type.actions.ts file

// export async function getProductTypeAttributeById(attributeId: string) {
//   try {
//       const attribute = await prisma.productTypeAttribute.findUnique({
//           where: { id: attributeId },
//           include: {
//               productType: true
//           }
//       });

//       if (!attribute) {
//           return { success: false, error: "Attribute not found" };
//       }

//       return { success: true, data: attribute };
//   } catch (error) {
//       console.error("Error fetching attribute:", error);
//       return { success: false, error: "Failed to fetch attribute" };
//   }
// }

// export async function updateProductTypeAttribute(
//   attributeId: string, 
//   data: {
//       displayName: string;
//       description?: string;
//       type: AttributeType;
//       isRequired: boolean;
//       isForProduct: boolean;
//       options?: string;
//   }
// ) {
//   try {
//       const updatedAttribute = await prisma.productTypeAttribute.update({
//           where: { id: attributeId },
//           data: {
//               displayName: data.displayName,
//               description: data.description,
//               type: data.type,
//               isRequired: data.isRequired,
//               isForProduct: data.isForProduct,
//               options: data.options,
//           }
//       });

//       return { success: true, data: updatedAttribute };
//   } catch (error) {
//       console.error("Error updating attribute:", error);
//       return { success: false, error: "Failed to update attribute" };
//   }
// }