"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import ProgressSteps from "@/components/cart/cart-progress-steps";
import { Card } from "@/components/ui/card";
import { getCart, updateCartItem, removeFromCart } from "@/lib/actions/cart.actions";
import { createOrder, getOrderWithItems } from "@/lib/actions/order.actions";
import { toast } from "sonner";
import { CreditCard, MapPin, Package, Truck, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { z } from "zod";
import { shippingAddressSchema, paymentMethodSchema } from "@/lib/validators";
import Image from "next/image";
import { triggerCartUpdate } from "@/lib/utils";
import PaymentSection from "./PaymentSection";

// Define interfaces for type safety
interface CartItemDetails {
    id: string;
    quantity: number;
    price: number;
    name: string;
    image?: string;
    product?: {
        id: string;
        name: string;
    };
    inventory?: {
        id: string;
        images: string[];
    };
}

interface Cart {
    id: string;
    items: CartItemDetails[];
    processed?: boolean;
}

// Define the type for the checkout data
interface CheckoutData {
    shippingAddress?: z.infer<typeof shippingAddressSchema> & {
        state?: string;
        courier?: string;
        shippingPrice?: number;
    };
    paymentMethod: z.infer<typeof paymentMethodSchema>;
    useCourier?: boolean;
    orderId?: string;
}

// Add fetch functions
async function fetchCart() {
    try {
        const result = await getCart();
        return {
            success: true,
            data: result ? {
                ...result,
                processed: false // Default to false if not present in the response
            } : null
        };
    } catch (error) {
        console.error("Error fetching cart:", error);
        return { success: false, error: "Failed to fetch cart" };
    }
}

export default function ConfirmationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State for cart data
    const [cart, setCart] = useState<Cart | null>(null);
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

    // Load cart and checkout data
    useEffect(() => {
        // Function to load cart data
        const loadData = async () => {
            setIsLoading(true);

            try {
                // Get orderId from URL params
                const urlOrderId = searchParams.get('orderId');

                if (!urlOrderId) {
                    console.error("No order ID in URL params");
                    toast.error("No order ID provided");
                    setIsLoading(false);
                    return;
                }

                console.log("Loading order data for ID:", urlOrderId);

                // Fetch order directly from the database
                const orderResult = await getOrderWithItems(urlOrderId);

                if (orderResult.success && orderResult.data) {
                    const order = orderResult.data;

                    console.log("Successfully loaded order:", {
                        id: order.id,
                        status: order.status,
                        total: order.total,
                        shipping: order.shipping,
                        subtotal: order.subtotal,
                        tax: order.tax,
                        notes: order.notes,
                        paymentMethod: order.payment?.provider,
                        shippingAddressRaw: order.shippingAddress,
                        itemsCount: order.items.length
                    });

                    // Extract payment method from order notes
                    let paymentMethod = "PayPal"; // Default
                    if (order.notes) {
                        const match = order.notes.match(/Payment Method: ([^,]+)/);
                        if (match && match[1]) {
                            paymentMethod = match[1];
                            console.log("Extracted payment method from notes:", paymentMethod);
                        }
                    }

                    // Extract shipping method from order notes
                    let shippingMethod = "Standard Shipping"; // Default
                    if (order.notes) {
                        const match = order.notes.match(/Shipping Method: ([^,]+)/);
                        if (match && match[1]) {
                            shippingMethod = match[1];
                            console.log("Extracted shipping method from notes:", shippingMethod);
                        }
                    }

                    // Define ShippingAddressType interface 
                    interface ShippingAddressType {
                        fullName?: string;
                        email?: string;
                        phone?: string;
                        address?: string;
                        city?: string;
                        state?: string;
                        zipCode?: string;
                        country?: string;
                        [key: string]: string | undefined;
                    }

                    // Parse shipping address
                    let shippingAddress: ShippingAddressType = {};
                    try {
                        shippingAddress = order.shippingAddress
                            ? typeof order.shippingAddress === 'string'
                                ? JSON.parse(order.shippingAddress)
                                : order.shippingAddress
                            : {};

                        // Ensure required fields exist
                        if (!shippingAddress.fullName) shippingAddress.fullName = "";
                        if (!shippingAddress.streetAddress) shippingAddress.streetAddress = "";
                        if (!shippingAddress.city) shippingAddress.city = "";
                    } catch (e) {
                        console.error("Error parsing shipping address:", e);
                        // Set default values for required fields
                        shippingAddress = {
                            fullName: "",
                            streetAddress: "",
                            city: "",
                        };
                    }

                    // Create cart-like structure from order items
                    const orderItems = order.items.map(item => ({
                        id: item.id,
                        price: Number(item.price),
                        quantity: item.quantity,
                        name: item.name,
                        image: item.image || undefined, // Ensure image is string | undefined, not null
                    }));

                    // Set the cart data
                    setCart({
                        id: `order-${urlOrderId}`,
                        items: orderItems,
                    });

                    // Set checkout data
                    const orderCheckoutData = {
                        fullName: shippingAddress.fullName || "",
                        streetAddress: shippingAddress.address || "",
                        city: shippingAddress.city || "",
                        state: shippingAddress.state || "",
                        country: shippingAddress.country || "",
                        zipCode: shippingAddress.zipCode || "",
                        courier: shippingMethod.includes('Courier') ? shippingMethod.replace('Courier - ', '') : '',
                        shippingPrice: order.shipping || 0
                    };

                    setCheckoutData({
                        orderId: urlOrderId,
                        shippingAddress: orderCheckoutData,
                        paymentMethod: { type: paymentMethod }
                    });
                } else {
                    console.error("Error loading order data:", orderResult.error);
                    toast.error("Failed to load order information");

                    // Fall back to localStorage if available
                    const savedCheckoutData = localStorage.getItem('checkoutData');
                    if (savedCheckoutData) {
                        const parsedCheckoutData = JSON.parse(savedCheckoutData) as CheckoutData;

                        console.log("Falling back to localStorage data:", parsedCheckoutData);

                        if (urlOrderId) {
                            parsedCheckoutData.orderId = urlOrderId;
                        }

                        setCheckoutData(parsedCheckoutData);

                        // Try to load cart data
                        const cartResult = await fetchCart();
                        if (cartResult.success && cartResult.data) {
                            setCart(cartResult.data);
                        }
                    } else {
                        console.error("No fallback data available");
                    }
                }
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Failed to load order information");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [searchParams]);

    // Calculate order summary
    const subtotal = cart?.items?.reduce((total: number, item: CartItemDetails) => total + (item.price * item.quantity), 0) || 0;
    const estimatedTax = subtotal * 0.07; // 7% tax rate
    const shippingCost = checkoutData?.shippingAddress?.shippingPrice || 0;
    const total = subtotal + estimatedTax + (shippingCost / 100);

    // Handle place order
    const handlePlaceOrder = async () => {
        setIsSubmitting(true);

        try {
            if (!cart || !checkoutData) {
                throw new Error("Missing cart or checkout data");
            }

            // Get current cart values
            const currentSubtotal = cart.items.reduce((total: number, item: CartItemDetails) =>
                total + (item.price * item.quantity), 0);
            const currentTax = currentSubtotal * 0.07;
            const currentTotal = currentSubtotal + currentTax + (shippingCost / 100);

            if (!checkoutData.shippingAddress) {
                throw new Error("Missing shipping address");
            }

            // Extract and standardize postal code from shipping address data
            const shippingAddressData = checkoutData.shippingAddress;
            const postalCode = shippingAddressData.zipCode || "";

            // Create order in database
            const orderData = {
                cartId: cart.id,
                shippingAddress: {
                    fullName: shippingAddressData.fullName || "",
                    email: "", // Will be populated from session
                    phone: "", // Optional
                    address: shippingAddressData.streetAddress || "",
                    city: shippingAddressData.city || "",
                    state: shippingAddressData.state || "",
                    zipCode: postalCode, // Use standardized postal code
                    country: shippingAddressData.country || shippingAddressData.parish || "",
                },
                shipping: {
                    method: shippingAddressData.courier
                        ? `Courier - ${shippingAddressData.courier}`
                        : "Standard Shipping",
                    cost: shippingAddressData.shippingPrice || 0,
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

            const response = await createOrder(orderData);

            if (!response.success || !response.data) {
                throw new Error(response.error ? String(response.error) : "Failed to create order");
            }

            // Update checkout data with order ID
            const updatedCheckoutData = {
                ...checkoutData,
                orderId: response.data.id
            };

            // Save the updated checkout data with the order ID
            localStorage.setItem('checkoutData', JSON.stringify(updatedCheckoutData));
            setCheckoutData(updatedCheckoutData);

            // Clear checkout data
            localStorage.removeItem('checkoutData');

            // Trigger cart update to refresh cart state in UI
            triggerCartUpdate();

            // Show success message based on payment method
            if (checkoutData.paymentMethod.type === "COD") {
                toast.success("Order placed successfully! You'll pay upon delivery.");
            } else {
                toast.success("Order placed successfully. Please complete payment.");
            }
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
                                {checkoutData.shippingAddress && (
                                    <div>
                                        <p className="font-medium">{checkoutData.shippingAddress.fullName}</p>
                                        <p>{checkoutData.shippingAddress.streetAddress}</p>
                                        <p>{checkoutData.shippingAddress.city}, {checkoutData.shippingAddress.state || ''} {checkoutData.shippingAddress.zipCode || ''}</p>
                                        <p>{checkoutData.shippingAddress.country}</p>
                                    </div>
                                )}
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
                                {checkoutData.shippingAddress?.courier ? (
                                    <div className="flex items-center justify-between">
                                        <p>{checkoutData.shippingAddress.courier}</p>
                                        <p className="font-medium">${((checkoutData.shippingAddress.shippingPrice || 0) / 100).toFixed(2)}</p>
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
                                    {cart.items.map((item: CartItemDetails) => (
                                        <div key={item.id} className="flex items-center justify-between border-b pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden relative">
                                                    {item.image && (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name || ''}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.name || (item.product?.name)}</p>
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

                            <div>
                                {checkoutData && !isSubmitting ? (
                                    <PaymentSection
                                        orderId={checkoutData.orderId || "pending"}
                                        totalAmount={total as number}
                                        paymentMethod={checkoutData.paymentMethod?.type || "PayPal"}
                                    />
                                ) : (
                                    <Button
                                        onClick={handlePlaceOrder}
                                        disabled={isSubmitting}
                                        size="lg"
                                        className="w-full mt-6"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Processing...
                                            </div>
                                        ) : (
                                            "Place Order"
                                        )}
                                    </Button>
                                )}
                            </div>

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