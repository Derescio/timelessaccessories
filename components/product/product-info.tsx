"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ClientProduct } from "@/lib/types/product.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getAttributeNamesByIds } from "@/lib/actions/product.actions";

// Categories that should display attributes as read-only information
// rather than as selectable options
const READ_ONLY_ATTRIBUTE_CATEGORIES = [
    "cm8g42vgu000020us7xb7s28q",
    "cm8wftyg4000r20yg3d4ph4v0",
    "cm8g42vkg000420us58yc4vhc"
];

interface ProductInfoProps {
    product: ClientProduct;
}

export function ProductInfo({ product }: ProductInfoProps) {
    const [selectedInventory, setSelectedInventory] = useState(product.inventories[0]);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [attributeNames, setAttributeNames] = useState<Record<string, string>>({});

    // Check if this product's category should display attributes as read-only
    const isReadOnlyAttributes = READ_ONLY_ATTRIBUTE_CATEGORIES.includes(product.categoryId);

    useEffect(() => {
        const fetchAttributeNames = async () => {
            // Get all attribute IDs from the first inventory
            const attributeIds = Object.keys(product.inventories[0]?.attributes || {});
            if (attributeIds.length > 0) {
                const names = await getAttributeNamesByIds(attributeIds);
                setAttributeNames(names);
            }
        };

        fetchAttributeNames();
    }, [product.inventories]);

    // Group inventories by their attributes
    const attributeGroups = product.inventories.reduce((acc, inventory) => {
        if (!inventory.attributes) return acc;

        Object.entries(inventory.attributes).forEach(([key, value]) => {
            if (!acc[key]) {
                acc[key] = new Set();
            }
            // Handle both string and array values
            if (Array.isArray(value)) {
                value.forEach(v => acc[key].add(v));
            } else {
                acc[key].add(value as string);
            }
        });
        return acc;
    }, {} as Record<string, Set<string>>);

    // Handle attribute selection
    const handleAttributeChange = (attribute: string, value: string) => {
        const newAttributes = { ...selectedAttributes, [attribute]: value };
        setSelectedAttributes(newAttributes);

        // Find matching inventory
        const matchingInventory = product.inventories.find(inv => {
            if (!inv.attributes) return false;
            return Object.entries(newAttributes).every(([key, val]) => {
                const attrValue = inv.attributes?.[key];
                return Array.isArray(attrValue)
                    ? attrValue.includes(val)
                    : attrValue === val;
            });
        });

        if (matchingInventory) {
            setSelectedInventory(matchingInventory);
        }
    };

    // Get the attribute values for the selected inventory
    const getSelectedInventoryAttributeValues = () => {
        if (!selectedInventory.attributes) return {};

        return Object.entries(selectedInventory.attributes).reduce((acc, [key, value]) => {
            acc[key] = Array.isArray(value) ? value.join(', ') : value;
            return acc;
        }, {} as Record<string, string>);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <p className="text-muted-foreground mt-2">{product.description}</p>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                    {formatPrice(selectedInventory.retailPrice)}
                </span>
                {selectedInventory.compareAtPrice && (
                    <span className="text-muted-foreground line-through">
                        {formatPrice(selectedInventory.compareAtPrice)}
                    </span>
                )}
                {selectedInventory.hasDiscount && (
                    <Badge variant="destructive">
                        {selectedInventory.discountPercentage}% OFF
                    </Badge>
                )}
            </div>

            {/* Attribute Display or Selection */}
            {isReadOnlyAttributes ? (
                // Display attributes as read-only information
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Product Specifications</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {Object.entries(getSelectedInventoryAttributeValues()).map(([attributeId, value]) => (
                            <div key={attributeId} className="flex border-b pb-2">
                                <span className="font-medium w-1/3">
                                    {attributeNames[attributeId] || attributeId}:
                                </span>
                                <span className="w-2/3">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Display attributes as selectable options
                Object.entries(attributeGroups).map(([attributeId, values]) => (
                    <div key={attributeId} className="space-y-2">
                        <Label className="text-sm font-medium">
                            {attributeNames[attributeId] || attributeId}
                        </Label>
                        <RadioGroup
                            value={selectedAttributes[attributeId]}
                            onValueChange={(value) => handleAttributeChange(attributeId, value)}
                            className="flex flex-wrap gap-2"
                        >
                            {Array.from(values).map((value) => (
                                <div key={value} className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value={value}
                                        id={`${attributeId}-${value}`}
                                    />
                                    <Label
                                        htmlFor={`${attributeId}-${value}`}
                                        className="text-sm cursor-pointer"
                                    >
                                        {value}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                ))
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
                {selectedInventory.quantity > 0 ? (
                    <Badge variant="secondary" className="bg-green-500 text-white">
                        In Stock ({selectedInventory.quantity} available)
                    </Badge>
                ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                )}
            </div>

            {/* Add to Cart Button */}
            <Button
                className="w-full"
                disabled={selectedInventory.quantity === 0}
                onClick={() => {
                    // TODO: Implement add to cart functionality
                }}
            >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
            </Button>

            {/* Category Link */}
            <div className="text-sm text-muted-foreground">
                Category:{" "}
                <Link
                    href={`/categories/${product.category.slug}`}
                    className="text-primary hover:underline"
                >
                    {product.category.name}
                </Link>
            </div>
        </div>
    );
} 