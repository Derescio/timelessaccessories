"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CategoryForm } from "../components/category-form";
import { getCategoryById, updateCategory } from "@/lib/actions/category.actions";
import { toast } from "sonner";
import { Category } from "@prisma/client";
import { categorySchema } from "@/lib/validators";
import { z } from "zod";

type CategoryFormValues = z.infer<typeof categorySchema>;

interface EditCategoryPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [category, setCategory] = useState<Category | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const initializeData = async () => {
            try {
                const resolvedParams = await params;
                setCategoryId(resolvedParams.id);

                const result = await getCategoryById(resolvedParams.id);
                if (result.success && result.data) {
                    setCategory(result.data);
                } else {
                    toast.error("Failed to fetch category");
                }

                const response = await fetch('/api/categories');
                const data = await response.json();
                if (data.success) {
                    setCategories(data.data);
                } else {
                    toast.error("Failed to fetch categories");
                }
            } catch (error) {
                toast.error("Failed to initialize data");
            }
        };

        initializeData();
    }, [params]);

    const handleUpdateCategory = async (data: CategoryFormValues) => {
        if (!categoryId) return;

        try {
            setIsLoading(true);
            const result = await updateCategory({
                id: categoryId,
                ...data,
                parentId: data.parentId === "none" ? null : data.parentId,
                description: data.description || undefined,
                imageUrl: data.imageUrl || "/placeholder.svg",
            });

            if (result.success) {
                toast.success("Category updated successfully");
                router.push("/admin/categories");
            } else {
                toast.error(result.error || "Failed to update category");
            }
        } catch (error) {
            toast.error("An error occurred while updating the category");
        } finally {
            setIsLoading(false);
        }
    };

    if (!category) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
            </div>
            <CategoryForm
                initialData={{
                    name: category.name,
                    description: category.description || undefined,
                    imageUrl: category.imageUrl || undefined,
                    parentId: category.parentId || undefined,
                    slug: category.slug,
                    isActive: true,
                    defaultProductTypeId: category.defaultProductTypeId || undefined,
                }}
                categories={categories}
                onSubmit={handleUpdateCategory}
            />
        </div>
    );
} 