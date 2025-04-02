"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema } from "@/lib/validators";
import { Category, ProductType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadButton } from "@/lib/uploadthing";
import Image from "next/image";
import { toast } from "sonner";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";

interface CategoryFormProps {
    initialData?: Partial<CategoryFormValues>;
    categories?: Category[];
    onSubmit: (data: CategoryFormValues) => Promise<void>;
}

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoryForm({ initialData, categories = [], onSubmit }: CategoryFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [isLoadingProductTypes, setIsLoadingProductTypes] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null);

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || undefined,
            parentId: initialData?.parentId || null,
            imageUrl: initialData?.imageUrl || "/placeholder.svg",
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
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || "none"}
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
                            <FormLabel>Image</FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-32 h-32">
                                        <Image
                                            src={field.value || "/placeholder.svg"}
                                            alt="Category image"
                                            fill
                                            className="object-cover rounded-md"
                                        />
                                    </div>
                                    <UploadButton
                                        endpoint="categoryImage"
                                        onClientUploadComplete={(res) => {
                                            if (res?.[0]?.url) {
                                                field.onChange(res[0].url);
                                                setImageUrl(res[0].url);
                                                toast.success("Image uploaded successfully");
                                            }
                                        }}
                                        onUploadError={(error: Error) => {
                                            toast.error(`Error uploading image: ${error.message}`);
                                        }}
                                    />
                                </div>
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
                            <FormDescription>
                                URL-friendly version of the name (e.g., "category-name")
                            </FormDescription>
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
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
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
                                onValueChange={field.onChange}
                                defaultValue={field.value || "none"}
                                disabled={isLoadingProductTypes}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a product type" />
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
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                </Button>
            </form>
        </Form>
    );
} 