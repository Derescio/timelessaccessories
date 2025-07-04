"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Plus, DollarSign, Upload, Image as ImageIcon } from "lucide-react";
import { createProductTypeAttribute, updateProductTypeAttribute } from "@/lib/actions/product-type.actions";
import { AttributeType } from "@prisma/client";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ui/uploadthing";
import Image from "next/image";

const attributeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    displayName: z.string().min(1, "Display name is required"),
    description: z.string().optional(),
    type: z.nativeEnum(AttributeType),
    isRequired: z.boolean().default(false),
    isForProduct: z.boolean().default(false),
    isForInventory: z.boolean().default(false),
    options: z.array(z.object({
        value: z.string().min(1, "Option value is required"),
        label: z.string().min(1, "Option label is required"),
        extraCost: z.number().min(0, "Extra cost must be 0 or positive").default(0),
        imageUrl: z.string().optional()
    })).optional()
}).refine(data => data.isForProduct || data.isForInventory, {
    message: "Attribute must be used for Product, Inventory, or both",
    path: ["isForProduct"]
});

export type AttributeFormValues = z.infer<typeof attributeSchema>;

interface AttributeFormProps {
    productTypeId: string;
    attribute?: {
        id: string;
        name: string;
        displayName: string;
        description: string | null;
        type: AttributeType;
        isRequired: boolean;
        isForProduct: boolean;
        isForInventory?: boolean;
        options: any;
    };
}

export function AttributeForm({ productTypeId, attribute }: AttributeFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const form = useForm<AttributeFormValues>({
        resolver: zodResolver(attributeSchema),
        defaultValues: {
            name: attribute?.name || "",
            displayName: attribute?.displayName || "",
            description: attribute?.description || "",
            type: attribute?.type || AttributeType.STRING,
            isRequired: attribute?.isRequired || false,
            isForProduct: attribute?.isForProduct || false,
            isForInventory: attribute?.isForInventory || (attribute ? !attribute.isForProduct : false), // Migrate old data
            options: attribute?.options ? JSON.parse(attribute.options as string).map((opt: any) => ({
                value: opt.value,
                label: opt.label,
                extraCost: opt.extraCost || 0,
                imageUrl: opt.imageUrl || ""
            })) : []
        }
    });

    const watchedType = form.watch("type");
    const watchedOptions = form.watch("options");

    useEffect(() => {
        const shouldShowOptions = watchedType === AttributeType.SELECT;
        setShowOptions(shouldShowOptions);

        if (!shouldShowOptions) {
            form.setValue("options", []);
        }
    }, [watchedType, form]);

    const addOption = () => {
        const currentOptions = form.getValues("options") || [];
        form.setValue("options", [...currentOptions, { value: "", label: "", extraCost: 0, imageUrl: "" }]);
    };

    const removeOption = (index: number) => {
        const currentOptions = form.getValues("options") || [];
        form.setValue("options", currentOptions.filter((_, i) => i !== index));
    };

    const updateOptionImage = (index: number, imageUrl: string) => {
        const currentOptions = form.getValues("options") || [];
        const newOptions = [...currentOptions];
        newOptions[index] = { ...newOptions[index], imageUrl };
        form.setValue("options", newOptions);
    };

    const calculateTotalCost = (extraCost: number) => {
        // This would ideally come from the product type's base price
        const basePrice = 100; // Placeholder
        return basePrice + extraCost;
    };

    const onSubmit = async (data: AttributeFormValues) => {
        setIsSubmitting(true);

        try {
            const formattedData = {
                productTypeId,
                name: data.name,
                displayName: data.displayName,
                description: data.description || undefined,
                type: data.type,
                isRequired: data.isRequired,
                isForProduct: data.isForProduct,
                isForInventory: data.isForInventory,
                options: data.options && data.options.length > 0 ? JSON.stringify(data.options) : null
            };

            let result;
            if (attribute) {
                result = await updateProductTypeAttribute({
                    id: attribute.id,
                    ...formattedData
                });
            } else {
                result = await createProductTypeAttribute(formattedData);
            }

            if (result.success) {
                toast.success(attribute ? "Attribute updated successfully" : "Attribute created successfully");
                router.push(`/admin/product-types/${productTypeId}/attributes`);
                router.refresh();
            } else {
                toast.error(result.error || "An error occurred");
            }
        } catch (error) {
            console.error("Error saving attribute:", error);
            toast.error("An error occurred while saving the attribute");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{attribute ? "Edit Attribute" : "Create New Attribute"}</CardTitle>
                    <CardDescription>
                        Define an attribute that can be used for products, inventory items, or both.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Internal Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., material"
                                        {...form.register("name")}
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input
                                        id="displayName"
                                        placeholder="e.g., Material"
                                        {...form.register("displayName")}
                                    />
                                    {form.formState.errors.displayName && (
                                        <p className="text-sm text-red-500">{form.formState.errors.displayName.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe what this attribute represents..."
                                    {...form.register("description")}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Usage Configuration */}
                        <div className="space-y-4">
                            <div>
                                <Label className="text-base font-medium">Attribute Usage</Label>
                                <p className="text-sm text-muted-foreground">
                                    Choose where this attribute will be used
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isForProduct"
                                        checked={form.watch("isForProduct")}
                                        onCheckedChange={(checked) => form.setValue("isForProduct", !!checked)}
                                    />
                                    <Label htmlFor="isForProduct" className="text-sm">
                                        Use for Product-level attributes
                                    </Label>
                                </div>
                                <p className="text-xs text-muted-foreground ml-6">
                                    Product-level attributes apply to the entire product (e.g., Brand, Category)
                                </p>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isForInventory"
                                        checked={form.watch("isForInventory")}
                                        onCheckedChange={(checked) => form.setValue("isForInventory", !!checked)}
                                    />
                                    <Label htmlFor="isForInventory" className="text-sm">
                                        Use for Inventory-level attributes (variants)
                                    </Label>
                                </div>
                                <p className="text-xs text-muted-foreground ml-6">
                                    Inventory-level attributes create product variants (e.g., Size, Color, Material)
                                </p>
                            </div>

                            {form.formState.errors.isForProduct && (
                                <p className="text-sm text-red-500">{form.formState.errors.isForProduct.message}</p>
                            )}
                        </div>

                        <Separator />

                        {/* Attribute Configuration */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Attribute Type</Label>
                                    <Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value as AttributeType)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select attribute type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={AttributeType.STRING}>Text</SelectItem>
                                            <SelectItem value={AttributeType.NUMBER}>Number</SelectItem>
                                            <SelectItem value={AttributeType.BOOLEAN}>Boolean</SelectItem>
                                            <SelectItem value={AttributeType.SELECT}>Select</SelectItem>
                                            <SelectItem value={AttributeType.COLOR}>Color (with color picker)</SelectItem>
                                            <SelectItem value={AttributeType.DIMENSION}>Dimension</SelectItem>
                                            <SelectItem value={AttributeType.WEIGHT}>Weight</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-2 pt-8">
                                    <Checkbox
                                        id="isRequired"
                                        checked={form.watch("isRequired")}
                                        onCheckedChange={(checked) => form.setValue("isRequired", !!checked)}
                                    />
                                    <Label htmlFor="isRequired">Required</Label>
                                </div>
                            </div>
                        </div>

                        {/* Options Section */}
                        {watchedType === AttributeType.SELECT && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-base font-medium">Predefined Options</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Create a list of options with individual pricing and optional images
                                            </p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addOption}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Option
                                        </Button>
                                    </div>

                                    {watchedOptions && watchedOptions.length > 0 && (
                                        <div className="space-y-4">
                                            {watchedOptions.map((option, index) => (
                                                <Card key={index} className="p-4">
                                                    <div className="space-y-4">
                                                        {/* Text fields row */}
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label>Value</Label>
                                                                    <Input
                                                                        placeholder="e.g., gold"
                                                                        value={option.value}
                                                                        onChange={(e) => {
                                                                            const newOptions = [...(watchedOptions || [])];
                                                                            newOptions[index] = { ...option, value: e.target.value };
                                                                            form.setValue("options", newOptions);
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Label</Label>
                                                                    <Input
                                                                        placeholder="e.g., Gold"
                                                                        value={option.label}
                                                                        onChange={(e) => {
                                                                            const newOptions = [...(watchedOptions || [])];
                                                                            newOptions[index] = { ...option, label: e.target.value };
                                                                            form.setValue("options", newOptions);
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Extra Cost</Label>
                                                                    <div className="relative">
                                                                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                        <Input
                                                                            type="number"
                                                                            step="0.01"
                                                                            min="0"
                                                                            placeholder="0.00"
                                                                            className="pl-9"
                                                                            value={option.extraCost}
                                                                            onChange={(e) => {
                                                                                const newOptions = [...(watchedOptions || [])];
                                                                                newOptions[index] = { ...option, extraCost: parseFloat(e.target.value) || 0 };
                                                                                form.setValue("options", newOptions);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    {option.extraCost > 0 && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            Total: ${calculateTotalCost(option.extraCost)}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeOption(index)}
                                                                className="text-red-500 hover:text-red-600"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>

                                                        {/* Image upload section */}
                                                        <div className="border-t pt-4">
                                                            <div className="flex items-start gap-4">
                                                                <div className="flex-1">
                                                                    <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                                                                        <ImageIcon className="h-4 w-4" />
                                                                        Option Image (Optional)
                                                                    </Label>
                                                                    {option.imageUrl ? (
                                                                        <div className="space-y-2">
                                                                            <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                                                                                <Image
                                                                                    src={option.imageUrl}
                                                                                    alt={option.label || "Option image"}
                                                                                    fill
                                                                                    className="object-cover"
                                                                                />
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => updateOptionImage(index, "")}
                                                                                >
                                                                                    Remove Image
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <ImageUploader
                                                                            endpoint="productImage"
                                                                            onChange={(imageUrl?: string) => {
                                                                                console.log("ImageUploader onChange called with URL:", imageUrl);
                                                                                if (imageUrl) {
                                                                                    updateOptionImage(index, imageUrl);
                                                                                    toast.success("Image uploaded successfully!");
                                                                                }
                                                                            }}
                                                                            onUploadError={(error: Error) => {
                                                                                console.error("ImageUploader error:", error);
                                                                                toast.error(`Upload failed: ${error.message}`);
                                                                            }}
                                                                            dropzoneText="Upload option image (drag & drop or click)"
                                                                            className="w-full"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}

                                    {(!watchedOptions || watchedOptions.length === 0) && (
                                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">No options defined yet</p>
                                            <p className="text-sm text-muted-foreground">
                                                Add options to create predefined choices with individual pricing and images
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/admin/product-types/${productTypeId}/attributes`)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : (attribute ? "Update Attribute" : "Create Attribute")}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}