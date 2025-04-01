"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
//import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { ProductType, Category } from "@prisma/client";
// import { Loader2, Image as ImageIcon, X } from "lucide-react";
import { Loader2 } from "lucide-react";
// import { UploadDropzone } from "@/lib/uploadthing";
// import Image from "next/image";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { toast as sonnerToast } from "sonner";
import { ImageUploader } from "@/components/ui/uploadthing";
import { createProductWithAttributes } from "@/lib/actions/product.actions";
import { getProductTypeAttributes } from "@/lib/actions/product-type.actions";
import { getCategoryById } from "@/lib/actions/category.actions";
import { ProductTypeAttribute, AttributeType } from "@prisma/client";

// Define form schema
const productSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    slug: z.string().min(3, "Slug must be at least 3 characters"),
    price: z.coerce.number().min(0.01, "Price must be greater than 0"),
    costPrice: z.coerce.number().min(0.01, "Cost price must be greater than 0"),
    compareAtPrice: z.coerce.number().optional().nullable(),
    discountPercentage: z.coerce.number().min(0).max(100).optional(),
    hasDiscount: z.boolean().default(false),
    categoryId: z.string().min(1, "Category is required"),
    productTypeId: z.string().min(1, "Product type is required"),
    sku: z.string().min(3, "SKU must be at least 3 characters"),
    stock: z.coerce.number().int().min(0, "Stock must be at least 0"),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    imageUrl: z.string().optional().nullable(),
    attributeValues: z.record(z.any()).optional().default({}),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface UnifiedProductFormProps {
    initialData?: Partial<ProductFormValues>;
}

export function UnifiedProductForm({ initialData }: UnifiedProductFormProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingProductTypes, setLoadingProductTypes] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [productTypeAttributes, setProductTypeAttributes] = useState<ProductTypeAttribute[]>([]);
    const [loadingAttributes, setLoadingAttributes] = useState(false);
    const router = useRouter();

    // Initialize form
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            slug: initialData?.slug || "",
            price: initialData?.price || 0,
            costPrice: initialData?.costPrice || 0,
            compareAtPrice: initialData?.compareAtPrice || null,
            discountPercentage: initialData?.discountPercentage || 0,
            hasDiscount: initialData?.hasDiscount !== undefined ? initialData.hasDiscount : false,
            categoryId: initialData?.categoryId || "",
            productTypeId: initialData?.productTypeId || "",
            sku: initialData?.sku || "",
            stock: initialData?.stock || 0,
            isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
            isFeatured: initialData?.isFeatured !== undefined ? initialData.isFeatured : false,
            imageUrl: initialData?.imageUrl || null,
            attributeValues: initialData?.attributeValues || {},
        }
    });

    // Fetch categories when component mounts
    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const response = await fetch('/api/categories');
                const result = await response.json();
                if (result.success) {
                    setCategories(result.data);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

    // Fetch product types when component mounts
    useEffect(() => {
        const fetchProductTypes = async () => {
            setLoadingProductTypes(true);
            try {
                const response = await fetch('/api/product-types');
                const result = await response.json();
                if (result.success) {
                    setProductTypes(result.data);
                }
            } catch (error) {
                console.error("Failed to fetch product types:", error);
            } finally {
                setLoadingProductTypes(false);
            }
        };

        fetchProductTypes();
    }, []);

    // Watch for category changes to set default product type
    useEffect(() => {
        const categoryId = form.watch("categoryId");
        if (categoryId) {
            const fetchCategory = async () => {
                try {
                    const response = await fetch(`/api/categories/${categoryId}`);
                    const result = await response.json();

                    if (result.success && result.data.defaultProductTypeId) {
                        if (!form.getValues("productTypeId")) {
                            form.setValue("productTypeId", result.data.defaultProductTypeId);
                            form.trigger("productTypeId");
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch category:", error);
                }
            };

            fetchCategory();
        }
    }, [form.watch("categoryId")]);

    // Add an effect to handle discount calculation
    useEffect(() => {
        const watchedValues = form.watch(["price", "hasDiscount", "discountPercentage"]);
        const [price = 0, hasDiscount = false, discountPercentage = 0] = watchedValues;

        if (hasDiscount && discountPercentage > 0) {
            form.setValue("compareAtPrice", price);
            const discountedPrice = price - (price * (discountPercentage / 100));
            console.log(`Applying ${discountPercentage}% discount to ${price}: ${discountedPrice}`);
        } else {
            form.setValue("compareAtPrice", null);
        }
    }, [form]);

    // Add this effect to fetch attributes when product type changes
    const fetchAttributes = useCallback(async (productTypeId: string) => {
        setLoadingAttributes(true);
        try {
            const [productResult, inventoryResult] = await Promise.all([
                getProductTypeAttributes(productTypeId, true),
                getProductTypeAttributes(productTypeId, false)
            ]);

            if (productResult.success && inventoryResult.success) {
                setProductTypeAttributes([
                    ...(productResult.data || []),
                    ...(inventoryResult.data || [])
                ]);
            } else {
                setProductTypeAttributes([]);
            }
        } catch (error) {
            console.error("Failed to fetch product type attributes:", error);
            setProductTypeAttributes([]);
        } finally {
            setLoadingAttributes(false);
        }
    }, []);

    useEffect(() => {
        const productTypeId = form.watch("productTypeId");
        if (productTypeId) {
            fetchAttributes(productTypeId);
        } else {
            setProductTypeAttributes([]);
        }
    }, [fetchAttributes, form]);

    // Add an effect to handle category changes
    useEffect(() => {
        const categoryId = form.watch("categoryId");
        if (categoryId) {
            const fetchCategory = async () => {
                try {
                    const result = await getCategoryById(categoryId);
                    if (result.success && result.data && result.data.defaultProductTypeId) {
                        form.setValue("productTypeId", result.data.defaultProductTypeId);
                        form.trigger("productTypeId");
                    }
                } catch (error) {
                    console.error("Failed to fetch category:", error);
                }
            };

            fetchCategory();
        }
    }, [form]);

    const formValues = form.getValues();
    useEffect(() => {
        if (formValues.name && formValues.name.length >= 3) {
            form.setValue("slug", slugify(formValues.name), { shouldValidate: true });
        }
    }, [form, formValues.name]);

    async function onSubmit(values: ProductFormValues) {
        try {
            setIsSubmitting(true);

            // Convert form values to ExtendedProductFormValues
            const extendedValues = {
                ...values,
                productTypeId: values.productTypeId || undefined,
                isFeatured: values.isFeatured || false,
                attributeValues: values.attributeValues || {}
            };

            const result = await createProductWithAttributes(extendedValues);

            if (!result.success) {
                throw new Error(result.error || "Failed to create product");
            }

            sonnerToast.success("Product created successfully!");

            // Redirect to products page
            router.push("/admin/products");
        } catch (error) {
            console.error("Error creating product:", error);
            sonnerToast.error(error instanceof Error ? error.message : "Failed to create product");
        } finally {
            setIsSubmitting(false);
        }
    }

    // Basic info tab
    const BasicInfoTab = () => {
        return (
            <div className="space-y-4 py-2 pb-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter product name" {...field} />
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
                            <FormLabel>Product Slug</FormLabel>
                            <div className="flex space-x-2">
                                <FormControl>
                                    <Input placeholder="Enter product slug" {...field} />
                                </FormControl>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const name = form.getValues("name");
                                        if (name && name.length >= 3) {
                                            form.setValue("slug", slugify(name), { shouldValidate: true });
                                            sonnerToast.success("Slug generated from name");
                                        } else {
                                            sonnerToast.error("Name must be at least 3 characters long");
                                        }
                                    }}
                                >
                                    Generate
                                </Button>
                            </div>
                            <FormDescription>
                                Used for the product URL. Click &quot;Generate&quot; to create from name.
                            </FormDescription>
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
                                    placeholder="Enter product description"
                                    className="resize-y min-h-[120px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={loadingCategories}
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
                        name="productTypeId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product Type</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={loadingProductTypes}
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
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        );
    };

    // Pricing tab
    const PricingTab = () => {
        return (
            <div className="space-y-4 py-2 pb-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Price</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" min="0" {...field} />
                                </FormControl>
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
                                    <Input type="number" step="0.01" min="0" {...field} />
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
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {form.watch("hasDiscount") && (
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
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Enter a percentage between 0 and 100
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
        );
    };

    // Inventory tab
    const InventoryTab = () => {
        return (
            <div className="space-y-4 py-2 pb-4">
                <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>SKU</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter product SKU" {...field} />
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
                    name="stock"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                                <Input type="number" min="0" step="1" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        );
    };

    // Image tab
    const ImageTab = () => {
        return (
            <div className="space-y-4 py-2 pb-4">
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="imageUrl" className="text-base text-foreground">
                            Product Image
                        </Label>
                    </div>

                    <ImageUploader
                        endpoint="productImage"
                        value={form.getValues("imageUrl") || undefined}
                        onChange={(url) => {
                            console.log("Image URL changed:", url);
                            form.setValue("imageUrl", url || null, { shouldValidate: true });
                        }}
                        onClientUploadComplete={(res) => {
                            console.log("Upload completed:", res);
                            const file = res[0] as { ufsUrl: string };
                            if (file?.ufsUrl) {
                                const imageUrl = file.ufsUrl;
                                console.log("Setting image URL:", imageUrl);
                                form.setValue("imageUrl", imageUrl, { shouldValidate: true });
                                sonnerToast.success("Image uploaded successfully");
                            }
                        }}
                        onUploadError={(error) => {
                            console.error("Upload error:", error);
                            sonnerToast.error(`Upload error: ${error.message}`);
                        }}
                    />

                    <FormMessage />
                </div>
            </div>
        );
    };

    // Attributes tab
    const AttributesTab = () => {
        if (!form.watch("productTypeId")) {
            return (
                <div className="text-center text-muted-foreground">
                    Please select a product type to view attributes
                </div>
            );
        }

        if (loadingAttributes) {
            return (
                <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            );
        }

        return (
            <div className="space-y-4 py-2 pb-4">
                {productTypeAttributes.map((attribute) => {
                    // Parse options if this is a SELECT type attribute
                    const options = attribute.type === AttributeType.ARRAY && attribute.options
                        ? JSON.parse(attribute.options as string)
                        : [];

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
                                                    {options.map((option: string, index: number) => (
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
        );
    };

    // Display tab
    const DisplayTab = () => {
        return (
            <div className="space-y-4 py-2 pb-4">
                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Product Active</FormLabel>
                                <FormDescription>
                                    When disabled, this product will not be visible to customers
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
                            <div className="space-y-0.5">
                                <FormLabel>Featured Product</FormLabel>
                                <FormDescription>
                                    Featured products are displayed prominently on the store
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
            </div>
        );
    };

    // Form component
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex w-full space-x-4">
                    <div className="w-full space-y-6">
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-6">
                                <TabsTrigger value="basic">Basic Details</TabsTrigger>
                                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                                <TabsTrigger value="image">Images</TabsTrigger>
                                <TabsTrigger value="attributes">Attributes</TabsTrigger>
                                <TabsTrigger value="display">Display</TabsTrigger>
                            </TabsList>
                            <TabsContent value="basic" className="space-y-4">
                                <BasicInfoTab />
                            </TabsContent>
                            <TabsContent value="pricing" className="space-y-4">
                                <PricingTab />
                            </TabsContent>
                            <TabsContent value="inventory" className="space-y-4">
                                <InventoryTab />
                            </TabsContent>
                            <TabsContent value="image" className="space-y-4">
                                <ImageTab />
                            </TabsContent>
                            <TabsContent value="attributes" className="space-y-4">
                                <AttributesTab />
                            </TabsContent>
                            <TabsContent value="display" className="space-y-4">
                                <DisplayTab />
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Product"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
} 