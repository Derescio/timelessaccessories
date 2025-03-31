"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { AttributeType, ProductTypeAttribute } from "@prisma/client";
import { Loader2 } from "lucide-react";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormDescription,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getProductTypeAttributes } from "@/lib/actions/product-type.actions";

interface AttributesTabProps {
    productTypeId: string;
    isForProduct: boolean;
}

export function AttributesTab({ productTypeId, isForProduct }: AttributesTabProps) {
    const form = useFormContext();
    const [productTypeAttributes, setProductTypeAttributes] = useState<ProductTypeAttribute[]>([]);
    const [loadingAttributes, setLoadingAttributes] = useState(false);

    useEffect(() => {
        const loadAttributes = async () => {
            if (!productTypeId) return;

            setLoadingAttributes(true);
            try {
                const result = await getProductTypeAttributes(productTypeId, isForProduct);
                if (result.success && result.data) {
                    setProductTypeAttributes(result.data);
                }
            } catch (error) {
                console.error("Error loading attributes:", error);
            } finally {
                setLoadingAttributes(false);
            }
        };

        loadAttributes();
    }, [productTypeId, isForProduct]);

    if (!productTypeId) {
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
                // Parse options for SELECT attributes
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
                        name={`attributes.${attribute.name}`}
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
                                        <Input type="number" {...field} />
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
} 