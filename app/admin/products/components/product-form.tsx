"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createProduct, updateProduct } from "@/lib/actions/product.actions";

const formSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    description: z.string().min(10, { message: "Description must be at least 10 characters" }),
    slug: z.string().min(2, { message: "Slug must be at least 2 characters" }),
    categoryId: z.string({ required_error: "Please select a category" }),
    isActive: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
    initialData?: ProductFormValues;
    categories: { id: string; name: string }[];
}

export function ProductForm({ initialData, categories }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const isEditing = !!initialData?.id;

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: "",
            description: "",
            slug: "",
            categoryId: "",
            isActive: true,
        },
    });

    const onSubmit = async (data: ProductFormValues) => {
        try {
            setLoading(true);

            if (isEditing) {
                // Ensure id is defined for update operation
                if (!data.id) {
                    throw new Error("Product ID is required for updating a product");
                }

                const result = await updateProduct({
                    ...data,
                    id: data.id // Explicitly include id to satisfy TypeScript
                });

                if (result.success) {
                    toast.success("Product updated successfully");
                    router.push("/admin/products");
                    router.refresh();
                } else {
                    toast.error(result.error || "Failed to update product");
                }
            } else {
                const result = await createProduct(data);
                if (result.success) {
                    toast.success("Product created successfully");
                    router.push("/admin/products");
                    router.refresh();
                } else {
                    toast.error(result.error || "Failed to create product");
                }
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate slug from name
    const handleNameChange = (name: string) => {
        if (!isEditing && name) {
            form.setValue(
                "slug",
                name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "")
            );
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Product name"
                                    onChange={(e) => {
                                        field.onChange(e);
                                        handleNameChange(e.target.value);
                                    }}
                                    disabled={loading}
                                />
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
                                    {...field}
                                    placeholder="Product description"
                                    rows={5}
                                    disabled={loading}
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
                                <Input {...field} placeholder="product-slug" disabled={loading} />
                            </FormControl>
                            <FormDescription>
                                Used for the URL. Auto-generated from name.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                                disabled={loading}
                                onValueChange={field.onChange}
                                value={field.value}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
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
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Active</FormLabel>
                                <FormDescription>
                                    Enable to make this product visible to customers.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={loading}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex items-center justify-end gap-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/admin/products")}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {isEditing ? "Update Product" : "Create Product"}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 