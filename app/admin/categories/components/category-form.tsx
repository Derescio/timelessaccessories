"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, CategoryFormValues } from "@/lib/types/category.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category, ProductType } from "@prisma/client";

interface CategoryFormProps {
    initialData?: Partial<CategoryFormValues>;
    categories?: Category[];
    onSubmit: (data: CategoryFormValues) => Promise<void>;
}

export function CategoryForm({ initialData, categories = [], onSubmit }: CategoryFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [isLoadingProductTypes, setIsLoadingProductTypes] = useState(false);

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema.omit({ id: true, createdAt: true, updatedAt: true })),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || null,
            parentId: initialData?.parentId || null,
            imageUrl: initialData?.imageUrl || null,
            slug: initialData?.slug || "",
            isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
            defaultProductTypeId: initialData?.defaultProductTypeId || null,
        },
    });

    useEffect(() => {
        const fetchProductTypes = async () => {
            setIsLoadingProductTypes(true);
            try {
                const response = await fetch('/api/product-types');
                const result = await response.json();
                if (result.success) {
                    setProductTypes(result.data);
                }
            } catch (error) {
                console.error("Failed to fetch product types:", error);
            } finally {
                setIsLoadingProductTypes(false);
            }
        };

        fetchProductTypes();
    }, []);

    const handleSubmit = async (data: CategoryFormValues) => {
        try {
            setIsLoading(true);
            await onSubmit(data);
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Category name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Category description"
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value || null)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Parent Category</FormLabel>
                            <Select
                                onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                                value={field.value || "none"}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a parent category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Image URL</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Category image URL"
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value || null)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                                <Input placeholder="category-slug" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="defaultProductTypeId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Default Product Type</FormLabel>
                            <Select
                                disabled={isLoading || isLoadingProductTypes}
                                onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                                value={field.value || "none"}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a default product type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {productTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Products in this category will use this product type by default
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save"}
                </Button>
            </form>
        </Form>
    );
} 