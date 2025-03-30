import { Metadata } from "next";
import { CategoryForm } from "../components/category-form";
import { getCategories, createCategory } from "@/lib/actions/category.actions";
import { CategoryFormValues } from "@/lib/types/category.types";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Admin | New Category",
    description: "Create a new product category",
};

interface NewCategoryPageProps {
    searchParams: Promise<{
        parentId?: string
    }>;
}

export default async function NewCategoryPage({ searchParams }: NewCategoryPageProps) {
    const resolvedParams = await searchParams;
    const categories = await getCategories();
    const { parentId } = resolvedParams;

    // If parentId is provided, find the parent in categories to use as context
    // const parent = parentId
    //     ? categories.find(cat => cat.id === parentId)
    //     : undefined;

    // Handle form submission
    const handleCreateCategory = async (data: CategoryFormValues) => {
        'use server';

        // Convert "none" value to null for parentId
        const formData = {
            ...data,
            parentId: data.parentId === "none" ? null : data.parentId,
            // Ensure imageUrl is always a string
            imageUrl: data.imageUrl || "",
        };

        const result = await createCategory(formData);

        if (result.success) {
            redirect('/admin/categories');
        } else {
            console.error("Failed to create category:", result.error);
            throw new Error(result.error || "Failed to create category");
        }
    };

    // Set default values for the form that match the expected type
    const defaultValues = parentId ? {
        name: "",
        description: "",
        imageUrl: "",
        parentId,
        slug: "",
        // Add dummy values for required Prisma fields to make TypeScript happy
        id: "temp-id", // This will be ignored when creating
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null
    } : undefined;

    return (
        <div className="container mx-auto py-6">
            <CategoryForm
                categories={categories}
                onSubmit={handleCreateCategory}
                initialData={defaultValues}
            />
        </div>
    );
} 