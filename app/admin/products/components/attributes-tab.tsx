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
import { Label } from "@/components/ui/label";
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

    // Helper function to handle select all attribute values
    const handleSelectAllAttributeValues = (attributeName: string, options: string[], checked: boolean) => {
        if (checked) {
            form.setValue(`attributes.${attributeName}`, options);
        } else {
            form.setValue(`attributes.${attributeName}`, []);
        }
    };

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
                // Parse options for ARRAY attributes
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
                            <FormItem className="space-y-2">
                                <FormLabel>{attribute.displayName}</FormLabel>
                                <FormControl>
                                    {attribute.type === AttributeType.ARRAY ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between mb-2 pl-2">
                                                <Label className="text-sm font-medium">Available Options</Label>
                                                <div className="flex items-center space-x-2">
                                                    <Label
                                                        htmlFor={`select-all-${attribute.id}`}
                                                        className="text-xs font-normal cursor-pointer"
                                                    >
                                                        Select All Values
                                                    </Label>
                                                    <input
                                                        id={`select-all-${attribute.id}`}
                                                        type="checkbox"
                                                        className="h-3 w-3"
                                                        onChange={(e) => handleSelectAllAttributeValues(
                                                            attribute.name,
                                                            options,
                                                            e.target.checked
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-2">
                                                {options.map((option, index) => {
                                                    // Ensure field.value is an array for checkbox group
                                                    const values = Array.isArray(field.value) ? field.value : [];
                                                    const isChecked = values.includes(option);

                                                    return (
                                                        <div
                                                            key={index}
                                                            className="flex items-center space-x-2"
                                                        >
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
                                                })}
                                            </div>
                                        </div>
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