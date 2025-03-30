"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, CategoryFormValues } from "@/lib/types/category.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@prisma/client";

interface CategoryFormProps {
    initialData?: Category;
    onSubmit: (data: CategoryFormValues) => Promise<void>;
    categories: Category[];
}

export function CategoryForm({ initialData, onSubmit, categories }: CategoryFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema.omit({ id: true, createdAt: true, updatedAt: true })),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            parentId: initialData?.parentId || null,
            imageUrl: initialData?.imageUrl || "",
            slug: initialData?.slug || "",
        },
    });

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
                                <Textarea placeholder="Category description" {...field} />
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
                            <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
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
                                <Input placeholder="Category image URL" {...field} />
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

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save"}
                </Button>
            </form>
        </Form>
    );
} 