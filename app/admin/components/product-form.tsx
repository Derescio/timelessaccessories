"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Plus, Trash, Upload } from "lucide-react";
import Image from "next/image";

// Form validation schema
const productSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    description: z.string().min(10, { message: "Description must be at least 10 characters." }),
    slug: z.string().min(2, { message: "Slug must be at least 2 characters." }),
    categoryId: z.string().min(1, { message: "Category is required." }),
    isActive: z.boolean().default(true),
    sku: z.string().min(2, { message: "SKU must be at least 2 characters." }),
    costPrice: z.string().refine((val) => !isNaN(Number(val)), {
        message: "Cost price must be a number.",
    }),
    retailPrice: z.string().refine((val) => !isNaN(Number(val)), {
        message: "Retail price must be a number.",
    }),
    compareAtPrice: z.string().optional(),
    quantity: z.string().refine((val) => !isNaN(Number(val)), {
        message: "Quantity must be a number.",
    }),
    lowStock: z.string().refine((val) => !isNaN(Number(val)), {
        message: "Low stock must be a number.",
    }),
    hasDiscount: z.boolean().default(false),
    discountPercentage: z.string().optional(),
});

// Define type based on the schema
type ProductFormValues = z.infer<typeof productSchema>;

// Product interface
interface ProductData extends ProductFormValues {
    id: string;
    images: string[];
    createdAt: string;
    updatedAt: string;
}

export function ProductForm({
    product,
    categories
}: {
    product?: ProductData;
    categories: { id: string; name: string }[];
}) {
    const [activeTab, setActiveTab] = useState("details");
    const [images, setImages] = useState<string[]>(product?.images || []);
    // const [formData, setFormData] = useState<FormData>({
    //     name: "",
    //     description: "",
    //     price: 0,
    //     inventory: 0,
    //     categoryId: "",
    //     images: []
    // });

    // Generate slug from name
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^\w ]+/g, "")
            .replace(/ +/g, "-");
    };

    // Initialize form with default values or existing product
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: product || {
            name: "",
            description: "",
            slug: "",
            categoryId: "",
            isActive: true,
            sku: "",
            costPrice: "",
            retailPrice: "",
            compareAtPrice: "",
            quantity: "0",
            lowStock: "5",
            hasDiscount: false,
            discountPercentage: "",
        },
    });

    function onSubmit(data: ProductFormValues) {
        // Here you would call your API to create/update the product
        console.log(data);
        console.log("Images:", images);
        alert("Product saved successfully!");
    }

    // Mock function to handle image upload
    const handleImageUpload = () => {
        // In a real app, this would trigger a file upload dialog
        const newImage = `/placeholder-${Math.floor(Math.random() * 100)}.jpg`;
        setImages([...images, newImage]);
    };

    // Handle removing an image
    const handleRemoveImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="details">Basic Details</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="attributes">Attributes</TabsTrigger>
                </TabsList>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
                        <TabsContent value="details" className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter product name"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    if (!product) {
                                                        form.setValue("slug", generateSlug(e.target.value));
                                                    }
                                                }}
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
                                                placeholder="Enter product description"
                                                className="min-h-32"
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
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Slug</FormLabel>
                                            <FormControl>
                                                <Input placeholder="product-slug" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Used in the URL: /products/[slug]
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
                                                onValueChange={field.onChange}
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
                            </div>

                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Active</FormLabel>
                                            <FormDescription>
                                                Make this product visible in the store
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
                        </TabsContent>

                        <TabsContent value="pricing" className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU</FormLabel>
                                            <FormControl>
                                                <Input placeholder="PROD001" {...field} />
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
                                            <FormLabel>Cost Price ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormDescription>Your purchase price</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="retailPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Retail Price ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormDescription>Sale price to customers</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="hasDiscount"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Has Discount</FormLabel>
                                            <FormDescription>
                                                Apply a discount to this product
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
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="discountPercentage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount Percentage (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" max="100" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="compareAtPrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Compare At Price ($)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Original price before discount
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" {...field} />
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
                                                <Input type="number" min="0" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Show low stock warning when below this level
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="media" className="space-y-4">
                            <div className="flex flex-col space-y-4">
                                <Label>Product Images</Label>
                                <div className="grid grid-cols-4 gap-4">
                                    {images.map((image, index) => (
                                        <Card key={index} className="overflow-hidden">
                                            <CardContent className="p-0 relative">
                                                <div className="relative w-full h-40">
                                                    <Image
                                                        src={image}
                                                        alt={`Product ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 768px) 100vw, 25vw"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 rounded-full h-6 w-6"
                                                    onClick={() => handleRemoveImage(index)}
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    <Card
                                        className="cursor-pointer border-dashed flex items-center justify-center h-40"
                                        onClick={handleImageUpload}
                                    >
                                        <CardContent className="p-0 flex flex-col items-center justify-center h-full w-full">
                                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                            <span className="text-sm text-black dark:text-white">
                                                Upload Image
                                            </span>
                                        </CardContent>
                                    </Card>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    <Info className="h-4 w-4 inline-block mr-1" />
                                    You can upload up to 10 images. First image will be the main product image.
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="attributes" className="space-y-4">
                            <div className="flex flex-col space-y-4">
                                <Label>Product Attributes</Label>
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-medium">Additional Attributes</h3>
                                        <Button type="button" size="sm" variant="outline">
                                            <Plus className="h-4 w-4 mr-1" /> Add Attribute
                                        </Button>
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        No attributes added yet. Click the button above to add attributes like color, size, material, etc.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>

                        <div className="flex justify-end space-x-4 pt-4">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                            <Button type="submit">Save Product</Button>
                        </div>
                    </form>
                </Form>
            </Tabs>
        </div>
    );
} 