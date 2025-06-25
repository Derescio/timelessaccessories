"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { categorySchema, updateCategorySchema } from "@/lib/validators";
import { z } from "zod";

type CategoryFormValues = z.infer<typeof categorySchema>;

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
    return { success: false, error: "Failed to fetch category" };
  }
}

/**
 * Create a new category
 */
export async function createCategory(data: CategoryFormValues) {
  try {
    const session = await auth();
    const user = session?.user;
    const Admin = user?.role === "ADMIN";
    if (!Admin) {
      return { error: "Unauthorized" };
    }

    // Validate input data
    const validatedData = categorySchema.parse(data);

    // Check if category with same slug exists
    const existingCategory = await db.category.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingCategory) {
      return { error: "A category with this slug already exists" };
    }

    // Create the category
    const category = await db.category.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        slug: validatedData.slug,
        imageUrl: validatedData.imageUrl,
        parentId: validatedData.parentId,
        defaultProductTypeId: validatedData.defaultProductTypeId,
        isActive: validatedData.isActive,
      },
    });

    revalidatePath("/admin/categories");
    return { data: category };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid input data", details: error.errors };
    }
    return { error: "Failed to create category" };
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
        const isDescendant = await isChildDescendant(validatedData.id, validatedData.parentId);
        if (isDescendant) {
          return { 
            success: false, 
            error: "Cannot set a descendant category as parent" 
          };
        }
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
        userId: userId,
        isActive: validatedData.isActive,
      },
    });

    revalidatePath("/admin/categories");
    return { success: true, data: updatedCategory };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
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

    // Check if category exists and has no products
    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    // Check if category has products
    if (category._count.products > 0) {
      return { 
        success: false, 
        error: "Cannot delete category with products. Please remove all products first." 
      };
    }

    // Check if category has children
    if (category._count.children > 0) {
      return { 
        success: false, 
        error: "Cannot delete category with subcategories. Please remove all subcategories first." 
      };
    }

    // Delete the category
    await db.category.delete({
      where: { id },
    });

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete category" };
  }
}

/**
 * Helper function to determine if a potential parent category is actually
 * a descendant of the current category (which would create a circular reference)
 */
async function isChildDescendant(parentId: string, childId: string): Promise<boolean> {
  // If they're the same, it's a circular reference
  if (parentId === childId) {
    return true;
  }

  // Get the child's children
  const child = await db.category.findUnique({
    where: { id: childId },
    include: { children: true },
  });

  if (!child || child.children.length === 0) {
    return false;
  }

  // Check if any of the children are the parent or contain the parent as a descendant
  for (const grandchild of child.children) {
    if (await isChildDescendant(parentId, grandchild.id)) {
      return true;
    }
  }

  return false;
} 