"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
    const [inCart, setInCart] = useState(false);
    const [cartItemId, setCartItemId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);

    // Check if this product's category should display attributes as read-only
    const isReadOnlyAttributes = READ_ONLY_ATTRIBUTE_CATEGORIES.includes(product.categoryId);

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

                        console.log('Comparing:', {
                            itemProductId: item.productId,
                            productId: product.id,
                            itemInventoryId: item.inventoryId,
                            selectedInventoryId: selectedInventory.id,
                            isMatch
                        });

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
                console.error('Failed to update cart:', result.message);
                toast.error(result.message || "Failed to update cart");
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
        toast.success(result.message || "Added to cart successfully");
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
                <Badge variant={selectedInventory.quantity > 0 ? "secondary" : "destructive"}>
                    {selectedInventory.quantity > 0 ? `In Stock (${selectedInventory.quantity} available)` : "Out of Stock"}
                </Badge>
            </div>

            {/* Add to Cart Button */}
            <div className="flex flex-col gap-4">
                {!inCart ? (
                    <AddToCartButton
                        productId={product.id}
                        inventoryId={selectedInventory.sku}
                        disabled={selectedInventory.quantity === 0}
                        onSuccess={handleAddToCartSuccess}
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
                                disabled={isUpdatingQuantity || quantity >= selectedInventory.quantity}
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
        </div>
    );
} 