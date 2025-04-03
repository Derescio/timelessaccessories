"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import ProgressSteps from "@/components/cart/cart-progress-steps";
import { Card } from "@/components/ui/card";
import { getCart } from "@/lib/actions/cart.actions";
import { createOrder, getOrderWithItems, createOrderWithoutDeletingCart } from "@/lib/actions/order.actions";
import { toast } from "sonner";
import { CreditCard, MapPin, Package, Truck, Loader2, Check } from "lucide-react";
import { z } from "zod";
import { shippingAddressSchema } from "@/lib/validators";
import Image from "next/image";
import PaymentSection from "./PaymentSection";
import { PaymentStatus, OrderStatus } from "@prisma/client";


// Define CartItemDetails interface
interface CartItemDetails {
    id: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    image?: string;
    productId: string;
    inventory?: {
        id: string;
        images: string[];
        retailPrice?: number;
        compareAtPrice?: number | null;
        costPrice?: number;
        attributeValues?: Array<{
            value: string;
            attribute: {
                name: string;
            };
        }>;
    };
    attributes?: Record<string, string>;
}

interface OrderItemDetails {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    productId: string;
    orderId: string;
    inventoryId: string;
    createdAt: Date;
    updatedAt: Date;
    attributes?: Record<string, string>;
}

interface Cart {
    id: string;
    items: CartItemDetails[];
    processed?: boolean;
}

// Define the type for the checkout data
interface CheckoutData {
    fullName?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    parish?: string;
    country?: string;
    postalCode?: string;
    courier?: string;
    shippingPrice?: number;
    shippingAddress?: z.infer<typeof shippingAddressSchema> & {
        state?: string;
        courier?: string;
        shippingPrice?: number;
        address?: string;
        zipCode?: string;
        postalCode?: string;
    };
    cartId?: string;
    subtotal?: number;
    tax?: number;
    shipping?: number;
    total?: number;
    paymentMethod?: { type: string; provider?: string };
    useCourier?: boolean;
    courierName?: string;
    orderId?: string;
    pendingCreation?: boolean;
    timestamp?: string;
}

// Add fetch function
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
    const [cartItems, setCartItems] = useState<CartItemDetails[] | OrderItemDetails[]>([]);
    const [checkoutData, setCheckoutData] = useState<CheckoutData>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State variables for the enhanced flow
    const [isPendingCreation, setIsPendingCreation] = useState(false);
    const [isOrderCreated, setIsOrderCreated] = useState(false);
    const [orderCreationError, setOrderCreationError] = useState<string | null>(null);
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

    // Get market from environment variable
    const MARKET = process.env.NEXT_PUBLIC_MARKET || 'GLOBAL';
    const IS_LASCO_MARKET = MARKET === 'LASCO';

    // Check if we should redirect directly to LascoPay
    useEffect(() => {
        const directRedirect = searchParams.get('directRedirect');
        const orderId = searchParams.get('orderId');

        if (IS_LASCO_MARKET && directRedirect === 'true' && orderId) {
            // console.log('Direct redirect to LascoPay payment page detected');
            toast.success("Redirecting to LascoPay payment page...");

            // Allow a moment for the page to load before redirecting
            setTimeout(() => {
                window.location.href = `https://pay.lascobizja.com/btn/YFxrwuD1qO9k?orderId=${orderId}`;
            }, 1500);
        }
    }, [searchParams, IS_LASCO_MARKET]);

    // Load cart and checkout data
    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                const urlOrderId = searchParams.get('orderId');
                const savedCheckoutData = localStorage.getItem('checkoutData');
                const savedCartId = localStorage.getItem('cartId');

                // If we have checkout data with pending creation flag
                if (savedCheckoutData) {
                    const parsedCheckoutData = JSON.parse(savedCheckoutData);
                    //console.log("Found saved checkout data:", parsedCheckoutData);

                    // For LASCO market, orders are created on the shipping page
                    if (IS_LASCO_MARKET) {
                        // Always get order details for LASCO market since order is already created
                        const orderId = urlOrderId || parsedCheckoutData.orderId;
                        if (!orderId) {
                            console.error("No order ID found for LASCO market");
                            toast.error("Order information is missing. Please return to shipping.");
                            router.push("/shipping");
                            return;
                        }

                        // console.log("LASCO market: Loading order with ID:", orderId);
                        const orderResult = await getOrderWithItems(orderId);

                        if (orderResult.success && orderResult.data) {
                            const order = orderResult.data;

                            // Set cart from order items
                            if (order.items) {
                                const orderItems = order.items.map(item => ({
                                    id: item.id,
                                    name: item.name || "Unknown Product",
                                    price: parseFloat(String(item.price)),
                                    quantity: item.quantity,
                                    image: item.image || "/images/placeholder.jpg",
                                    productId: item.productId,
                                    attributes: item.attributes || {},
                                    inventory: item.inventory ? {
                                        id: item.inventory.id,
                                        images: item.inventory.images || [],
                                        retailPrice: Number(item.inventory.retailPrice),
                                        compareAtPrice: item.inventory.compareAtPrice ? Number(item.inventory.compareAtPrice) : null,
                                        costPrice: Number(item.inventory.costPrice),
                                        attributeValues: item.inventory.attributeValues
                                    } : undefined
                                }));

                                setCart({ id: order.id, items: orderItems });
                                setCartItems(orderItems);
                            }

                            // Extract shipping address from order
                            let shippingAddress = null;
                            try {
                                shippingAddress = typeof order.shippingAddress === 'string'
                                    ? JSON.parse(order.shippingAddress)
                                    : order.shippingAddress;
                            } catch (e) {
                                console.error("Error parsing shipping address:", e);
                                shippingAddress = {
                                    fullName: "N/A",
                                    address: "N/A",
                                    city: "N/A",
                                    country: "N/A"
                                };
                            }

                            // Update checkout data with order information
                            setCheckoutData({
                                shippingAddress,
                                orderId: order.id,
                                shipping: parseFloat(String(order.shipping)),
                                subtotal: parseFloat(String(order.subtotal)),
                                tax: parseFloat(String(order.tax)),
                                total: parseFloat(String(order.total)),
                                paymentMethod: { type: "LascoPay" },
                                pendingCreation: false,
                                courierName: parsedCheckoutData.courierName
                            });
                        } else {
                            console.error("Failed to load LASCO order:", orderResult.error);
                            toast.error("Could not find your order. Please try again.");
                            router.push("/shipping");
                            return;
                        }
                    } else if (parsedCheckoutData.pendingCreation === true) {
                        // For GLOBAL market, check if the order needs to be created
                        // console.log("GLOBAL market: This is pending creation data that needs to be processed");
                        setIsPendingCreation(true);
                        setCheckoutData(parsedCheckoutData);

                        // Load cart data
                        const cartResult = await fetchCart();
                        if (cartResult.success && cartResult.data) {
                            setCart(cartResult.data);
                            setCartItems(cartResult.data.items);
                        } else {
                            console.error("Failed to load cart for pending order");
                            toast.error("Could not load your cart. Please try again.");
                        }

                        setIsLoading(false);
                        return;
                    }

                    // If we have a regular order with checkout data and order ID
                    if (urlOrderId || parsedCheckoutData.orderId) {
                        const orderId = urlOrderId || parsedCheckoutData.orderId;
                        //  console.log("Order ID found:", orderId);

                        // Fetch order data from the database
                        const orderResult = await getOrderWithItems(orderId);

                        if (orderResult.success && orderResult.data) {
                            const order = orderResult.data;
                            //console.log("Order data loaded:", order);

                            // Set cart from order items
                            if (order.items) {
                                const orderItems = order.items.map(item => ({
                                    id: item.id,
                                    name: item.name || "Unknown Product",
                                    price: parseFloat(String(item.price)),
                                    quantity: item.quantity,
                                    image: item.image || "/images/placeholder.jpg",
                                    productId: item.productId,
                                    attributes: item.attributes || {},
                                    inventory: item.inventory ? {
                                        id: item.inventory.id,
                                        images: item.inventory.images || [],
                                        retailPrice: Number(item.inventory.retailPrice),
                                        compareAtPrice: item.inventory.compareAtPrice ? Number(item.inventory.compareAtPrice) : null,
                                        costPrice: Number(item.inventory.costPrice),
                                        attributeValues: item.inventory.attributeValues
                                    } : undefined
                                }));

                                setCart({ id: order.id, items: orderItems });
                                setCartItems(orderItems);
                            }

                            // Extract shipping address from order
                            let shippingAddress = null;
                            try {
                                shippingAddress = typeof order.shippingAddress === 'string'
                                    ? JSON.parse(order.shippingAddress)
                                    : order.shippingAddress;
                            } catch (e) {
                                console.error("Error parsing shipping address:", e);
                                // Set default values for required fields
                                shippingAddress = {
                                    fullName: "N/A",
                                    address: "N/A",
                                    city: "N/A",
                                    country: "N/A"
                                };
                            }

                            // Get payment method from order or use the paymentMethod fromLocalStorage

                            const paymentMethod = order.payment?.provider || localStorage.getItem("paymentMethod") || "PayPal";

                            // Update checkout data with order information
                            setCheckoutData({
                                shippingAddress,
                                orderId: order.id,
                                shipping: parseFloat(String(order.shipping)),
                                subtotal: parseFloat(String(order.subtotal)),
                                tax: parseFloat(String(order.tax)),
                                total: parseFloat(String(order.total)),
                                paymentMethod: { type: paymentMethod },
                                pendingCreation: false
                            });
                        } else {
                            console.error("Failed to load order:", orderResult.error);
                            toast.error("Failed to load order information");

                            // Fall back to checkout data from localStorage if available
                            if (savedCheckoutData) {
                                setCheckoutData(JSON.parse(savedCheckoutData));

                                // Try to load cart if we have a cart ID
                                if (savedCartId) {
                                    const cartResult = await fetchCart();
                                    if (cartResult.success && cartResult.data) {
                                        setCart(cartResult.data);
                                        setCartItems(cartResult.data.items);
                                    }
                                }
                            }
                        }
                    } else {
                        console.error("No order ID in URL params and no valid checkout data");
                        toast.error("No valid order information found");
                    }
                } else {
                    console.error("No order ID in URL params and no pending creation data");
                    toast.error("No order information provided");
                }
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Failed to load order information");
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [searchParams, router, IS_LASCO_MARKET]);

    // Calculate order summary
    const subtotal = cartItems?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
    const estimatedTax = subtotal * 0.07; // 7% tax rate

    // Fix shipping cost calculation with better logging
    const rawShippingCost = checkoutData?.shippingPrice || checkoutData?.shipping || 0;
    //console.log('Raw shipping cost:', rawShippingCost, 'type:', typeof rawShippingCost);

    // Get normalized shipping cost with proper handling
    let normalizedShippingCost = 0;
    if (typeof rawShippingCost === 'number') {
        // For LASCO market, shipping is usually stored directly
        normalizedShippingCost = rawShippingCost;
    } else if (typeof rawShippingCost === 'string') {
        // Try to parse string to number
        normalizedShippingCost = parseFloat(rawShippingCost) || 0;
    }

    // Debug logging
    // console.log('Shipping cost debug:', {
    //     raw: rawShippingCost,
    //     normalized: normalizedShippingCost,
    //     shippingPrice: checkoutData?.shippingPrice,
    //     shipping: checkoutData?.shipping,
    //     checkoutData: checkoutData
    // });

    // Calculate total with the correct shipping cost
    const total = subtotal + estimatedTax + normalizedShippingCost;

    // Format price helper
    const formatPrice = (price: number) => {
        return price.toFixed(2);
    };

    // Create order in database from pending creation data
    const handleCreateOrder = async () => {
        if (!checkoutData || !cart) {
            toast.error("Missing order information. Please go back to the shipping page.");
            return;
        }

        setIsSubmitting(true);
        setOrderCreationError(null);

        try {
            //console.log("Creating order with data:", { checkoutData, cart });

            // Save the user's address to their profile
            //let addressResult;
            // try {
            //     // Determine which field to use for country based on market type
            //     const countryValue = IS_LASCO_MARKET ? checkoutData.parish : checkoutData.country;

            //     // Call the address creation/update function
            //     // const addressResult = await createOrUpdateUserAddress({
            //     //     street: checkoutData.streetAddress || "",
            //     //     city: checkoutData.city || "",
            //     //     state: checkoutData.state || "",
            //     //     postalCode: checkoutData.postalCode || "",
            //     //     country: countryValue || "",
            //     //     isUserManaged: false // Explicitly mark as not user-managed so it won't appear in address book
            //     // });

            //     //console.log("Address save response:", addressResult);
            // } catch (addressError) {
            //     console.error("Error saving address:", addressError);
            //     // Continue with order creation even if address save fails
            // }

            // Prepare order data
            const paymentMethod = IS_LASCO_MARKET ? "LascoPay" : checkoutData.paymentMethod?.type || "PayPal";
            const orderData = {
                cartId: cart.id,
                shippingAddress: {
                    fullName: checkoutData.fullName || "",
                    email: "", // Will be populated from session
                    phone: "", // Optional
                    address: checkoutData.streetAddress || "",
                    city: checkoutData.city || "",
                    state: checkoutData.state || "",
                    zipCode: checkoutData.postalCode || "",
                    country: checkoutData.country || checkoutData.parish || "",
                },
                shipping: {
                    method: checkoutData.courierName
                        ? `Courier - ${checkoutData.courierName}`
                        : "Standard Shipping",
                    cost: checkoutData.shipping || 0,
                },
                payment: {
                    method: paymentMethod,
                    status: PaymentStatus.PENDING,
                    providerId: "", // Will be filled after payment
                },
                subtotal: checkoutData.subtotal || 0,
                tax: checkoutData.tax || 0,
                total: checkoutData.total || 0,
                status: OrderStatus.PENDING,
            };

            //console.log("Creating order with payment method:", paymentMethod);

            // Use the appropriate order creation function based on market
            const response = IS_LASCO_MARKET
                ? await createOrderWithoutDeletingCart(orderData)
                : await createOrder(orderData);

            if (!response.success || !response.data) {
                console.error("Order creation failed:", response.error);
                setOrderCreationError(response.error as string || "Failed to create your order");
                toast.error("Failed to create your order. Please try again.");
                return;
            }

            // console.log("Order created successfully:", response.data);

            // Update checkoutData with the new order ID
            const updatedCheckoutData = {
                ...checkoutData,
                orderId: response.data?.id || "",
                pendingCreation: false
            };

            // Update state and localStorage
            setCheckoutData(updatedCheckoutData);
            setCreatedOrderId(response.data?.id || "");
            setIsOrderCreated(true);
            localStorage.setItem("checkoutData", JSON.stringify(updatedCheckoutData));

            // For LASCO market, store order ID to prevent duplicates
            if (IS_LASCO_MARKET && response.data?.id) {
                localStorage.setItem("lascoPayOrderId", response.data.id);
                // Also set a flag to skip payment update since we just created the payment
                localStorage.setItem("skipPaymentUpdate", "true");
            }

            // Show success toast
            toast.success("Order created successfully! Please proceed with payment.");

        } catch (error) {
            console.error("Error creating order:", error);
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
            setOrderCreationError(errorMessage);
            toast.error("Failed to create your order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-light mb-8">ORDER CONFIRMATION</h1>
                <ProgressSteps currentStep={3} totalSteps={3} />
                <div className="flex justify-center my-12">
                    <p>Loading order information...</p>
                </div>
            </div>
        );
    }

    // If no checkout data or cart, redirect
    if (!checkoutData || !cart || !cartItems || cartItems.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-light mb-8">ORDER CONFIRMATION</h1>
                <ProgressSteps currentStep={3} totalSteps={3} />
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
            <ProgressSteps currentStep={3} totalSteps={3} />

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
                                {checkoutData.shippingAddress ? (
                                    <div>
                                        <p className="font-medium">{checkoutData.shippingAddress.fullName}</p>
                                        <p>{checkoutData.shippingAddress.streetAddress || checkoutData.shippingAddress.address || ""}</p>
                                        <p>{checkoutData.shippingAddress.city}, {checkoutData.shippingAddress.state || ''} {checkoutData.shippingAddress.zipCode || checkoutData.shippingAddress.postalCode || ''}</p>
                                        <p>{checkoutData.shippingAddress.country}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-medium">{checkoutData.fullName}</p>
                                        <p>{checkoutData.streetAddress}</p>
                                        <p>{checkoutData.city}, {checkoutData.state || ''} {checkoutData.postalCode || ''}</p>
                                        <p>{checkoutData.country || checkoutData.parish}</p>
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
                                <p>
                                    {checkoutData.courierName
                                        ? `Courier - ${checkoutData.courierName}`
                                        : "Standard Shipping"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Estimated delivery:
                                    {IS_LASCO_MARKET
                                        ? " 2-3 business days"
                                        : " 7-14 business days"}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Order Items */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <Package className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div className="space-y-4 w-full">
                                <h3 className="text-lg font-medium">Order Items</h3>
                                <div className="flex flex-col gap-4 mt-3">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-4 py-3 border-b">
                                            <div className="relative overflow-hidden rounded-md w-16 h-16">
                                                <Image
                                                    src={item.image || "/images/placeholder.jpg"}
                                                    alt={item.name}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="font-medium line-clamp-1">{item.name}</h4>
                                                <p className="text-muted-foreground text-sm">
                                                    Qty: {item.quantity}
                                                </p>
                                                <p>
                                                    <span className="font-medium">${formatPrice(item.price)}</span>
                                                </p>

                                                {/* Display attributes if they exist */}
                                                {item.attributes && Object.keys(item.attributes).length > 0 && (
                                                    <div className="mt-2 text-sm">
                                                        <p className="text-muted-foreground">Product Details:</p>
                                                        <ul className="list-disc list-inside">
                                                            {Object.entries(item.attributes).map(([key, value]) => (
                                                                <li key={key} className="text-muted-foreground">
                                                                    <span className="font-medium">{key}:</span> {value}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Payment Method - Only shown if not pending creation */}
                    {!isPendingCreation && (
                        <Card className="p-6">
                            <div className="flex items-start gap-4">
                                <CreditCard className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                                <div className="space-y-2">
                                    <h3 className="text-lg font-medium">Payment Method</h3>
                                    <p>
                                        {IS_LASCO_MARKET
                                            ? "LascoPay"
                                            : (checkoutData.paymentMethod?.type || "PayPal")}
                                    </p>
                                    {checkoutData.paymentMethod?.provider && (
                                        <p className="text-sm text-muted-foreground">
                                            Payment: {checkoutData.paymentMethod?.type || "Unknown"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <Card className="p-6 sticky top-20">
                        <h2 className="text-xl font-medium mb-4">Order Summary</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex justify-between">
                                        <div className="text-sm">
                                            <span>{item.name} × {item.quantity}</span>
                                            {/* Show key attributes in a compact format */}
                                            {item.attributes && Object.keys(item.attributes).length > 0 && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {Object.entries(item.attributes)
                                                        .slice(0, 2) // Show only first 2 attributes to keep it compact
                                                        .map(([key, value]) => (
                                                            <span key={key} className="mr-2">
                                                                {key}: {value}
                                                            </span>
                                                        ))}
                                                    {Object.keys(item.attributes).length > 2 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            +{Object.keys(item.attributes).length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>${normalizedShippingCost.toFixed(2)}</span>
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
                                {IS_LASCO_MARKET ? (
                                    // For LASCO market, directly show payment section (order is already created)
                                    <PaymentSection
                                        orderId={checkoutData?.orderId || ""}
                                        totalAmount={total}
                                        paymentMethod="LascoPay"
                                    />
                                ) : isPendingCreation && !isOrderCreated ? (
                                    <div className="mt-4">
                                        <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mb-4">
                                            <p className="text-sm text-blue-800">
                                                Please confirm your order to proceed with payment.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleCreateOrder}
                                            disabled={isSubmitting}
                                            className="w-full"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Creating order...
                                                </span>
                                            ) : (
                                                "Confirm Order"
                                            )}
                                        </Button>
                                        {orderCreationError && (
                                            <p className="text-red-500 text-sm mt-2">{orderCreationError}</p>
                                        )}
                                    </div>
                                ) : isOrderCreated ? (
                                    <div className="mt-4">
                                        <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-4">
                                            <p className="text-sm text-green-800 flex items-center gap-2">
                                                <Check className="h-4 w-4" />
                                                Order confirmed! Please complete payment below.
                                            </p>
                                        </div>
                                        <PaymentSection
                                            orderId={checkoutData?.orderId || createdOrderId || ""}
                                            totalAmount={total}
                                            paymentMethod={checkoutData.paymentMethod?.type}
                                        />
                                    </div>

                                ) : checkoutData.orderId ? (
                                    <PaymentSection
                                        orderId={checkoutData.orderId}
                                        totalAmount={total}
                                        paymentMethod={checkoutData.paymentMethod?.type}
                                    />
                                ) : null}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
} 