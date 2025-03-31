"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { categorySchema, CategoryFormValues } from "@/lib/types/category.types";
import { updateCategorySchema } from "@/lib/validators";

/**
 * Get all categories
 */
export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Get a specific category by ID
 */
export async function getCategoryById(id: string) {
  try {
    const category = await db.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    return { success: true, data: category };
  } catch (error) {
    console.error("Error fetching category:", error);
    return { success: false, error: "Failed to fetch category" };
  }
}

/**
 * Create a new category
 */
export async function createCategory(data: CategoryFormValues) {
  try {
    const validatedData = categorySchema.parse(data);
    
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }

    // Check if slug is already in use
    const existingCategory = await db.category.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingCategory) {
      return { 
        success: false, 
        error: "A category with this slug already exists" 
      };
    }

    // Create category with userId from the session
    const category = await db.category.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        imageUrl: validatedData.imageUrl,
        slug: validatedData.slug,
        parentId: validatedData.parentId || null,
        defaultProductTypeId: validatedData.defaultProductTypeId || null,
        userId: session.user.id, // Add the userId from the session
      },
    });

    revalidatePath("/admin/categories");
    return { success: true, data: category };
  } catch (error) {
    console.error("Error creating category:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint error
      if (error.code === 'P2002') {
        return { 
          success: false, 
          error: "A category with this slug already exists" 
        };
      }
    }
    
    return { success: false, error: "Failed to create category" };
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(data: CategoryFormValues & { id: string }) {
  try {
    const validatedData = updateCategorySchema.parse(data);
    
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingCategory) {
      return { success: false, error: "Category not found" };
    }

    // If userId is not set on the category, update it to the current user
    const userId = existingCategory.userId || session.user.id;

    // Check if new slug is already in use by another category
    if (validatedData.slug !== existingCategory.slug) {
      const slugExists = await db.category.findFirst({
        where: {
          slug: validatedData.slug,
          id: { not: validatedData.id },
        },
      });

      if (slugExists) {
        return { 
          success: false, 
          error: "Another category is already using this slug" 
        };
      }
    }

    // Check for circular parent-child relationship
    if (validatedData.parentId) {
      // Can't set parent to self
      if (validatedData.parentId === validatedData.id) {
        return { 
          success: false, 
          error: "A category cannot be its own parent" 
        };
      }

      // If we're keeping the same parent, skip the descendant check
      if (validatedData.parentId !== existingCategory.parentId) {
        console.log("Parent is changing from", existingCategory.parentId, "to", validatedData.parentId);
        
        // Check if the new parent is one of this category's descendants
        const isDescendant = await isChildDescendant(validatedData.id, validatedData.parentId);
        if (isDescendant) {
          return { 
            success: false, 
            error: "Cannot set a descendant category as parent" 
          };
        }
      } else {
        console.log("Parent is not changing, skipping descendant check");
      }
    }

    // Update category with userId
    const updatedCategory = await db.category.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        imageUrl: validatedData.imageUrl,
        parentId: validatedData.parentId,
        slug: validatedData.slug,
        defaultProductTypeId: validatedData.defaultProductTypeId || null,
        userId: userId, // Add the userId
      },
    });

    revalidatePath("/admin/categories");
    return { success: true, data: updatedCategory };
  } catch (error) {
    console.error("Error updating category:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint error
      if (error.code === 'P2002') {
        return { 
          success: false, 
          error: "A category with this slug already exists" 
        };
      }
    }
    
    return { success: false, error: "Failed to update category" };
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }

    // Check if category exists
    const category = await db.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: {
          select: { id: true },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    // Check if category has children
    if (category.children.length > 0) {
      return { 
        success: false, 
        error: "Cannot delete a category with subcategories. Please delete or reassign subcategories first." 
      };
    }

    // Check if category has products
    if (category.products.length > 0) {
      return { 
        success: false, 
        error: "Cannot delete a category with associated products. Please reassign or delete the products first." 
      };
    }

    // Delete category
    await db.category.delete({
      where: { id },
    });

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}

/**
 * Helper function to determine if a potential parent category is actually
 * a descendant of the current category (which would create a circular reference)
 */
async function isChildDescendant(parentId: string, childId: string): Promise<boolean> {
  console.log(`Checking if ${childId} is a descendant of ${parentId}`);
  
  // If they're the same, it's a circular reference
  if (parentId === childId) {
    console.log(`Direct circular reference detected: ${parentId} === ${childId}`);
    return true;
  }

  // Get the child's children
  const child = await db.category.findUnique({
    where: { id: childId },
    include: { children: true },
  });

  console.log(`Child category ${childId}:`, child?.name);
  console.log(`Children of ${childId}:`, child?.children.map(c => `${c.id} (${c.name})`));

  if (!child || child.children.length === 0) {
    console.log(`No children found for ${childId}, returning false`);
    return false;
  }

  // Check if any of the children are the parent or contain the parent as a descendant
  for (const grandchild of child.children) {
    console.log(`Checking grandchild ${grandchild.id} (${grandchild.name})`);
    if (await isChildDescendant(parentId, grandchild.id)) {
      console.log(`Found circular reference through grandchild ${grandchild.id}`);
      return true;
    }
  }

  console.log(`No circular reference found between ${parentId} and ${childId}`);
  return false;
} 