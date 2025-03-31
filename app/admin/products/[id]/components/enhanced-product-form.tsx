// app/admin/products/components/enhanced-product-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { extendedProductSchema, ExtendedProductFormValues } from "@/lib/types/product.types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductTypeAttribute, AttributeType, Category, ProductType } from "@prisma/client";
import { getProductTypeAttributes, getProductAttributeValues } from "@/lib/actions/product-type.actions";

interface EnhancedProductFormProps {
    initialData?: Partial<ExtendedProductFormValues>;
    categories: Category[];
    productTypes: ProductType[];
    onSubmit: (data: ExtendedProductFormValues) => Promise<void>;
    useProductTypes?: boolean; // Flag to enable/disable product types
}

export function EnhancedProductForm({
    initialData,
    categories,
    productTypes,
    onSubmit,
    useProductTypes = false,
}: EnhancedProductFormProps) {
    const [loading, setLoading] = useState(false);
    const [productTypeAttributes, setProductTypeAttributes] = useState<ProductTypeAttribute[]>([]);

    // Pull featured from metadata if it exists (for backward compatibility)
    const initialFeatured = initialData?.isFeatured ||
        (initialData?.metadata && initialData.metadata.featured) || false;

    const form = useForm<ExtendedProductFormValues>({
        resolver: zodResolver(extendedProductSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            slug: initialData?.slug || "",
            categoryId: initialData?.categoryId || "",
            isActive: initialData?.isActive ?? true,
            // New fields
            productTypeId: initialData?.productTypeId || "",
            isFeatured: initialFeatured,
            metadata: initialData?.metadata || {},
            attributeValues: {},
        },
    });

    // Load product type attributes when product type changes
    const productTypeId = form.watch("productTypeId");

    useEffect(() => {
        if (useProductTypes && productTypeId) {
            const loadAttributes = async () => {
                const result = await getProductTypeAttributes(productTypeId, true);
                if (result.success && result.data) {
                    setProductTypeAttributes(result.data);
                }
            };

            loadAttributes();
        } else {
            setProductTypeAttributes([]);
        }
    }, [productTypeId, useProductTypes]);

    // Load existing attribute values if editing
    useEffect(() => {
        if (useProductTypes && initialData?.id && initialData?.productTypeId) {
            const loadAttributeValues = async () => {
                if (!initialData.id) return;
                const result = await getProductAttributeValues(initialData.id);
                if (result.success && result.data) {
                    form.setValue("attributeValues", result.data.formatted);
                }
            };

            loadAttributeValues();
        }
    }, [initialData?.id, initialData?.productTypeId, form, useProductTypes]);

    const handleSubmit = async (data: ExtendedProductFormValues) => {
        try {
            setLoading(true);
            await onSubmit(data);
        } catch (error) {
            console.error("Error submitting form:", error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                            <Textarea rows={5} {...field} />
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
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Organization</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
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

                            {/* Only show product type if feature is enabled */}
                            {useProductTypes && (
                                <FormField
                                    control={form.control}
                                    name="productTypeId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Type</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value || ""}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a product type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {productTypes.map((type) => (
                                                        <SelectItem key={type.id} value={type.id}>
                                                            {type.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Determines what attributes are available for this product
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div>
                                            <FormLabel>Active</FormLabel>
                                            <FormDescription>
                                                Active products are visible to customers
                                            </FormDescription>
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
                                name="isFeatured"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div>
                                            <FormLabel>Featured</FormLabel>
                                            <FormDescription>
                                                Featured products appear on the homepage
                                            </FormDescription>
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
                        </CardContent>
                    </Card>
                </div>

                {/* Dynamic Attributes Card - only shown if feature is enabled */}
                {useProductTypes && productTypeAttributes.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Attributes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {productTypeAttributes.map((attribute) => {
                                    // Parse options if this is a SELECT type attribute
                                    let options: string[] = [];
                                    if (attribute.type === AttributeType.ARRAY && attribute.options) {
                                        try {
                                            options = JSON.parse(attribute.options as string);
                                        } catch (e) {
                                            console.error(`Failed to parse options for attribute ${attribute.name}:`, e);
                                        }
                                    }

                                    return (
                                        <FormField
                                            key={attribute.id}
                                            control={form.control}
                                            name={`attributeValues.${attribute.id}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{attribute.displayName}</FormLabel>
                                                    <FormControl>
                                                        {attribute.type === AttributeType.ARRAY ? (
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                value={field.value || ""}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={`Select ${attribute.displayName}`} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {options.map((option, index) => (
                                                                        <SelectItem key={index} value={option}>
                                                                            {option}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : attribute.type === AttributeType.NUMBER ? (
                                                            <Input {...field} type="number" />
                                                        ) : attribute.type === AttributeType.BOOLEAN ? (
                                                            <Switch
                                                                checked={!!field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        ) : (
                                                            // Default for STRING, TEXT and others
                                                            <Input {...field} />
                                                        )}
                                                    </FormControl>
                                                    {attribute.description && (
                                                        <FormDescription>{attribute.description}</FormDescription>
                                                    )}
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : initialData ? "Save changes" : "Create product"}
                </Button>
            </form>
        </Form>
    );
}