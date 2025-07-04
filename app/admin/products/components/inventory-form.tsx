"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { ImageUploader } from "@/components/ui/uploadthing";
import { X } from "lucide-react";

interface InventoryFormProps {
    productId: string;
    inventory?: ProductInventoryFormValues;
}

export function InventoryForm({ productId, inventory }: InventoryFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const isEditing = !!inventory;
    const [productTypeId, setProductTypeId] = useState<string | null>(null);
    const [originalPrice, setOriginalPrice] = useState<number | null>(null);

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
            discountPercentage: defaultValues.discountPercentage || 0,
            hasDiscount: defaultValues.hasDiscount || false,
            quantity: defaultValues.quantity || 0,
            lowStock: defaultValues.lowStock || 5,
            attributes: defaultValues.attributes || {},
        },
    });

    // Store the initial retail price for discount calculations
    useEffect(() => {
        // Only set the original price once on initial load
        if (!originalPrice) {
            const retailPrice = form.getValues('retailPrice');
            if (retailPrice) {
                setOriginalPrice(retailPrice);
                // console.log("Setting initial original price:", retailPrice);
            }
        }
    }, [form, originalPrice]);

    // Watch for changes to hasDiscount and discountPercentage
    const hasDiscount = useWatch({
        control: form.control,
        name: 'hasDiscount',
    });

    const discountPercentage = useWatch({
        control: form.control,
        name: 'discountPercentage',
    });

    // Use a ref to prevent infinite loop
    const updatingPrices = React.useRef(false);

    // Effect to handle discount calculation with protection against infinite loop
    useEffect(() => {
        // Skip if we're already in the middle of an update
        if (updatingPrices.current) return;

        try {
            updatingPrices.current = true;

            // Only proceed if we have an original price
            if (!originalPrice) return;

            if (hasDiscount) {
                // When discount is enabled
                // Set compareAtPrice to the original price
                form.setValue('compareAtPrice', originalPrice, { shouldValidate: true });

                // Calculate discounted price
                if (discountPercentage) {
                    const discountedPrice = originalPrice - (originalPrice * (discountPercentage / 100));
                    form.setValue('retailPrice', Number(discountedPrice.toFixed(2)), { shouldValidate: true });
                }
            } else {
                // When discount is disabled
                // Restore original price
                form.setValue('retailPrice', originalPrice, { shouldValidate: true });

                // Clear compareAtPrice
                form.setValue('compareAtPrice', null, { shouldValidate: true });

                // Reset discount percentage
                form.setValue('discountPercentage', 0, { shouldValidate: true });
            }
        } finally {
            updatingPrices.current = false;
        }
    }, [hasDiscount, discountPercentage, form, originalPrice]);

    // Effect to handle manual changes to retailPrice when discount is off
    useEffect(() => {
        if (!hasDiscount && !updatingPrices.current) {
            // Only update the original price when the user manually changes retail price
            const currentRetailPrice = form.getValues('retailPrice');
            if (currentRetailPrice && currentRetailPrice !== originalPrice) {
                //  console.log("Updating original price from manual edit:", currentRetailPrice);
                setOriginalPrice(currentRetailPrice);
            }
        }
    }, [form.watch('retailPrice'), hasDiscount, form, originalPrice]);

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

            // Log form data to debug
            // console.log("Form data before submission:", data);
            // console.log("Images to be saved:", data.images);

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
                images: data.images || [], // Explicitly include images array
            };

            // Log the final submission data
            // console.log("Final submission data:", submissionData);

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

    // Function to handle adding a new image
    const handleAddImage = (newImageUrl?: string) => {
        if (!newImageUrl) return;

        const currentImages = form.getValues('images') || [];
        // Add the new image if it doesn't exist already
        if (!currentImages.includes(newImageUrl)) {
            form.setValue('images', [...currentImages, newImageUrl], { shouldValidate: true });
        }
    };

    // Function to handle removing an image
    const handleRemoveImage = (imageUrl: string) => {
        const currentImages = form.getValues('images') || [];
        const updatedImages = currentImages.filter(image => image !== imageUrl);
        form.setValue('images', updatedImages, { shouldValidate: true });
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
                {/* Image Upload and Management Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Product Images</h3>

                    {/* Display current images */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {form.watch('images')?.map((image, index) => (
                            <div key={index} className="relative group">
                                <div className="aspect-square rounded-md overflow-hidden border">
                                    <img
                                        src={image}
                                        alt={`Product image ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(image)}
                                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Remove image"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Image uploader */}
                    <div className="mt-4">
                        <ImageUploader
                            endpoint="productImage"
                            onChange={(imageUrl) => {
                                if (imageUrl) {
                                    handleAddImage(imageUrl);
                                    toast.success("Image uploaded successfully");
                                }
                            }}
                            onUploadError={(error) => {
                                toast.error(`Upload failed: ${error.message}`);
                            }}
                            dropzoneText="Upload product image (drag & drop or click)"
                            className="w-full"
                        />
                    </div>
                </div>

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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="retailPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Retail Price</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    onBlur={field.onBlur}
                                                    ref={field.ref}
                                                    name={field.name}
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    disabled={hasDiscount || loading}
                                                />
                                            </FormControl>
                                            {hasDiscount && (
                                                <FormDescription>
                                                    Price is calculated based on discount percentage.
                                                </FormDescription>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="costPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cost Price</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    onBlur={field.onBlur}
                                                    ref={field.ref}
                                                    name={field.name}
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="hasDiscount"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Apply Discount</FormLabel>
                                            <FormDescription>
                                                Enable to apply a discount to this product
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

                            {hasDiscount && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="discountPercentage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount Percentage</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        onBlur={field.onBlur}
                                                        ref={field.ref}
                                                        name={field.name}
                                                        value={field.value || 0}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        disabled={loading}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Enter a percentage between 0 and 100
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="compareAtPrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Original Price</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        onBlur={field.onBlur}
                                                        ref={field.ref}
                                                        name={field.name}
                                                        value={field.value || ''}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        disabled={true}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Original price before discount (automatically set)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock Quantity</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="1"
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                                name={field.name}
                                                value={field.value}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                disabled={loading}
                                            />
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