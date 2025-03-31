"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { addInventory, updateInventory } from "@/lib/actions/inventory.actions";
import { toast } from "sonner";
import { getInventoryAttributeValues } from "@/lib/actions/product-type.actions";
import { getProductById } from "@/lib/actions/product.actions";
import { AttributesTab } from "./attributes-tab";
import { Loader2 } from "lucide-react";
import { productInventorySchema } from "@/lib/types/product.types";
import type { ProductInventoryFormValues } from "@/lib/types/product.types";

interface InventoryFormProps {
    productId: string;
    inventory?: ProductInventoryFormValues;
}

export function InventoryForm({ productId, inventory }: InventoryFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const isEditing = !!inventory;
    const [productTypeId, setProductTypeId] = useState<string | null>(null);

    // Transform the inventory data into the form values format
    const defaultValues = isEditing
        ? {
            id: inventory.id,
            productId: productId,
            sku: inventory.sku || "",
            costPrice: inventory.costPrice || 0,
            retailPrice: inventory.retailPrice || 0,
            compareAtPrice: inventory.compareAtPrice || null,
            discountPercentage: inventory.discountPercentage || null,
            hasDiscount: inventory.hasDiscount || false,
            quantity: inventory.quantity || 0,
            lowStock: inventory.lowStock || 5,
            images: inventory.images || [],
            attributes: typeof inventory.attributes === 'object' ? inventory.attributes : {},
            isDefault: inventory.isDefault || false,
        }
        : {
            productId: productId,
            sku: "",
            costPrice: 0,
            retailPrice: 0,
            compareAtPrice: null,
            discountPercentage: null,
            hasDiscount: false,
            quantity: 0,
            lowStock: 5,
            images: [],
            attributes: {},
            isDefault: false,
        };

    const form = useForm<ProductInventoryFormValues>({
        resolver: zodResolver(productInventorySchema),
        defaultValues: {
            ...defaultValues,
            // Ensure numeric values are properly initialized as numbers
            costPrice: typeof defaultValues.costPrice === 'object' ? Number(defaultValues.costPrice) : defaultValues.costPrice || 0,
            retailPrice: typeof defaultValues.retailPrice === 'object' ? Number(defaultValues.retailPrice) : defaultValues.retailPrice || 0,
            compareAtPrice: defaultValues.compareAtPrice ? (typeof defaultValues.compareAtPrice === 'object' ? Number(defaultValues.compareAtPrice) : defaultValues.compareAtPrice) : null,
            quantity: defaultValues.quantity || 0,
            lowStock: defaultValues.lowStock || 5,
            attributes: defaultValues.attributes || {},
        },
    });

    // Fetch product type ID and attributes when component loads
    useEffect(() => {
        const fetchProductTypeId = async () => {
            try {
                const productResult = await getProductById(productId);
                if (productResult.success && productResult.data && productResult.data.productTypeId) {
                    setProductTypeId(productResult.data.productTypeId);
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            }
        };

        fetchProductTypeId();
    }, [productId]);

    // Load existing attribute values if editing
    useEffect(() => {
        if (isEditing && inventory?.id && productTypeId) {
            const loadAttributeValues = async () => {
                try {
                    // Convert to string to ensure it's not a Decimal or other object
                    const inventoryId = String(inventory.id);

                    const result = await getInventoryAttributeValues(inventoryId);
                    if (result.success && result.data) {
                        // Merge existing attributes with the new ones from the API
                        const combinedAttributes = {
                            ...form.getValues("attributes"),
                            ...result.data.formatted
                        };
                        form.setValue("attributes", combinedAttributes);
                    }
                } catch (error) {
                    console.error("Error loading inventory attribute values:", error);
                }
            };

            loadAttributeValues();
        }
    }, [isEditing, inventory?.id, productTypeId, form]);

    // Auto-generate SKU if needed
    const generateSku = () => {
        const timestamp = new Date().getTime().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `P${timestamp}${random}`;
    };

    const onSubmit = async (data: ProductInventoryFormValues) => {
        try {
            setLoading(true);

            // If no SKU is provided, generate one
            if (!data.sku) {
                data.sku = generateSku();
            }

            // Ensure all numeric values are properly converted to JavaScript numbers
            const submissionData = {
                ...data,
                costPrice: Number(data.costPrice),
                retailPrice: Number(data.retailPrice),
                compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
                quantity: Number(data.quantity),
                lowStock: Number(data.lowStock),
            };

            // Save data using the appropriate action
            const result = isEditing
                ? await updateInventory(submissionData)
                : await addInventory(submissionData);

            if (result.success) {
                toast.success(isEditing ? "Inventory updated" : "Inventory created");
                router.push(`/admin/products/${productId}`);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to save inventory");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Inventory Details</CardTitle>
                <CardDescription>
                    Manage inventory details and attributes
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SKU</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter SKU" {...field} disabled={loading} />
                                        </FormControl>
                                        <FormDescription>
                                            Stock Keeping Unit - unique identifier for your product
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" step="1" {...field} disabled={loading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Separator className="my-4" />
                            <h3 className="text-lg font-medium">Attributes</h3>
                            {productTypeId && <AttributesTab productTypeId={productTypeId} isForProduct={false} />}
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
} 