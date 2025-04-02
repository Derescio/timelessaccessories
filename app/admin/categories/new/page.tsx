"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CategoryForm } from "../components/category-form";
import { createCategory } from "@/lib/actions/category.actions";
import { toast } from "sonner";
import { Category } from "@prisma/client";

export default function NewCategoryPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                const result = await response.json();
                if (result.success) {
                    setCategories(result.data);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };

        fetchCategories();
    }, []);

    const handleCreateCategory = async (data: any) => {
        try {
            setIsSubmitting(true);

            // Convert "none" to null for parentId
            const formData = {
                ...data,
                parentId: data.parentId === "none" ? null : data.parentId,
                imageUrl: data.imageUrl || null,
            };

            const result = await createCategory(formData);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Category created successfully");
            router.push("/admin/categories");
            router.refresh();
        } catch (error) {
            console.error("Error creating category:", error);
            toast.error("Failed to create category");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Category</h1>
                    <p className="text-muted-foreground">
                        Add a new category to organize your products.
                    </p>
                </div>
                <CategoryForm categories={categories} onSubmit={handleCreateCategory} />
            </div>
        </div>
    );
} 