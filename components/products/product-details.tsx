"use client"

import { useState, useEffect, useCallback } from "react"
import { Heart, Minus, Plus, Share2, Star, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Product } from "@/types"
import AddToCartButton from "./AddToCartButton"
import { updateCartItem, removeFromCart, getCart } from "@/lib/actions/cart.actions"
import { triggerCartUpdate } from "@/lib/utils"
import { toast } from "sonner"

interface ProductDetailsProps {
    product: Product;
}

// Define a type for the cart action result
interface CartActionResult {
    success: boolean;
    message: string;
    item?: {
        id: string;
        quantity: number;
        [key: string]: unknown;
    };
}

interface CartItemDetails {
    id: string;
    productId: string;
    inventoryId?: string;
    quantity: number;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
    const [inCart, setInCart] = useState(false);
    const [cartItemId, setCartItemId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isCheckingCart, setIsCheckingCart] = useState(true);
    const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
    const maxStock = product.inventories[0]?.quantity || 1;
    const inventoryId = product.inventories[0]?.sku;

    const displayPrice = product.inventories[0]?.hasDiscount && product.inventories[0]?.discountPercentage
        ? Number(product.inventories[0].retailPrice) * (1 - product.inventories[0].discountPercentage / 100)
        : Number(product.inventories[0]?.retailPrice || 0);

    // Check if this product is already in the cart when component loads
    // Wrap in useCallback to properly handle the dependency array in useEffect
    const checkIfInCart = useCallback(async () => {
        setIsCheckingCart(true);
        try {
            const cart = await getCart();
            console.log("Checking if product is in cart:", {
                productId: product.id,
                inventoryId: inventoryId,
                cart
            });

            if (cart && cart.items && cart.items.length > 0) {
                // Find if this product is in the cart (either by product ID + inventory SKU or just product ID)
                const cartItem = cart.items.find((item: CartItemDetails) => {
                    // First, try to match by product ID and inventory ID
                    if (inventoryId && item.productId === product.id && item.inventoryId === inventoryId) {
                        console.log("Product found in cart by exact match:", item);
                        return true;
                    }

                    // If no inventory ID match, check if the item's productId matches this product
                    // This is a fallback in case the inventory SKU doesn't match but the product is the same
                    if (item.productId === product.id) {
                        console.log("Product found in cart by product ID only:", item);
                        return true;
                    }

                    return false;
                });

                if (cartItem) {
                    console.log("Product found in cart, setting UI state:", cartItem);
                    setInCart(true);
                    setCartItemId(cartItem.id);
                    setQuantity(cartItem.quantity);
                } else {
                    console.log("Product not found in cart");
                    setInCart(false);
                    setCartItemId(null);
                    setQuantity(1);
                }
            } else {
                console.log("No cart or empty cart");
                setInCart(false);
                setCartItemId(null);
                setQuantity(1);
            }
        } catch (error) {
            console.error("Error checking cart:", error);
            setInCart(false);
            setCartItemId(null);
            setQuantity(1);
        } finally {
            setIsCheckingCart(false);
        }
    }, [product.id, inventoryId]);

    useEffect(() => {
        checkIfInCart();

        // Also listen for cart updates to refresh the UI state
        const handleCartUpdate = () => {
            checkIfInCart();
        };

        window.addEventListener('cart-updated', handleCartUpdate);

        return () => {
            window.removeEventListener('cart-updated', handleCartUpdate);
        };
    }, [product.id, inventoryId, checkIfInCart]);

    const handleAddToCartSuccess = (result: CartActionResult) => {
        console.log("Add to cart success handler called with:", result);
        if (result?.success && result?.item) {
            setInCart(true);
            setCartItemId(result.item.id);
            setQuantity(result.item.quantity);

            // Trigger a cart update to refresh the cart count in the header
            triggerCartUpdate();

            // Also refresh the cart check to ensure our UI state is correct
            setTimeout(() => {
                checkIfInCart();
            }, 300); // Small delay to ensure cart is updated
        } else {
            console.error("Add to cart success handler called but result was not successful or missing item");
        }
    };

    const handleIncrement = async () => {
        if (!cartItemId || quantity >= maxStock) return;

        setIsUpdatingQuantity(true);
        try {
            console.log(`Incrementing quantity for item ${cartItemId} from ${quantity} to ${quantity + 1}`);
            const result = await updateCartItem({
                cartItemId,
                quantity: quantity + 1
            });

            console.log('Increment result:', result);

            if (result.success) {
                setQuantity(quantity + 1);
                triggerCartUpdate();
                toast.success('Quantity updated', {
                    action: {
                        label: "Go to Cart",
                        onClick: () => window.location.href = "/cart"
                    },
                    duration: 5000,
                });
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Error updating cart:', error);
            toast.error('Failed to update quantity');
        } finally {
            setIsUpdatingQuantity(false);
        }
    };

    const handleDecrement = async () => {
        if (!cartItemId) return;

        setIsUpdatingQuantity(true);
        try {
            if (quantity > 1) {
                console.log(`Decrementing quantity for item ${cartItemId} from ${quantity} to ${quantity - 1}`);
                const result = await updateCartItem({
                    cartItemId,
                    quantity: quantity - 1
                });

                console.log('Decrement result:', result);

                if (result.success) {
                    setQuantity(quantity - 1);
                    triggerCartUpdate();
                    toast.success('Quantity updated', {
                        action: {
                            label: "Go to Cart",
                            onClick: () => window.location.href = "/cart"
                        },
                        duration: 5000,
                    });
                } else {
                    toast.error(result.message);
                }
            } else {
                console.log(`Removing item ${cartItemId} from cart`);
                const result = await removeFromCart({
                    cartItemId
                });

                console.log('Remove result:', result);

                if (result.success) {
                    setInCart(false);
                    setCartItemId(null);
                    setQuantity(1);
                    triggerCartUpdate();
                    toast.success('Item removed from cart', {
                        action: {
                            label: "Go to Cart",
                            onClick: () => window.location.href = "/cart"
                        },
                        duration: 5000,
                    });
                } else {
                    toast.error(result.message);
                }
            }
        } catch (error) {
            console.error('Error updating cart:', error);
            toast.error('Failed to update quantity');
        } finally {
            setIsUpdatingQuantity(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h1 className="text-2xl md:text-3xl font-light mb-2">{product.name}</h1>
                    <div className="flex items-center gap-2">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={16}
                                    className={i < (product.reviews?.length || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-gray-500">{product.reviews?.length || 0} reviews</span>
                    </div>
                </div>
                <div className="text-xl md:text-2xl font-light">
                    {product.inventories[0]?.hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through mr-2">
                            ${Number(product.inventories[0].retailPrice).toFixed(2)}
                        </span>
                    )}
                    ${displayPrice.toFixed(2)}
                </div>
            </div>

            <p className="text-gray-600">{product.description}</p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {isCheckingCart ? (
                    <Button className="w-full sm:w-auto sm:flex-1" disabled>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Checking cart...
                    </Button>
                ) : inCart ? (
                    <div className="flex items-center w-full sm:w-auto border rounded-md">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 px-3"
                            onClick={handleDecrement}
                            disabled={isUpdatingQuantity}
                        >
                            {isUpdatingQuantity ?
                                <Loader className="h-4 w-4 animate-spin" /> :
                                <Minus className="h-4 w-4" />
                            }
                        </Button>
                        <div className="w-12 text-center">
                            <span className="text-sm font-medium">{quantity}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 px-3"
                            onClick={handleIncrement}
                            disabled={isUpdatingQuantity || quantity >= maxStock}
                        >
                            {isUpdatingQuantity ?
                                <Loader className="h-4 w-4 animate-spin" /> :
                                <Plus className="h-4 w-4" />
                            }
                        </Button>
                    </div>
                ) : (
                    <AddToCartButton
                        productId={product.id}
                        inventoryId={inventoryId || ''}
                        className="w-full sm:w-auto sm:flex-1"
                        disabled={!product.inventories[0]?.quantity}
                        onSuccess={handleAddToCartSuccess}
                    />
                )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <button className="flex items-center gap-2 text-sm hover:text-primary">
                    <Heart size={20} />
                    <span className="whitespace-nowrap">ADD TO WISHLIST</span>
                </button>
                <button className="flex items-center gap-2 text-sm hover:text-primary">
                    <Share2 size={20} />
                    <span>SHARE</span>
                </button>
            </div>

            <div className="border-t pt-6 space-y-4">
                <div>
                    <span className="text-gray-500">SKU:</span> {product.sku || 'N/A'}
                </div>
                <div>
                    <span className="text-gray-500">Category:</span> {product.category.name}
                </div>
                {product.metadata && (
                    <>
                        {product.metadata.style && (
                            <div>
                                <span className="text-gray-500">Style:</span> {product.metadata.style}
                            </div>
                        )}
                        {product.metadata.materials && (
                            <div>
                                <span className="text-gray-500">Materials:</span> {product.metadata.materials.join(", ")}
                            </div>
                        )}
                        {product.metadata.collection && (
                            <div>
                                <span className="text-gray-500">Collection:</span> {product.metadata.collection}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}