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

// Update the product schema to handle dynamic fields better
const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    slug: z.string().min(1, "Slug is required"),
    categoryId: z.string().min(1, "Category is required"),
    productTypeId: z.string().optional(),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
    price: z.number().min(0, "Price cannot be negative"),
    sku: z.string().min(1, "SKU is required"),
    costPrice: z.number().min(0, "Cost price cannot be negative"),
    compareAtPrice: z.number().optional(),
    hasDiscount: z.boolean().default(false),
    discountPercentage: z.number().optional(),
    attributeValues: z.record(z.any()).default({}),
    stock: z.number().int().min(0, "Stock cannot be negative").default(0),
    imageUrl: z.string().optional().nullable(), // Keep for backward compatibility
    images: z.array(z.string()).optional(), // Add support for multiple images
});

// Define a more flexible type that includes dynamic fields
type ProductFormValues = z.infer<typeof productSchema> & {
    [key: string]: any; // This allows any other fields like include.attributeId
};

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
            compareAtPrice: initialData?.compareAtPrice || undefined,
            discountPercentage: initialData?.discountPercentage || 0,
            hasDiscount: initialData?.hasDiscount !== undefined ? initialData.hasDiscount : false,
            categoryId: initialData?.categoryId || "",
            productTypeId: initialData?.productTypeId || "",
            sku: initialData?.sku || "",
            stock: initialData?.stock || 0,
            isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
            isFeatured: initialData?.isFeatured !== undefined ? initialData.isFeatured : false,
            imageUrl: initialData?.imageUrl || null,
            images: initialData?.images || [], // Initialize images array
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
            form.setValue("compareAtPrice", undefined);
        }
    }, [form]);

    // Replace the fetchAttributes function with this
    const fetchAttributes = useCallback(async (productTypeId: string) => {
        console.log("fetchAttributes called with productTypeId:", productTypeId);
        if (!productTypeId) {
            console.log("No productTypeId provided, skipping attribute fetch");
            setProductTypeAttributes([]);
            return;
        }

        setLoadingAttributes(true);
        try {
            // Use the API endpoints directly
            const productUrl = `/api/product-types/${productTypeId}/attributes?for=product`;
            const inventoryUrl = `/api/product-types/${productTypeId}/attributes?for=inventory`;

            console.log("Fetching product attributes from:", productUrl);
            console.log("Fetching inventory attributes from:", inventoryUrl);

            const productResponse = await fetch(productUrl);
            const inventoryResponse = await fetch(inventoryUrl);

            const productResult = await productResponse.json();
            const inventoryResult = await inventoryResponse.json();

            console.log("Product attributes API response:", productResult);
            console.log("Inventory attributes API response:", inventoryResult);

            if (productResult.success && inventoryResult.success) {
                const combined = [
                    ...(productResult.data || []),
                    ...(inventoryResult.data || [])
                ];
                console.log("Combined attributes:", combined);
                setProductTypeAttributes(combined);
            } else {
                console.error("API error:", {
                    productError: productResult.error,
                    inventoryError: inventoryResult.error
                });
                setProductTypeAttributes([]);
            }
        } catch (error) {
            console.error("Failed to fetch product type attributes:", error);
            setProductTypeAttributes([]);
        } finally {
            setLoadingAttributes(false);
        }
    }, []);

    // Improve the effect that watches for product type changes
    useEffect(() => {
        const productTypeId = form.watch("productTypeId");
        console.log("Product type changed to:", productTypeId);

        if (productTypeId) {
            console.log("Triggering attribute fetch for productTypeId:", productTypeId);
            fetchAttributes(productTypeId);
        } else {
            console.log("No product type selected, clearing attributes");
            setProductTypeAttributes([]);
        }
    }, [fetchAttributes, form, form.watch("productTypeId")]);

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
            console.log("Form values before processing:", values);
            console.log("Attribute values before processing:", values.attributeValues);

            // Process attribute values to exclude those not selected for inclusion
            const rawAttributeValues = values.attributeValues || {};
            const processedAttributeValues: Record<string, any> = {};

            // For storing product attribute values (normalized approach)
            const productAttributeValues: Record<string, any> = {};

            // For storing inventory attribute values (JSON approach)
            const inventoryAttributeValues: Record<string, any> = {};

            // Debug the inclusion flags
            const inclusionFlags = Object.entries(values)
                .filter(([key]) => key.startsWith('include.'))
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, any>);

            console.log("Inclusion flags:", inclusionFlags);

            // Get all the product type attributes to identify which are for product vs inventory
            const productAttrs = productTypeAttributes.filter(attr => attr.isForProduct);
            const inventoryAttrs = productTypeAttributes.filter(attr => !attr.isForProduct);

            // Map attribute IDs to their configuration
            const attrMap = productTypeAttributes.reduce((acc, attr) => {
                acc[attr.id] = attr;
                return acc;
            }, {} as Record<string, ProductTypeAttribute>);

            // Filter attribute values based on inclusion flags and separate by type
            Object.entries(rawAttributeValues).forEach(([key, value]) => {
                // Skip inclusion flags
                if (key.includes('include.')) return;

                // Get the attribute ID from the key
                const attributeId = key.replace('attributeValues.', '');

                // Check if this attribute should be included
                const includeKey = `include.${attributeId}`;
                const isIncluded = values[includeKey] !== false;

                console.log(`Attribute ${attributeId}: include=${isIncluded}, value=${value}`,
                    Array.isArray(value) ? `(${value.length} options selected)` : '');

                // Only include if the attribute is selected for inclusion
                if (isIncluded) {
                    const attribute = attrMap[attributeId];
                    if (attribute) {
                        if (attribute.isForProduct) {
                            // Product attributes go to ProductAttributeValue table
                            productAttributeValues[attributeId] = value;
                        } else {
                            // Inventory attributes go to the JSON field
                            inventoryAttributeValues[attributeId] = value;
                        }
                    }

                    // Keep this for backward compatibility
                    processedAttributeValues[attributeId] = value;
                }
            });

            console.log("Product attribute values:", productAttributeValues);
            console.log("Inventory attribute values (JSON):", inventoryAttributeValues);

            // Convert form values to ExtendedProductFormValues with JSON inventory attributes
            const extendedValues = {
                ...values,
                productTypeId: values.productTypeId || undefined,
                isFeatured: values.isFeatured || false,
                // Original approach (for backward compatibility)
                attributeValues: processedAttributeValues,
                // New approach with separated values
                productAttributeValues: productAttributeValues,
                inventoryAttributeValues: inventoryAttributeValues
            };

            console.log('Submitting product with JSON inventory attributes:', inventoryAttributeValues);
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
                                    <Input
                                        {...field}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        onBlur={field.onBlur}
                                        ref={field.ref}
                                        name={field.name}
                                        value={field.value}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
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
                                    <Input
                                        {...field}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        onBlur={field.onBlur}
                                        ref={field.ref}
                                        name={field.name}
                                        value={field.value}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    name={field.name}
                                    value={field.value}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
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
        // Function to handle adding a new image
        const handleAddImage = (newImageUrl?: string) => {
            if (!newImageUrl) return;

            // Also set single imageUrl for backward compatibility
            form.setValue("imageUrl", newImageUrl, { shouldValidate: true });

            // Add to images array
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

            // Update the single imageUrl if needed
            if (form.getValues('imageUrl') === imageUrl) {
                form.setValue('imageUrl', updatedImages[0] || null, { shouldValidate: true });
            }
        };

        return (
            <div className="space-y-4 py-2 pb-4">
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="imageUrl" className="text-base text-foreground">
                            Product Images
                        </Label>
                    </div>

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
                                    <span className="h-4 w-4 flex items-center justify-center">×</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    <ImageUploader
                        endpoint="productImage"
                        onChange={handleAddImage}
                        onClientUploadComplete={(res) => {
                            console.log("Upload completed:", res);
                            const file = res[0] as { url?: string, ufsUrl?: string };
                            const imageUrl = file.ufsUrl || file.url;

                            if (imageUrl) {
                                handleAddImage(imageUrl);
                                sonnerToast.success("Image uploaded successfully");
                            }
                        }}
                        onUploadError={(error) => {
                            console.error("Upload error:", error);
                            sonnerToast.error(`Upload error: ${error.message}`);
                        }}
                        dropzoneText="Upload product image (drag & drop or click)"
                        className="w-full"
                    />

                    <FormMessage />
                </div>
            </div>
        );
    };

    // Attributes tab
    const AttributesTab = () => {
        const selectedProductTypeId = form.watch("productTypeId");
        console.log("AttributesTab - Selected productTypeId:", selectedProductTypeId);
        console.log("AttributesTab - productTypeAttributes:", productTypeAttributes);
        console.log("AttributesTab - loadingAttributes:", loadingAttributes);

        // Add functions to handle select all checkboxes
        const handleSelectAllProductAttributes = (checked: boolean) => {
            const productAttrs = productTypeAttributes.filter(attr => attr.isForProduct);
            productAttrs.forEach(attr => {
                if (!attr.isRequired) {
                    form.setValue(`include.${attr.id}` as any, checked);
                }
            });
        };

        const handleSelectAllInventoryAttributes = (checked: boolean) => {
            const inventoryAttrs = productTypeAttributes.filter(attr => !attr.isForProduct);
            inventoryAttrs.forEach(attr => {
                if (!attr.isRequired) {
                    form.setValue(`include.${attr.id}` as any, checked);
                }
            });
        };

        // Helper function to handle select all attribute values
        const handleSelectAllAttributeValues = (attributeId: string, options: string[], checked: boolean) => {
            if (checked) {
                form.setValue(`attributeValues.${attributeId}`, options);
            } else {
                form.setValue(`attributeValues.${attributeId}`, []);
            }
        };

        if (!selectedProductTypeId) {
            return (
                <div className="text-center text-muted-foreground py-8">
                    Please select a product type to view attributes
                </div>
            );
        }

        if (loadingAttributes) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading attributes...</span>
                </div>
            );
        }

        if (productTypeAttributes.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-8">
                    No attributes defined for this product type
                </div>
            );
        }

        // Group attributes by type for display
        const productAttributes = productTypeAttributes.filter(attr => attr.isForProduct);
        const inventoryAttributes = productTypeAttributes.filter(attr => !attr.isForProduct);

        return (
            <div className="space-y-6 py-2 pb-4">
                {/* Product Attributes Section */}
                {productAttributes.length > 0 && (
                    <div className="space-y-4 border rounded-md p-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-medium">Product Attributes</h3>
                            {productAttributes.some(attr => !attr.isRequired) && (
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="select-all-product" className="text-sm font-normal cursor-pointer">
                                        Select All Attributes
                                    </Label>
                                    <input
                                        id="select-all-product"
                                        type="checkbox"
                                        className="h-4 w-4"
                                        onChange={(e) => handleSelectAllProductAttributes(e.target.checked)}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {productAttributes.map((attribute) => {
                                const fieldId = `attributeValues.${attribute.id}`;
                                const includeFieldId = `include.${attribute.id}`;

                                // Parse options for attributes
                                let options: string[] = [];
                                if (attribute.type === AttributeType.ARRAY && attribute.options) {
                                    try {
                                        options = JSON.parse(attribute.options as string);
                                    } catch (e) {
                                        console.error("Failed to parse options:", e);
                                    }
                                }

                                return (
                                    <div
                                        key={attribute.id}
                                        className="border rounded-md p-3 relative"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                                <FormField
                                                    control={form.control}
                                                    name={includeFieldId as any}
                                                    defaultValue={true}
                                                    render={({ field }) => (
                                                        <FormItem className="flex items-center space-x-2 m-0">
                                                            <FormLabel className="m-0 text-base font-medium flex-grow">
                                                                {attribute.displayName}
                                                                {attribute.isRequired &&
                                                                    <span className="text-red-500 ml-1">*</span>
                                                                }
                                                            </FormLabel>
                                                            <FormControl>
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4"
                                                                    checked={field.value !== false}
                                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                                    disabled={attribute.isRequired}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {form.watch(includeFieldId) !== false && (
                                            <div className="mt-2">
                                                {attribute.type === AttributeType.ARRAY && options.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between mb-2 pl-2">
                                                            <Label className="text-sm font-medium">Available Options</Label>
                                                            <div className="flex items-center space-x-2">
                                                                <Label htmlFor={`select-all-${attribute.id}`} className="text-xs font-normal cursor-pointer">
                                                                    Select All Values
                                                                </Label>
                                                                <input
                                                                    id={`select-all-${attribute.id}`}
                                                                    type="checkbox"
                                                                    className="h-3 w-3"
                                                                    onChange={(e) => handleSelectAllAttributeValues(attribute.id, options, e.target.checked)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-2">
                                                            {options.map((option, index) => (
                                                                <FormField
                                                                    key={index}
                                                                    control={form.control}
                                                                    name={fieldId}
                                                                    defaultValue={[]}
                                                                    render={({ field }) => {
                                                                        const values = Array.isArray(field.value) ? field.value : [];
                                                                        const isChecked = values.includes(option);

                                                                        return (
                                                                            <div className="flex items-center space-x-2">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    id={`${attribute.id}-option-${index}`}
                                                                                    className="h-4 w-4"
                                                                                    checked={isChecked}
                                                                                    onChange={() => {
                                                                                        const newValues = isChecked
                                                                                            ? values.filter(v => v !== option)
                                                                                            : [...values, option];
                                                                                        field.onChange(newValues);
                                                                                    }}
                                                                                />
                                                                                <Label
                                                                                    htmlFor={`${attribute.id}-option-${index}`}
                                                                                    className="text-sm cursor-pointer"
                                                                                >
                                                                                    {option}
                                                                                </Label>
                                                                            </div>
                                                                        );
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <FormField
                                                        control={form.control}
                                                        defaultValue={
                                                            attribute.type === AttributeType.BOOLEAN
                                                                ? false
                                                                : attribute.type === AttributeType.NUMBER
                                                                    ? 0
                                                                    : ""
                                                        }
                                                        name={fieldId}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    {attribute.type === AttributeType.NUMBER ? (
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                                            value={field.value}
                                                                        />
                                                                    ) : attribute.type === AttributeType.BOOLEAN ? (
                                                                        <Switch
                                                                            checked={!!field.value}
                                                                            onCheckedChange={field.onChange}
                                                                        />
                                                                    ) : (
                                                                        <Input {...field} />
                                                                    )}
                                                                </FormControl>
                                                                {attribute.description && (
                                                                    <FormDescription>
                                                                        {attribute.description}
                                                                    </FormDescription>
                                                                )}
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Inventory Attributes Section */}
                {inventoryAttributes.length > 0 && (
                    <div className="space-y-4 border rounded-md p-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-medium">Inventory Attributes</h3>
                            {inventoryAttributes.some(attr => !attr.isRequired) && (
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="select-all-inventory" className="text-sm font-normal cursor-pointer">
                                        Select All Attributes
                                    </Label>
                                    <input
                                        id="select-all-inventory"
                                        type="checkbox"
                                        className="h-4 w-4"
                                        onChange={(e) => handleSelectAllInventoryAttributes(e.target.checked)}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {inventoryAttributes.map((attribute) => {
                                const fieldId = `attributeValues.${attribute.id}`;
                                const includeFieldId = `include.${attribute.id}`;

                                // Parse options for attributes
                                let options: string[] = [];
                                if (attribute.type === AttributeType.ARRAY && attribute.options) {
                                    try {
                                        options = JSON.parse(attribute.options as string);
                                    } catch (e) {
                                        console.error("Failed to parse options:", e);
                                    }
                                }

                                return (
                                    <div
                                        key={attribute.id}
                                        className="border rounded-md p-3 relative"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                                <FormField
                                                    control={form.control}
                                                    name={includeFieldId as any}
                                                    defaultValue={true}
                                                    render={({ field }) => (
                                                        <FormItem className="flex items-center space-x-2 m-0">
                                                            <FormLabel className="m-0 text-base font-medium flex-grow">
                                                                {attribute.displayName}
                                                                {attribute.isRequired &&
                                                                    <span className="text-red-500 ml-1">*</span>
                                                                }
                                                            </FormLabel>
                                                            <FormControl>
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4"
                                                                    checked={field.value !== false}
                                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                                    disabled={attribute.isRequired}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {form.watch(includeFieldId) !== false && (
                                            <div className="mt-2">
                                                {attribute.type === AttributeType.ARRAY && options.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between mb-2 pl-2">
                                                            <Label className="text-sm font-medium">Available Options</Label>
                                                            <div className="flex items-center space-x-2">
                                                                <Label htmlFor={`select-all-${attribute.id}`} className="text-xs font-normal cursor-pointer">
                                                                    Select All Values
                                                                </Label>
                                                                <input
                                                                    id={`select-all-${attribute.id}`}
                                                                    type="checkbox"
                                                                    className="h-3 w-3"
                                                                    onChange={(e) => handleSelectAllAttributeValues(attribute.id, options, e.target.checked)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-2">
                                                            {options.map((option, index) => (
                                                                <FormField
                                                                    key={index}
                                                                    control={form.control}
                                                                    name={fieldId}
                                                                    defaultValue={[]}
                                                                    render={({ field }) => {
                                                                        const values = Array.isArray(field.value) ? field.value : [];
                                                                        const isChecked = values.includes(option);

                                                                        return (
                                                                            <div className="flex items-center space-x-2">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    id={`${attribute.id}-option-${index}`}
                                                                                    className="h-4 w-4"
                                                                                    checked={isChecked}
                                                                                    onChange={() => {
                                                                                        const newValues = isChecked
                                                                                            ? values.filter(v => v !== option)
                                                                                            : [...values, option];
                                                                                        field.onChange(newValues);
                                                                                    }}
                                                                                />
                                                                                <Label
                                                                                    htmlFor={`${attribute.id}-option-${index}`}
                                                                                    className="text-sm cursor-pointer"
                                                                                >
                                                                                    {option}
                                                                                </Label>
                                                                            </div>
                                                                        );
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <FormField
                                                        control={form.control}
                                                        defaultValue={
                                                            attribute.type === AttributeType.BOOLEAN
                                                                ? false
                                                                : attribute.type === AttributeType.NUMBER
                                                                    ? 0
                                                                    : ""
                                                        }
                                                        name={fieldId}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    {attribute.type === AttributeType.NUMBER ? (
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                                            value={field.value}
                                                                        />
                                                                    ) : attribute.type === AttributeType.BOOLEAN ? (
                                                                        <Switch
                                                                            checked={!!field.value}
                                                                            onCheckedChange={field.onChange}
                                                                        />
                                                                    ) : (
                                                                        <Input {...field} />
                                                                    )}
                                                                </FormControl>
                                                                {attribute.description && (
                                                                    <FormDescription>
                                                                        {attribute.description}
                                                                    </FormDescription>
                                                                )}
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {productTypeAttributes.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        No attributes found for this product type
                    </div>
                )}
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