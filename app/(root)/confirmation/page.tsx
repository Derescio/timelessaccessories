"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ProgressSteps from "@/components/cart/cart-progress-steps";
import { Card } from "@/components/ui/card";
import { getCart, updateCartItem, removeFromCart } from "@/lib/actions/cart.actions";
import { createOrder } from "@/lib/actions/order.actions";
import { toast } from "sonner";
import { CreditCard, MapPin, Package, Truck, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { z } from "zod";
import { shippingAddressSchema, paymentMethodSchema } from "@/lib/validators";
import Image from "next/image";
import { triggerCartUpdate } from "@/lib/utils";

// Define interfaces for type safety
interface CartItem {
    id: string;
    price: number;
    quantity: number;
    name: string;
    image?: string;
}

interface Cart {
    id: string;
    items: CartItem[];
}

// Define the type for the checkout data
interface CheckoutData {
    shippingAddress: z.infer<typeof shippingAddressSchema> & {
        state?: string;
    };
    paymentMethod: z.infer<typeof paymentMethodSchema>;
    useCourier: boolean;
}

// Get market from environment variable
const MARKET = process.env.NEXT_PUBLIC_MARKET || 'GLOBAL';
const IS_LASCO_MARKET = MARKET === 'LASCO';

export default function ConfirmationPage() {
    const router = useRouter();

    // State for cart data
    const [cart, setCart] = useState<Cart | null>(null);
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

    // Load cart and checkout data
    useEffect(() => {
        async function loadData() {
            setIsLoading(true);

            try {
                // Load cart data
                const cartResult = await getCart();
                if (cartResult) {
                    setCart(cartResult);
                }

                // Load checkout data from localStorage
                const savedCheckoutData = localStorage.getItem('checkoutData');
                if (savedCheckoutData) {
                    const parsedData = JSON.parse(savedCheckoutData);
                    setCheckoutData(parsedData);

                    // If LASCO market and using courier, redirect back to shipping
                    // since payment should be handled directly on shipping page
                    if (IS_LASCO_MARKET && parsedData.useCourier) {
                        toast.info("Please complete your payment on the shipping page");
                        router.push("/shipping");
                        return;
                    }
                } else {
                    // If no checkout data, redirect back to shipping
                    toast.error("Missing shipping information");
                    router.push("/shipping");
                }
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Failed to load order information");
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [router]);

    // Calculate order summary
    const subtotal = cart?.items?.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0) || 0;
    const estimatedTax = subtotal * 0.07; // 7% tax rate
    const shippingCost = checkoutData?.shippingAddress?.courier
        ? (checkoutData?.shippingAddress?.shippingPrice || 0)
        : 0;
    const total = subtotal + estimatedTax + (shippingCost / 100);

    // Recalculate summary values when cart changes
    useEffect(() => {
        if (cart && checkoutData) {
            // Update the orderData with the new cart total
            const newSubtotal = cart.items.reduce((total: number, item: CartItem) =>
                total + (item.price * item.quantity), 0);
            const newTax = newSubtotal * 0.07;
            const newTotal = newSubtotal + newTax + (shippingCost / 100);

            // No need to update state as we're calculating these values inline
            console.log("Updated order summary:", {
                subtotal: newSubtotal,
                tax: newTax,
                total: newTotal
            });
        }
    }, [cart, checkoutData, shippingCost]);

    // Handle place order
    const handlePlaceOrder = async () => {
        setIsSubmitting(true);

        try {
            if (!cart || !checkoutData) {
                throw new Error("Missing cart or checkout data");
            }

            // Get current cart values
            const currentSubtotal = cart.items.reduce((total: number, item: CartItem) =>
                total + (item.price * item.quantity), 0);
            const currentTax = currentSubtotal * 0.07;
            const currentTotal = currentSubtotal + currentTax + (shippingCost / 100);

            // Extract and standardize postal code from shipping address data
            const shippingAddressData = checkoutData.shippingAddress;
            const postalCode = shippingAddressData.zipCode ||
                // Access possible postalCode property safely
                (shippingAddressData as unknown as { postalCode?: string }).postalCode ||
                "";

            // Log the full raw shipping address object for debugging
            console.log("Raw shipping address object:", checkoutData.shippingAddress);

            // Log the shipping address for debugging
            console.log("Creating order with shipping address:", {
                fullName: checkoutData.shippingAddress.fullName,
                address: checkoutData.shippingAddress.streetAddress,
                city: checkoutData.shippingAddress.city,
                state: checkoutData.shippingAddress.state,
                postalCode, // Use standardized postal code
                country: checkoutData.shippingAddress.country || checkoutData.shippingAddress.parish,
            });

            // Create order in database
            const orderData = {
                cartId: cart.id,
                shippingAddress: {
                    fullName: checkoutData.shippingAddress.fullName,
                    email: "", // Will be populated from session
                    phone: "", // Optional
                    address: checkoutData.shippingAddress.streetAddress,
                    city: checkoutData.shippingAddress.city,
                    state: checkoutData.shippingAddress.state || "",
                    zipCode: postalCode, // Use standardized postal code
                    country: checkoutData.shippingAddress.country || checkoutData.shippingAddress.parish || "",
                },
                shipping: {
                    method: checkoutData.shippingAddress.courier
                        ? `Courier - ${checkoutData.shippingAddress.courier}`
                        : "Standard Shipping",
                    cost: checkoutData.shippingAddress.shippingPrice || 0,
                },
                payment: {
                    method: checkoutData.paymentMethod.type,
                    status: "PENDING",
                    providerId: "", // Will be filled after payment
                },
                subtotal: currentSubtotal,
                tax: currentTax,
                total: currentTotal,
                status: "PENDING",
            };

            // Log the final order data being sent
            console.log("Sending order data with postal code:", orderData.shippingAddress.zipCode);

            const response = await createOrder(orderData);

            if (!response.success || !response.data) {
                throw new Error(response.error || "Failed to create order");
            }

            // Clear checkout data
            localStorage.removeItem('checkoutData');

            // Trigger cart update to refresh cart state in UI
            triggerCartUpdate();

            // Show success message based on payment method
            if (checkoutData.paymentMethod.type === "Cash On Delivery") {
                toast.success("Order placed successfully! You'll pay upon delivery.");
            } else {
                toast.success("Order placed successfully!");
            }

            // Redirect to success page with actual order ID
            router.push(`/order-success?orderId=${response.data.id}`);
        } catch (error) {
            console.error("Error placing order:", error);
            toast.error("Failed to place order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle quantity update
    const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        setUpdatingItemId(itemId);
        try {
            if (newQuantity === 0) {
                // Remove item
                const result = await removeFromCart({ cartItemId: itemId });

                if (result.success) {
                    toast.success("Item removed from cart");
                    // Update local cart data
                    if (cart) {
                        setCart({
                            ...cart,
                            items: cart.items.filter(item => item.id !== itemId)
                        });
                    }
                    triggerCartUpdate();
                } else {
                    toast.error(result.message || "Failed to remove item");
                }
            } else {
                // Update quantity
                const result = await updateCartItem({
                    cartItemId: itemId,
                    quantity: newQuantity
                });

                if (result.success) {
                    toast.success("Quantity updated");
                    // Update local cart data
                    if (cart) {
                        setCart({
                            ...cart,
                            items: cart.items.map(item =>
                                item.id === itemId
                                    ? { ...item, quantity: newQuantity }
                                    : item
                            )
                        });
                    }
                } else {
                    toast.error(result.message || "Failed to update quantity");
                }
            }
        } catch (error) {
            console.error("Error updating item:", error);
            toast.error("Failed to update item");
        } finally {
            setUpdatingItemId(null);
        }
    };

    // If data is loading, show loading state
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-light mb-8">ORDER CONFIRMATION</h1>
                <ProgressSteps currentStep={3} />
                <div className="flex justify-center my-12">
                    <p>Loading order information...</p>
                </div>
            </div>
        );
    }

    // If no checkout data or cart, redirect
    if (!checkoutData || !cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-light mb-8">ORDER CONFIRMATION</h1>
                <ProgressSteps currentStep={3} />
                <div className="flex flex-col items-center justify-center my-12">
                    <p className="mb-4">Missing order information. Please complete shipping details.</p>
                    <Button onClick={() => router.push("/shipping")}>Return to Shipping</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-light mb-8">ORDER CONFIRMATION</h1>
            <ProgressSteps currentStep={3} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Shipping Information */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <MapPin className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium flex items-center">
                                    Shipping Address
                                </h3>
                                <div>
                                    <p className="font-medium">{checkoutData.shippingAddress.fullName}</p>
                                    <p>{checkoutData.shippingAddress.streetAddress}</p>
                                    <p>{checkoutData.shippingAddress.city}, {checkoutData.shippingAddress.state || ''} {checkoutData.shippingAddress.zipCode || ''}</p>
                                    <p>{checkoutData.shippingAddress.country}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => router.push("/shipping")}>
                                    Edit
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Shipping Method */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <Truck className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium">Shipping Method</h3>
                                {checkoutData.shippingAddress.courier ? (
                                    <div className="flex items-center justify-between">
                                        <p>{checkoutData.shippingAddress.courier}</p>
                                        <p className="font-medium">${(checkoutData.shippingAddress.shippingPrice / 100).toFixed(2)}</p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">Standard Shipping</p>
                                )}
                                <Button variant="outline" size="sm" onClick={() => router.push("/shipping")}>
                                    Edit
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Payment Method */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <CreditCard className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium">Payment Method</h3>
                                <p>{checkoutData.paymentMethod.type}</p>
                                <Button variant="outline" size="sm" onClick={() => router.push("/shipping")}>
                                    Edit
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Item List */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <Package className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Order Items</h3>
                                <div className="space-y-4">
                                    {cart.items.map((item: CartItem) => (
                                        <div key={item.id} className="flex items-center justify-between border-b pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden relative">
                                                    {item.image && (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <div className="flex items-center mt-2 space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                            disabled={updatingItemId === item.id}
                                                        >
                                                            {updatingItemId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minus className="h-3 w-3" />}
                                                        </Button>
                                                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                            disabled={updatingItemId === item.id}
                                                        >
                                                            {updatingItemId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7 ml-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleUpdateQuantity(item.id, 0)}
                                                            disabled={updatingItemId === item.id}
                                                        >
                                                            {updatingItemId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <Card className="p-6 sticky top-20">
                        <h2 className="text-xl font-medium mb-4">Order Summary</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal ({cart.items.length} items)</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>${(shippingCost / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Estimated Tax</span>
                                    <span>${estimatedTax.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Order Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full"
                                onClick={handlePlaceOrder}
                                disabled={isSubmitting || cart.items.length === 0}
                            >
                                {isSubmitting ? 'Processing...' : 'Place Order'}
                            </Button>

                            <p className="text-sm text-center text-muted-foreground">
                                By placing your order, you agree to our Terms of Service and Privacy Policy
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
} 