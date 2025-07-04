"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ClientProduct } from "@/lib/types/product.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, triggerCartUpdate } from "@/lib/utils";
import { ShoppingCart, Loader, Minus, Plus } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getAttributeNamesByIds } from "@/lib/actions/product.actions";
import AddToCartButton from "@/components/products/AddToCartButton";
import { toast } from "sonner";
import { updateCartItem, getCart, removeFromCart } from "@/lib/actions/cart.actions";
import Rating from "../rating";

// Categories that should display attributes as read-only information
// rather than as selectable options
const READ_ONLY_ATTRIBUTE_CATEGORIES = [
    "cm8g42vgu000020us7xb7s28q1",
    "cm8wftyg4000r20yg3d4ph4v01",
    "cm8g42vkg000420us58yc4vhc1"
];

interface ProductInfoProps {
    product: ClientProduct;
}

interface AttributeSelectorProps {
    attributeId: string;
    attributeName: string;
    values: string[];
    selectedValue: string;
    onValueChange: (value: string) => void;
    product: ClientProduct;
}

// Helper function to get attribute options with images from product type
async function fetchAttributeOptions(productTypeId: string): Promise<Array<{ id: string; options: any }>> {
    if (!productTypeId) return [];

    try {
        const response = await fetch(`/api/product-types/${productTypeId}/attributes`);
        if (!response.ok) throw new Error('Failed to fetch attributes');

        const result = await response.json();
        return result.success ? result.data : [];
    } catch (error) {
        console.error('Error fetching attribute options:', error);
        return [];
    }
}

function parseAttributeOptions(attributeOptions: string | null): Array<{ value: string; label: string; imageUrl?: string; extraCost?: number }> {
    if (!attributeOptions) return [];

    try {
        const parsedOptions = JSON.parse(attributeOptions);
        if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
            if (typeof parsedOptions[0] === 'object' && parsedOptions[0].label) {
                // New structure with images and pricing
                return parsedOptions;
            } else {
                // Old structure: simple strings
                return parsedOptions.map((value: string) => ({ value, label: value }));
            }
        }
    } catch (e) {
        console.error("Failed to parse attribute options:", e);
    }

    return [];
}

function AttributeSelector({ attributeId, attributeName, values, selectedValue, onValueChange, product }: AttributeSelectorProps) {
    // For now, use fallback to radio buttons until we implement full API integration
    // TODO: Implement proper API integration to fetch attribute options with images
    const attributeOptions: Array<{ value: string; label: string; imageUrl?: string; extraCost?: number }> = [];
    const hasImages = false; // Will be true when API integration is complete

    // If we have image-enabled options, show them with images
    if (hasImages) {
        return (
            <div className="space-y-3">
                <Label className="text-sm font-medium">{attributeName}:</Label>
                <div className="flex flex-wrap gap-3">
                    {values.map((value) => {
                        const option = attributeOptions.find(opt => opt.value === value || opt.label === value);
                        const isSelected = selectedValue === value;

                        return (
                            <div
                                key={value}
                                className={`
                                    relative cursor-pointer rounded-lg border-2 p-2 transition-all
                                    ${isSelected
                                        ? 'border-primary bg-primary/5 shadow-md'
                                        : 'border-muted hover:border-primary/50'
                                    }
                                `}
                                onClick={() => onValueChange(value)}
                            >
                                {option?.imageUrl && (
                                    <div className="relative w-16 h-16 mb-2 rounded-md overflow-hidden">
                                        <Image
                                            src={option.imageUrl}
                                            alt={option.label || value}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="text-center">
                                    <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                                        {option?.label || value}
                                    </span>
                                </div>
                                {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Fallback to radio buttons for text-only attributes
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">{attributeName}:</Label>
            <RadioGroup
                value={selectedValue}
                onValueChange={onValueChange}
                className="flex flex-wrap gap-2"
            >
                {values.map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                        <RadioGroupItem
                            value={value}
                            id={`${attributeId}-${value}`}
                        />
                        <Label
                            htmlFor={`${attributeId}-${value}`}
                            className={`text-sm cursor-pointer ${selectedValue === value ? "font-bold" : ""}`}
                        >
                            {value}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    );
}

export function ProductInfo({ product }: ProductInfoProps) {
    const [selectedInventory, setSelectedInventory] = useState(product.inventories[0]);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [selectedProductAttributes, setSelectedProductAttributes] = useState<Record<string, string>>({});
    const [attributeNames, setAttributeNames] = useState<Record<string, string>>({});
    const [inCart, setInCart] = useState(false);
    const [cartItemId, setCartItemId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);

    // Check if this product's category should display attributes as read-only
    const isReadOnlyAttributes = READ_ONLY_ATTRIBUTE_CATEGORIES.includes(product.categoryId);
    console.log('Inventory', selectedInventory);
    // Initialize product attributes on mount
    useEffect(() => {
        if (product.productAttributes) {
            const initialProductSelections: Record<string, string> = {};
            product.productAttributes.forEach(attr => {
                initialProductSelections[attr.attribute.id] = attr.value;
            });
            setSelectedProductAttributes(initialProductSelections);
        }
    }, [product.productAttributes]);

    // Auto-select first attribute values on mount
    useEffect(() => {
        // Group inventories by their attributes
        const attrGroups = product.inventories.reduce((acc, inventory) => {
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

        // For each attribute, select the first value
        const initialSelections: Record<string, string> = {};
        Object.entries(attrGroups).forEach(([attrId, values]) => {
            if (values.size > 0) {
                // Get the first value from the Set
                const firstValue = Array.from(values)[0];
                initialSelections[attrId] = firstValue;
            }
        });

        // Set initial selections
        setSelectedAttributes(initialSelections);

        // Find inventory that matches these selections
        const matchingInventory = findMatchingInventory(initialSelections);
        if (matchingInventory) {
            setSelectedInventory(matchingInventory);
        }
    }, [product.inventories]);

    // Helper function to find matching inventory based on attributes
    const findMatchingInventory = (attrs: Record<string, string>) => {
        return product.inventories.find(inv => {
            if (!inv.attributes) return false;
            return Object.entries(attrs).every(([key, val]) => {
                const attrValue = inv.attributes?.[key];
                return Array.isArray(attrValue)
                    ? attrValue.includes(val)
                    : attrValue === val;
            });
        });
    };

    // Check if the product is already in the cart
    useEffect(() => {
        const checkCart = async () => {
            try {
                console.log('Checking cart for product:', product.id, 'inventory:', selectedInventory.id);
                const cart = await getCart();
                if (cart && cart.items) {
                    console.log('Cart items:', cart.items);
                    // Find if any of the product's inventories are in the cart
                    const cartItem = cart.items.find(item => {
                        // Check if the product ID matches and the inventoryId matches
                        const isMatch = item.productId === product.id &&
                            item.inventoryId === selectedInventory.id;

                        // console.log('Comparing:', {
                        //     itemProductId: item.productId,
                        //     productId: product.id,
                        //     itemInventoryId: item.inventoryId,
                        //     selectedInventoryId: selectedInventory.id,
                        //     isMatch
                        // });

                        return isMatch;
                    });

                    if (cartItem) {
                        console.log('Found cart item:', cartItem);
                        setInCart(true);
                        setCartItemId(cartItem.id);
                        setQuantity(cartItem.quantity);
                    } else {
                        console.log('No matching cart item found');
                        setInCart(false);
                        setCartItemId(null);
                        setQuantity(1);
                    }
                } else {
                    console.log('No cart or cart items found');
                    setInCart(false);
                    setCartItemId(null);
                    setQuantity(1);
                }
            } catch (error) {
                console.error('Error checking cart:', error);
                setInCart(false);
                setCartItemId(null);
                setQuantity(1);
            }
        };

        checkCart();
    }, [product.id, selectedInventory.id]);

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

    // Group inventories by their attributes (keep this for rendering)
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
        const matchingInventory = findMatchingInventory(newAttributes);

        if (matchingInventory) {
            setSelectedInventory(matchingInventory);
            // Reset cart state when inventory changes
            setInCart(false);
            setCartItemId(null);
            setQuantity(1);

            // Check if the new inventory is already in the cart
            const checkNewInventory = async () => {
                try {
                    const cart = await getCart();
                    if (cart && cart.items) {
                        const cartItem = cart.items.find(item =>
                            item.productId === product.id &&
                            item.inventoryId === matchingInventory.id
                        );

                        if (cartItem) {
                            setInCart(true);
                            setCartItemId(cartItem.id);
                            setQuantity(cartItem.quantity);
                        }
                    }
                } catch (error) {
                    console.error('Error checking cart for new inventory:', error);
                }
            };

            checkNewInventory();
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

    // Handle quantity updates
    const handleQuantityChange = async (newQuantity: number) => {
        if (newQuantity < 0 || newQuantity > selectedInventory.quantity) return;

        setIsUpdatingQuantity(true);
        try {
            if (!cartItemId) {
                console.error('No cart item ID found');
                toast.error("Failed to update cart: Item not found");
                return;
            }

            if (newQuantity === 0) {
                // If quantity is 0, remove the item from the cart
                const result = await removeFromCart({ cartItemId });
                if (result.success) {
                    setInCart(false);
                    setCartItemId(null);
                    setQuantity(1);
                    triggerCartUpdate();
                    toast.success("Item removed from cart");
                } else {
                    toast.error(result.message || "Failed to remove item from cart");
                }
                return;
            }

            const result = await updateCartItem({
                cartItemId,
                quantity: newQuantity
            });

            if (result.success) {
                setQuantity(newQuantity);
                triggerCartUpdate();
                toast.success(result.message || "Cart updated successfully");
            } else {
                //console.error('Failed to update cart:', result.message);
                toast.error('We are sorry but there are ' + result.message + '.' + ' Feel free to contact us if more clarity is needed' || "Failed to update cart");
            }
        } catch (error) {
            console.error('Error updating cart:', error);
            toast.error("Failed to update cart");
        } finally {
            setIsUpdatingQuantity(false);
        }
    };

    // Handle increment
    const handleIncrement = () => {
        if (quantity < selectedInventory.quantity) {
            handleQuantityChange(quantity + 1);
        }
    };

    // Handle decrement
    const handleDecrement = async () => {
        if (quantity > 1) {
            handleQuantityChange(quantity - 1);
        } else if (quantity === 1 && cartItemId) {
            // If quantity is 1, remove the item from the cart
            setIsUpdatingQuantity(true);
            try {
                const result = await removeFromCart({ cartItemId });
                if (result.success) {
                    setInCart(false);
                    setCartItemId(null);
                    setQuantity(1);
                    triggerCartUpdate();
                    toast.success("Item removed from cart");
                } else {
                    toast.error(result.message || "Failed to remove item from cart");
                }
            } catch (error) {
                console.error('Error removing item from cart:', error);
                toast.error("Failed to remove item from cart");
            } finally {
                setIsUpdatingQuantity(false);
            }
        }
    };

    // Handle successful add to cart
    const handleAddToCartSuccess = (result: any) => {
        if (!result.success || !result.item) {
            console.error('Invalid cart result:', result);
            toast.error("Failed to add item to cart");
            return;
        }

        if (!result.item.id) {
            console.error('No cart item ID in result:', result);
            toast.error("Failed to add item to cart: Invalid response");
            return;
        }

        setInCart(true);
        setCartItemId(result.item.id);
        setQuantity(result.item.quantity);
        triggerCartUpdate();
        //toast.success(result.message || "Added to cart successfully");
    };

    // In the component, log the initial inventory data
    useEffect(() => {
        console.log('ProductInfo - Initial inventory:', {
            inventories: product.inventories.map(inv => ({
                id: inv.id,
                sku: inv.sku,
                attributes: inv.attributes
            }))
        });
        console.log('ProductInfo - Selected inventory:', {
            id: selectedInventory.id,
            sku: selectedInventory.sku,
            attributes: selectedInventory.attributes
        });
    }, [product.inventories, selectedInventory]);

    // Log the data that will be used for the add to cart button
    useEffect(() => {
        if (selectedInventory) {
            console.log('ProductInfo - Data for AddToCartButton:', {
                productId: product.id,
                inventoryId: selectedInventory.id,
                inventorySku: selectedInventory.sku,
                attributes: selectedAttributes
            });
        }
    }, []); // Empty dependency array to run only once on mount

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
            <Rating value={product.rating ?? 0} />
            <span className="text-sm text-muted-foreground font-semibold">Reviews: ({product.numReviews})</span>

            {/* Product-Level Attributes - Hidden to prevent duplication with inventory attributes */}
            {/* Note: Dual-purpose attributes are handled in the inventory section below */}

            {/* Inventory-Level Attribute Display or Selection */}
            {!isReadOnlyAttributes ? (
                // Display attributes as selectable options
                Object.entries(attributeGroups).map(([attributeId, values]) => (
                    <AttributeSelector
                        key={attributeId}
                        attributeId={attributeId}
                        attributeName={attributeNames[attributeId] || attributeId}
                        values={Array.from(values)}
                        selectedValue={selectedAttributes[attributeId] || ""}
                        onValueChange={(value) => handleAttributeChange(attributeId, value)}
                        product={product}
                    />
                ))
            ) : (
                // Display attributes as read-only information
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">Specifications:</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(getSelectedInventoryAttributeValues()).map(([key, value]) => (
                            <div key={key} className="text-sm">
                                <span className="font-medium">{attributeNames[key] || key}:</span>{' '}
                                <span>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
                {(() => {
                    const availableStock = selectedInventory.quantity - (selectedInventory.reservedStock || 0);
                    return (
                        <Badge variant={availableStock > 0 ? "secondary" : "destructive"}>
                            {availableStock > 0 ? `In Stock (${availableStock} available)` : "Out of Stock"}
                        </Badge>
                    );
                })()}
            </div>

            {/* Add to Cart Button */}
            <div className="flex flex-col gap-4">
                {!inCart ? (
                    <AddToCartButton
                        productId={product.id}
                        inventoryId={selectedInventory.id}
                        quantity={1}
                        disabled={selectedInventory.quantity - (selectedInventory.reservedStock || 0) === 0}
                        onSuccess={handleAddToCartSuccess}
                        selectedAttributes={selectedAttributes}
                    />
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleDecrement}
                                disabled={isUpdatingQuantity}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{quantity}</span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleIncrement}
                                disabled={isUpdatingQuantity || selectedInventory.quantity - (selectedInventory.reservedStock || 0) === 0}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {isUpdatingQuantity && (
                            <Loader className="h-4 w-4 animate-spin" />
                        )}
                    </div>
                )}
            </div>

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
            {/* Go to Cart Button. Show only when item added to cart */}
            {inCart && (
                <Button variant="outline" asChild className="bg-orange-300 text-black hover:bg-orange-400 hover:text-white">
                    <Link href="/cart">Go to Cart</Link>
                </Button>
            )}
        </div>
    );
} 