"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Minus, Plus, Share2, Star, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Product } from "@/types"
import AddToCartButton from "./AddToCartButton"
import AddToWishlistButton from "@/components/wishlist/add-to-wishlist-button"
import { updateCartItem, removeFromCart, getCart } from "@/lib/actions/cart.actions"
import { triggerCartUpdate } from "@/lib/utils"
import { toast } from "sonner"

interface ProductMetadata {
    style?: string;
    materials?: string[];
    dimensions?: string;
    weight?: string;
    color?: string;
    [key: string]: unknown;
}

interface ProductDetailsProps {
    product: Product & {
        metadata?: ProductMetadata | null;
    };
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
    const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
    const maxStock = product.inventories[0]?.quantity || 1;
    const inventoryId = product.inventories[0]?.sku;

    // Get the active inventory
    const activeInventory = useMemo(() => {
        if (!product || !product.inventories || product.inventories.length === 0) return null;
        return product.inventories[0]; // Always use the first inventory for now
    }, [product]);

    // Calculate display price based on discount if available
    const { displayPrice, originalPrice } = useMemo(() => {
        // Default values
        const resultValues = {
            displayPrice: product?.price || 0,
            originalPrice: null as number | null
        };

        // If product has a discount and compareAtPrice, calculate the discounted price
        if (product?.hasDiscount && product?.discountPercentage && product?.compareAtPrice) {
            resultValues.originalPrice = Number(product.compareAtPrice);

            // Log price calculation for debugging
            console.log(`ProductDetails price calculation for ${product.name}:`, {
                hasDiscount: product.hasDiscount,
                discountPercentage: product.discountPercentage,
                originalCompareAtPrice: resultValues.originalPrice,
                originalPrice: Number(product.price),
                activeInventory: activeInventory ? {
                    retailPrice: Number(activeInventory.retailPrice),
                    hasDiscount: activeInventory.hasDiscount,
                    discountPercentage: activeInventory.discountPercentage
                } : null
            });
        }

        return {
            displayPrice: Number(resultValues.displayPrice),
            originalPrice: resultValues.originalPrice
        };
    }, [product, activeInventory]);


    // function debounce(func: (...args: any[]) => void, delay: number) {
    //     let timeout: NodeJS.Timeout;
    //     return (...args: any[]) => {
    //         clearTimeout(timeout);
    //         timeout = setTimeout(() => func(...args), delay);
    //     };
    // }
    // Check if this product is already in the cart when component loads
    // Wrap in useCallback to properly handle the dependency array in useEffect
    const checkIfInCart = useCallback(async () => {
        if (!product) return;

        // Don't check cart if we're updating quantity to prevent the flashing
        if (isUpdatingQuantity) {
            return;
        }


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

        }
    }, [product, inventoryId, isUpdatingQuantity]);

    // Add the useEffect hook outside of any conditions
    useEffect(() => {
        if (!product) return;

        checkIfInCart();

        // Also listen for cart updates to refresh the UI state
        const handleCartUpdate = () => {
            // Only check cart if we're not currently updating quantity
            if (!isUpdatingQuantity) {
                checkIfInCart();
            }
        };
        // Debounced event listener for cart updates
        // const debouncedCartUpdate = debounce(() => {
        //     if (!isUpdatingQuantity) {
        //         checkIfInCart();
        //     }
        // }, 300);
        window.addEventListener('cart-updated', handleCartUpdate);

        return () => {
            window.removeEventListener('cart-updated', handleCartUpdate);
        };
    }, [checkIfInCart, isUpdatingQuantity, product]);

    if (!product) {
        return <div>Product not found</div>
    }

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
                triggerCartUpdate(); // Trigger cart update
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
            setTimeout(() => {
                setIsUpdatingQuantity(false);
            }, 500);
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
                    triggerCartUpdate(); // Trigger cart update
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
                    triggerCartUpdate(); // Trigger cart update
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
            setTimeout(() => {
                setIsUpdatingQuantity(false);
            }, 500);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h3 className="dark:text-gray-300 text-muted-foreground">{product.category.name}</h3>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{product.name}</h1>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-5 h-5 ${i < Math.round(product.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({product.reviewCount} reviews)
                        </span>
                    </div>
                </div>
                <div className="mt-4 flex items-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${displayPrice.toFixed(2)}
                    </div>
                    {originalPrice && (
                        <div className="ml-4 text-lg text-gray-500 line-through">
                            ${originalPrice.toFixed(2)}
                        </div>
                    )}
                    {product.hasDiscount && product.discountPercentage && (
                        <div className="ml-4 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                            Save {product.discountPercentage}%
                        </div>
                    )}
                </div>
            </div>

            <p className="text-gray-600">{product.description}</p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

                {inCart ? (
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
                <AddToWishlistButton
                    productId={product.id}
                    variant="button"
                    withText
                />
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
                {product.metadata && typeof product.metadata === 'object' && (
                    <>
                        {('style' in product.metadata) && product.metadata.style && (
                            <div>
                                <span className="text-gray-500">Style:</span> {product.metadata.style}
                            </div>
                        )}
                        {('materials' in product.metadata) && product.metadata.materials && Array.isArray(product.metadata.materials) && (
                            <div>
                                <span className="text-gray-500">Materials:</span> {product.metadata.materials.join(", ")}
                            </div>
                        )}
                        {('dimensions' in product.metadata) && product.metadata.dimensions && (
                            <div>
                                <span className="text-gray-500">Dimensions:</span> {product.metadata.dimensions}
                            </div>
                        )}
                        {('weight' in product.metadata) && product.metadata.weight && (
                            <div>
                                <span className="text-gray-500">Weight:</span> {product.metadata.weight}
                            </div>
                        )}
                        {('color' in product.metadata) && product.metadata.color && (
                            <div>
                                <span className="text-gray-500">Color:</span> {product.metadata.color}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}