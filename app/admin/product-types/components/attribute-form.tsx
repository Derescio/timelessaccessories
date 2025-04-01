"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
import { ProductTypeAttribute } from "@prisma/client";
import { toast } from "sonner";

const attributeTypes = [
    { label: "Text", value: "TEXT" },
    { label: "Number", value: "NUMBER" },
    { label: "Boolean", value: "BOOLEAN" },
    { label: "Select", value: "SELECT" },
    { label: "Multi-select", value: "MULTI_SELECT" },
    { label: "Date", value: "DATE" },
    { label: "Color", value: "COLOR" },
    { label: "Dimension", value: "DIMENSION" },
    { label: "Weight", value: "WEIGHT" },
];

const attributeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    displayName: z.string().min(1, "Display name is required"),
    description: z.string().optional().nullable(),
    type: z.string().min(1, "Type is required"),
    isRequired: z.boolean().default(false),
    options: z.string().optional().nullable(),
    isForProduct: z.boolean(),
});

// Export the type for use in other components
export type AttributeFormValues = z.infer<typeof attributeSchema>;

interface AttributeFormProps {
    initialData?: Partial<ProductTypeAttribute>;
    productTypeId?: string;
    onSubmit: (data: AttributeFormValues) => Promise<{ success: boolean; data?: any; error?: string }>;
}

export function AttributeForm({ initialData, productTypeId, onSubmit }: AttributeFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Determine if this is for product or inventory based on the URL
    const isFromProductTab = initialData?.isForProduct !== false;

    const form = useForm<AttributeFormValues>({
        resolver: zodResolver(attributeSchema),
        defaultValues: {
            name: initialData?.name || "",
            displayName: initialData?.displayName || "",
            description: initialData?.description || "",
            type: initialData?.type?.toString() || "TEXT",
            isRequired: initialData?.isRequired || false,
            options: initialData?.options?.toString() || "",
            isForProduct: initialData?.isForProduct !== undefined ? initialData.isForProduct : isFromProductTab,
        },
    });

    const watchType = form.watch("type");
    const watchIsForProduct = form.watch("isForProduct");
    const showOptions = watchType === "SELECT" || watchType === "MULTI_SELECT";

    const handleSubmit = async (data: AttributeFormValues) => {
        if (isLoading) return;
        
        try {
            setIsLoading(true);
            const result = await onSubmit(data);
            
            if (result.success) {
                toast.success("Attribute created successfully!");
                
                // If we have a productTypeId, redirect to the attributes list page
                if (productTypeId) {
                    router.push(`/admin/product-types/${productTypeId}/attributes`);
                } else {
                    form.reset(); // Reset the form if no redirection
                }
            } else {
                toast.error(result.error || "Failed to create attribute");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error(
                error instanceof Error 
                    ? error.message 
                    : "An unexpected error occurred"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const getLevelExplanation = () => {
        if (watchIsForProduct) {
            return (
                <div className="pt-2 text-sm text-muted-foreground">
                    <p><strong>Examples for products:</strong> Brand, Material, Style, etc.</p>
                    <p>Applied to all variations of a product.</p>
                </div>
            );
        } else {
            return (
                <div className="pt-2 text-sm text-muted-foreground">
                    <p><strong>Examples for inventory:</strong> Size, Color, etc.</p>
                    <p>Applied to specific variations of a product.</p>
                </div>
            );
        }
    };

    const getTypeDescription = (type: string) => {
        switch (type) {
            case "TEXT":
                return "Free text input";
            case "NUMBER":
                return "Numeric values only";
            case "BOOLEAN":
                return "Yes/No values";
            case "SELECT":
                return "Single selection from options";
            case "MULTI_SELECT":
                return "Multiple selections from options";
            case "DATE":
                return "Date picker";
            case "COLOR":
                return "Color selection";
            case "DIMENSION":
                return "Product dimensions (length, width, height)";
            case "WEIGHT":
                return "Product weight";
            default:
                return "";
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <Card className="mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle>Attribute Level</CardTitle>
                        <CardDescription>
                            Choose whether this attribute applies to the entire product or to specific inventory variants
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="isForProduct"
                            render={({ field }) => (
                                <FormItem className="flex flex-col space-y-3">
                                    <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                                        <div>
                                            <FormLabel className="text-base">Attribute Level</FormLabel>
                                            <p className="text-sm text-muted-foreground">
                                                {field.value ? "Product-level attribute" : "Inventory-level attribute"}
                                            </p>
                                        </div>
                                        <FormControl>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-sm ${!field.value ? "font-medium" : "text-muted-foreground"}`}>Inventory</span>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                                <span className={`text-sm ${field.value ? "font-medium" : "text-muted-foreground"}`}>Product</span>
                                            </div>
                                        </FormControl>
                                    </div>
                                    {getLevelExplanation()}
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Attribute Name (Internal)</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={watchIsForProduct ? "e.g. material" : "e.g. size"}
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Code name used internally, lowercase with no spaces
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={watchIsForProduct ? "e.g. Material" : "e.g. Size"}
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Shown to customers on the website
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe this attribute"
                                    {...field}
                                    value={field.value ?? ""}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Attribute Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "TEXT"}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {attributeTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    {getTypeDescription(field.value)}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isRequired"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Required Attribute</FormLabel>
                                    <FormDescription>
                                        Make this a required field when creating products
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

                {showOptions && (
                    <FormField
                        control={form.control}
                        name="options"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Options</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder={
                                            watchIsForProduct
                                                ? "Enter options, one per line:\nCotton\nPolyester\nWool"
                                                : field.value === "COLOR"
                                                    ? "Enter color options, one per line:\nRed\nBlue\nGreen\nBlack\nWhite"
                                                    : "Enter size options, one per line:\nS\nM\nL\nXL\n\nOr for shoe sizes:\n36\n37\n38\n39\n40\n41\n42"
                                        }
                                        rows={8}
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <div className="flex flex-col gap-1 mt-2 p-3 bg-muted/50 rounded-md">
                                    <div className="flex items-center gap-1">
                                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-sm font-medium">Options Guidelines:</p>
                                    </div>
                                    <ul className="text-sm text-muted-foreground pl-5 list-disc space-y-1">
                                        <li>Enter each option on a new line</li>
                                        <li>Keep option text short and easy to understand</li>
                                        {!watchIsForProduct && field.value === "SELECT" && (
                                            <>
                                                <li><strong>For clothing sizes:</strong> Use standard sizing like S, M, L, XL</li>
                                                <li><strong>For shoe sizes:</strong> Use numeric sizes like 36, 37, 38, etc.</li>
                                                <li><strong>For kids&apos; clothing:</strong> Consider age ranges like 2-3Y, 4-5Y</li>
                                            </>
                                        )}
                                        {!watchIsForProduct && field.value === "COLOR" && (
                                            <li>Use standard color names that customers will recognize</li>
                                        )}
                                    </ul>
                                    {!watchIsForProduct && (
                                        <div className="mt-2 p-2 bg-yellow-100 rounded-md text-sm">
                                            <strong>Important:</strong> Inventory-level attributes like Size and Color must be created as &quot;SELECT&quot; type to allow customers to choose options.
                                        </div>
                                    )}
                                </div>
                                <FormDescription className="mt-2">
                                    Enter each option on a new line or separated by commas.
                                    Example: S, M, L, XL or Red, Blue, Green
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : initialData?.id ? "Update Attribute" : "Create Attribute"}
                </Button>
            </form>
        </Form>
    );
}