import { Metadata } from "next";
import { CategoryForm } from "../components/category-form";
import { getCategoryById, getCategories, updateCategory } from "@/lib/actions/category.actions";
import { notFound } from "next/navigation";
import { CategoryFormValues } from "@/lib/types/category.types";
import { redirect } from "next/navigation";
import { Category } from "@prisma/client";

export const metadata: Metadata = {
    title: "Admin | Edit Category",
    description: "Edit product category",
};

interface EditCategoryPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
    // Ensure params is awaited before accessing properties
    const { id: categoryId } = await Promise.resolve(params);

    // Get category and all categories for parent dropdown
    const [categoryResult, allCategories] = await Promise.all([
        getCategoryById(categoryId),
        getCategories(),
    ]);

    if (!categoryResult.success || !categoryResult.data) {
        notFound();
    }

    const category = categoryResult.data;

    // Filter out the current category from the list of parent options to prevent self-reference
    const availableParentCategories = allCategories.filter((cat: Category) => cat.id !== categoryId);

    // Create the onSubmit handler for form submission
    const handleUpdateCategory = async (data: CategoryFormValues) => {
        'use server';

        const result = await updateCategory({
            id: categoryId,
            ...data,
            // Convert "none" value to null for parentId
            parentId: data.parentId === "none" ? null : data.parentId,
            // Ensure imageUrl is always a string
            imageUrl: data.imageUrl || "",
            // Ensure required fields for TypeScript
            isActive: true,
        });

        if (result.success) {
            redirect('/admin/categories');
        } else {
            console.error("Failed to update category:", result.error);
            throw new Error(result.error || "Failed to update category");
        }
    };

    return (
        <div className="container mx-auto py-6">
            <CategoryForm
                initialData={category}
                categories={availableParentCategories}
                onSubmit={handleUpdateCategory}
            />
        </div>
    );
} 