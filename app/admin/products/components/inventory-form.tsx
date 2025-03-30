"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";

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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { productInventorySchema } from "@/lib/types/product.types";
import type { ProductInventoryFormValues } from "@/lib/types/product.types";
import { addInventory, updateInventory } from "@/lib/actions/inventory.actions";
import { UploadButton } from "@/lib/uploadthing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InventoryFormProps {
    productId: string;
    inventory?: ProductInventoryFormValues;
}

export function InventoryForm({ productId, inventory }: InventoryFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const isEditing = !!inventory;
    const [originalRetailPrice, setOriginalRetailPrice] = useState<number | null>(null);

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
        defaultValues,
    });

    const watchHasDiscount = form.watch("hasDiscount");
    const watchCompareAtPrice = form.watch("compareAtPrice");
    const watchRetailPrice = form.watch("retailPrice");
    const watchDiscountPercentage = form.watch("discountPercentage");

    // Handle discount toggle
    const handleDiscountToggle = (checked: boolean) => {
        if (checked) {
            // When enabling discount, store original retail price as compare price
            setOriginalRetailPrice(watchRetailPrice);
            form.setValue("compareAtPrice", watchRetailPrice);
            // Calculate discounted price
            const discountedPrice = watchRetailPrice * 0.8; // 20% discount
            form.setValue("retailPrice", discountedPrice);
            form.setValue("discountPercentage", 20);
        } else {
            // When disabling discount, restore original retail price
            if (originalRetailPrice !== null) {
                form.setValue("retailPrice", originalRetailPrice);
            }
            form.setValue("compareAtPrice", null);
            form.setValue("discountPercentage", null);
        }
        form.setValue("hasDiscount", checked);
    };

    // Wrap update functions in useCallback
    const updateRetailPrice = useCallback(() => {
        if (watchHasDiscount && watchCompareAtPrice && watchDiscountPercentage !== null) {
            const comparePrice = Number(watchCompareAtPrice);
            const discountPercentage = Number(watchDiscountPercentage);
            const newRetailPrice = comparePrice * (1 - discountPercentage / 100);
            form.setValue("retailPrice", newRetailPrice);
        }
    }, [watchHasDiscount, watchCompareAtPrice, watchDiscountPercentage, form]);

    const updateDiscountPercentage = useCallback(() => {
        if (watchHasDiscount && watchCompareAtPrice && watchRetailPrice) {
            const comparePrice = Number(watchCompareAtPrice);
            const retailPrice = Number(watchRetailPrice);

            if (comparePrice > retailPrice) {
                const discountPercentage = Math.round(((comparePrice - retailPrice) / comparePrice) * 100);
                form.setValue("discountPercentage", discountPercentage);
            } else {
                form.setValue("discountPercentage", 0);
            }
        }
    }, [watchHasDiscount, watchCompareAtPrice, watchRetailPrice, form]);

    // Watch for changes in discount percentage
    useEffect(() => {
        if (watchHasDiscount && watchDiscountPercentage !== null) {
            updateRetailPrice();
        }
    }, [watchDiscountPercentage, watchHasDiscount, watchCompareAtPrice, updateRetailPrice]);

    // Watch for changes in compare price
    useEffect(() => {
        if (watchHasDiscount && watchCompareAtPrice) {
            updateDiscountPercentage();
        }
    }, [watchCompareAtPrice, watchHasDiscount, watchRetailPrice, updateDiscountPercentage]);

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

            // Save data using the appropriate action
            const result = isEditing
                ? await updateInventory(data)
                : await addInventory(data);

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
                <CardTitle>{isEditing ? "Edit Inventory" : "Add Inventory"}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Tabs defaultValue="details" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="details">Basic Details</TabsTrigger>
                                <TabsTrigger value="pricing">Pricing & Discount</TabsTrigger>
                                <TabsTrigger value="attributes">Attributes</TabsTrigger>
                            </TabsList>

                            <TabsContent value="details" className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. P123456" disabled={loading} />
                                            </FormControl>
                                            <FormDescription>
                                                Leave blank to auto-generate
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
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                    min={0}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="lowStock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Low Stock Threshold</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                    min={0}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Get alerts when inventory falls below this number
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="isDefault"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Default Variant</FormLabel>
                                                <FormDescription>
                                                    Set this as the default inventory variant for this product
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={loading || (isEditing && inventory?.isDefault)}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>

                            <TabsContent value="pricing" className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="costPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cost Price</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                    min={0}
                                                    step={0.01}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Your wholesale cost (not shown to customers)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="retailPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Retail Price</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value));
                                                        if (!watchHasDiscount) {
                                                            setOriginalRetailPrice(e.target.value === '' ? 0 : parseFloat(e.target.value));
                                                        }
                                                    }}
                                                    min={0}
                                                    step={0.01}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Current selling price
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="hasDiscount"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Discount</FormLabel>
                                                <FormDescription>
                                                    Enable to show a discount on this product
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={handleDiscountToggle}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {watchHasDiscount && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                                        <FormField
                                            control={form.control}
                                            name="compareAtPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Compare-at Price</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            value={field.value || ''}
                                                            onChange={(e) => {
                                                                field.onChange(e.target.value ? parseFloat(e.target.value) : null);
                                                                updateDiscountPercentage();
                                                            }}
                                                            min={0}
                                                            step={0.01}
                                                            disabled={loading}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Original price before discount
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="discountPercentage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Discount Percentage</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            value={field.value ?? ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value ? parseInt(e.target.value) : 0;
                                                                field.onChange(value);
                                                                if (watchHasDiscount && watchCompareAtPrice) {
                                                                    const comparePrice = Number(watchCompareAtPrice);
                                                                    const newRetailPrice = comparePrice * (1 - value / 100);
                                                                    form.setValue("retailPrice", newRetailPrice);
                                                                }
                                                            }}
                                                            min={0}
                                                            max={100}
                                                            disabled={loading}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Auto-calculated from prices, or set manually
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="attributes" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="attributes.size"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Size</FormLabel>
                                                <FormControl>
                                                    <Input {...field} disabled={loading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="attributes.material"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Material</FormLabel>
                                                <FormControl>
                                                    <Input {...field} disabled={loading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="attributes.clarity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Clarity</FormLabel>
                                                <FormControl>
                                                    <Input {...field} disabled={loading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="attributes.caratWeight"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Carat Weight</FormLabel>
                                                <FormControl>
                                                    <Input {...field} disabled={loading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <FormLabel>Product Images</FormLabel>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {form.watch("images")?.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <Image
                                                    src={image}
                                                    alt={`Product image ${index + 1}`}
                                                    width={200}
                                                    height={200}
                                                    className="rounded-lg object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                        const currentImages = form.getValues("images") || [];
                                                        form.setValue("images", currentImages.filter((_, i) => i !== index));
                                                    }}
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-4">
                                            <UploadButton
                                                endpoint="categoryImage"
                                                onClientUploadComplete={(res) => {
                                                    if (res?.[0]) {
                                                        const currentImages = form.getValues("images") || [];
                                                        form.setValue("images", [...currentImages, res[0].url]);
                                                        toast.success("Image uploaded successfully");
                                                    }
                                                }}
                                                onUploadError={(error: Error) => {
                                                    toast.error(`Error uploading image: ${error.message}`);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex items-center justify-end gap-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/admin/products/${productId}`)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : isEditing ? "Update Inventory" : "Add Inventory"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
} 