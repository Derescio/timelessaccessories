/**
 * Shipping Page Component
 * 
 * Known Bugs and Fixes:
 * 1. Form Validation Issues (2024-03-XX)
 *    - Bug: Form was showing "Please correct the errors in the form" without specific error messages
 *    - Fix: Removed Zod validation and implemented direct field validation with specific error messages
 *    - Fix: Added console logs for debugging form submission process
 *    - Fix: Added proper error handling for required fields
 * 
 * 2. Market-Specific Validation (2024-03-XX)
 *    - Bug: Validation was not properly handling LASCO vs GLOBAL market differences
 *    - Fix: Implemented separate validation logic for each market type
 *    - Fix: Added proper handling of parish/country fields based on market type
 * 
 * 3. State Management (2024-03-XX)
 *    - Bug: Unused state variables causing ESLint warnings
 *    - Fix: Removed unused checkoutFormSchema and related types
 *    - Fix: Converted useCourier from state to constant since setter was unused
 * 
 * 4. Form Data Persistence (2024-03-XX)
 *    - Bug: Form data wasn't being properly saved to localStorage
 *    - Fix: Added proper localStorage handling for both market types
 *    - Fix: Added order ID to localStorage data for LASCO market
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import ProgressSteps from "@/components/cart/cart-progress-steps"
import { Card } from "@/components/ui/card"
import { getCart } from "@/lib/actions/cart.actions"
import { getUserAddresses } from "@/lib/actions/user.actions"
import { PAYMENT_METHODS } from "@/lib/constants"
import { Check, Info, Loader2 } from "lucide-react"
import { COURIERS } from "@/lib/validators"
import { toast } from "sonner"
import { calculateShipping, getEstimatedShippingTime } from "@/lib/utils/shipping-calculator"
import { calculateTax } from "@/lib/utils/tax-calculator"
import LascoPayButton from "@/components/checkout/LascoPayButton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createOrderWithoutDeletingCart, createGuestOrderWithoutDeletingCart } from "@/lib/actions/order.actions"
import { OrderStatus, PaymentStatus } from "@prisma/client"
import { ArrowLeft } from "lucide-react"
import { useSession } from "next-auth/react"
import { createOrUpdateUserAddress } from "@/lib/actions/user.actions"
// import PaymentMethodSelector from "./PaymentMethodSelector"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import { Separator } from "@/components/ui/separator"
// import { Switch } from "@/components/ui/switch"
// import { formatCurrency } from "@/lib/utils"

// Define a type for Courier
interface Courier {
    name: string
    price: number
}

// Define a type for Address from the database
interface Address {
    id: string
    createdAt: Date
    updatedAt: Date
    street: string
    city: string
    state: string
    postalCode: string
    country: string
    userId: string
}

// Define types for cart items
interface CartItem {
    id: string;
    price: number;
    quantity: number;
    name: string;
}

interface Cart {
    id: string;
    items: CartItem[];
}

// Update the form data interface
interface FormData {
    fullName: string;
    email: string;
    phone: string;
    streetAddress: string;
    city: string;
    state: string;
    parish: string;
    country: string;
    postalCode: string;
    courier: string;
    shippingPrice: number;
}

// Create a combined schema for the entire form
// const checkoutFormSchema = z.object({
//     shippingAddress: shippingAddressSchema,
//     paymentMethod: paymentMethodSchema,
//     useCourier: z.boolean().optional().default(false),
// })

// type CheckoutFormData = z.infer<typeof checkoutFormSchema>

// Get market from environment variable
const MARKET = process.env.NEXT_PUBLIC_MARKET || 'GLOBAL'
const IS_LASCO_MARKET = MARKET === 'LASCO'

export default function ShippingPage() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const isAuthenticated = status === 'authenticated'

    // State for cart data
    const [cart, setCart] = useState<Cart | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // State for form data
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        phone: '',
        streetAddress: '',
        city: '',
        state: IS_LASCO_MARKET ? 'Jamaica' : '', // Default to Jamaica for LASCO market
        parish: IS_LASCO_MARKET ? '' : '',
        country: IS_LASCO_MARKET ? '' : '',
        postalCode: '',
        courier: '',
        shippingPrice: 0
    })

    // State for payment method
    const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0])
    useEffect(() => {
        // Load payment method from localStorage
        const savedPaymentMethod = localStorage.getItem("paymentMethod");
        if (savedPaymentMethod) {
            setPaymentMethod(savedPaymentMethod);
        }
    }, []);


    // State to track selected courier
    const [selectedCourier, setSelectedCourier] = useState<string>("")

    // Flag to track whether to use courier or standard shipping
    // For LASCO market, default to courier service
    const useCourier = IS_LASCO_MARKET

    // State for form errors
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    // State to track if order is being created
    const [isCreatingOrder, setIsCreatingOrder] = useState(false)

    // State to track if order has been created (for LASCO market)
    const [orderCreated, setOrderCreated] = useState<{ orderId: string, total: number } | null>(null)

    // Load cart data and user addresses on component mount
    useEffect(() => {
        async function loadData() {
            setIsLoading(true)
            try {
                // Always load cart data
                const cartResult = await getCart()

                // Only load user addresses if authenticated
                let addresses = null
                if (isAuthenticated) {
                    addresses = await getUserAddresses()
                }

                // console.log('Loading data:', {
                //     cartResult,
                //     addresses,
                //     marketType: IS_LASCO_MARKET ? 'LASCO' : 'GLOBAL',
                //     isAuthenticated
                // })

                if (cartResult) {
                    setCart(cartResult)
                }

                // If user has addresses and is authenticated, populate the form with the first address
                if (isAuthenticated && addresses && addresses.length > 0) {
                    const address = addresses[0] as Address
                    // console.log('Populating form with address:', {
                    //     address,
                    //     isLascoMarket: IS_LASCO_MARKET
                    // })

                    // Ensure we properly map the fields from the address to the form
                    setFormData(prev => ({
                        ...prev,
                        fullName: session?.user?.name || "",
                        email: session?.user?.email || "",
                        phone: "", // Phone not available in session, leave empty
                        streetAddress: address.street || "",
                        city: address.city || "",
                        state: IS_LASCO_MARKET ? "Jamaica" : (address.state || ""),
                        parish: IS_LASCO_MARKET ? (address.country || "") : "",
                        country: !IS_LASCO_MARKET ? (address.country || "") : "",
                        postalCode: address.postalCode || "",
                        courier: prev.courier,
                        shippingPrice: prev.shippingPrice,
                    }))
                } else if (isAuthenticated && session?.user?.name) {
                    // For authenticated users without saved addresses, just set the name and email
                    setFormData(prev => ({
                        ...prev,
                        fullName: session.user.name || "",
                        email: session.user.email || "",
                        phone: "", // Phone not available in session, leave empty
                    }))
                }
                // For guest users, form starts empty (which is fine)
            } catch (error) {
                console.error("Error loading data:", error)
                toast.error("Failed to load data")
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [session?.user?.name, isAuthenticated])

    // Calculate standard shipping based on region and order total
    const calculateStandardShipping = useCallback((region: string) => {
        if (!cart || !region) return 0;

        const orderTotal = cart.items.reduce((total, item) =>
            total + (item.price * item.quantity), 0);

        return calculateShipping(region, orderTotal);
    }, [cart]);

    // Update useEffect hooks
    useEffect(() => {
        // Calculate shipping when parish or country changes
        const region = IS_LASCO_MARKET ? formData.parish || '' : formData.country || '';
        const shippingCost = calculateStandardShipping(region);
        setFormData(prev => ({
            ...prev,
            shippingPrice: shippingCost
        }));
    }, [formData.parish, formData.country, calculateStandardShipping]);

    useEffect(() => {
        // Recalculate shipping when courier toggle changes
        const region = IS_LASCO_MARKET ? formData.parish || '' : formData.country || '';
        const shippingCost = calculateStandardShipping(region);
        setFormData(prev => ({
            ...prev,
            shippingPrice: shippingCost
        }));
    }, [useCourier, formData.parish, formData.country, calculateStandardShipping]);

    // Calculate order summary - Updated to include tax
    const calculateOrderSummary = () => {
        if (!cart) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };

        const subtotal = cart.items.reduce((total, item) =>
            total + (item.price * item.quantity), 0);
        const shipping = formData.shippingPrice;
        // Calculate tax based on the region (parish or country)
        const tax = calculateTax(formData.parish || formData.country || 'DEFAULT', subtotal);
        // Include tax in the total calculation
        const total = subtotal + shipping + tax;

        return { subtotal, tax, shipping, total };
    };

    // Check if this order qualifies for free shipping
    const qualifiesForFreeShipping = calculateOrderSummary().subtotal >= 600

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => {
            const newData = { ...prev, [name]: value }

            // If switching between parish and country, clear the other field
            if (name === 'parish') {
                newData.country = '' // Use empty string instead of undefined
            } else if (name === 'country') {
                newData.parish = '' // Use empty string instead of undefined
            }

            return newData
        })

        // Clear error when field is edited
        if (formErrors[name]) {
            setFormErrors({ ...formErrors, [name]: "" })
        }

        // Reset order created state when editing form
        setOrderCreated(null)
    }

    // Handle payment method selection
    const handlePaymentMethodChange = (method: string) => {
        setPaymentMethod(method);
        setFormErrors({ ...formErrors, paymentMethod: "" });

        // Save the selected payment method to localStorage
        localStorage.setItem("paymentMethod", method);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // console.log('📦 Shipping form - Starting submission');
        // console.log('📦 Shipping form - Form data:', {
        //     ...formData,
        //     email: formData.email || 'Not provided',
        //     phone: formData.phone || 'Not provided'
        // });
        // console.log('📦 Shipping form - Is authenticated:', isAuthenticated);
        // console.log('📦 Shipping form - Market type:', IS_LASCO_MARKET ? 'LASCO' : 'GLOBAL');

        try {
            setIsCreatingOrder(true);

            // Validate the form
            // console.log('📦 Shipping form - Validating form');
            const formIsValid = validateForm();
            if (!formIsValid) {
                // console.log("📦 Shipping form - Form validation failed:", formErrors);
                setIsCreatingOrder(false);
                return;
            }
            // console.log('📦 Shipping form - Form validation passed');

            // Check if cart still exists by getting a fresh copy
            try {
                // console.log('📦 Shipping form - Validating cart');
                const freshCart = await getCart();
                if (!freshCart || !freshCart.items || freshCart.items.length === 0) {
                    // console.error('📦 Shipping form - Cart is empty or not found');
                    toast.error("Your cart is empty or could not be found. Please add items to your cart first.");
                    router.push("/cart");
                    setIsCreatingOrder(false);
                    return;
                }

                // console.log('📦 Shipping form - Cart validated successfully, items:', freshCart.items.length);
                // Update cart with fresh data
                setCart(freshCart);
            } catch (cartError) {
                console.error("📦 Shipping form - Error validating cart:", cartError);
                toast.error("There was a problem with your cart. Please try again.");
                setIsCreatingOrder(false);
                return;
            }

            // Calculate tax and order summary
            const orderSummary = calculateOrderSummary();
            // console.log('📦 Shipping form - Order summary calculated:', orderSummary);

            if (IS_LASCO_MARKET) {
                // For LASCO market, create the order directly in the database
                // console.log("📦 Shipping form - LASCO market: Creating order directly in database");

                try {
                    // Save the user's address to their profile (only for authenticated users)
                    if (isAuthenticated) {
                        const addressResult = await createOrUpdateUserAddress({
                            street: formData.streetAddress || "",
                            city: formData.city || "",
                            state: formData.state || "",
                            postalCode: formData.postalCode || "",
                            country: formData.parish || "",
                            isUserManaged: true // Explicitly mark as not user-managed so it won't appear in address book
                        });
                        //  console.log("Address save response:", addressResult);
                    }

                    // Prepare order data for LASCO market
                    const orderData = {
                        cartId: cart?.id || "",
                        shippingAddress: {
                            fullName: formData.fullName || "",
                            email: formData.email || "",
                            phone: formData.phone || "",
                            address: formData.streetAddress || "",
                            city: formData.city || "",
                            state: formData.state || "",
                            zipCode: formData.postalCode || "",
                            country: formData.parish || "",
                        },
                        shipping: {
                            method: selectedCourier
                                ? `Courier - ${selectedCourier}`
                                : "Standard Shipping",
                            cost: formData.shippingPrice || 0,
                        },
                        payment: {
                            method: "LascoPay",
                            status: PaymentStatus.PENDING,
                            providerId: "", // Will be filled after payment
                        },
                        subtotal: orderSummary.subtotal,
                        tax: orderSummary.tax,
                        total: orderSummary.total,
                        status: OrderStatus.PENDING,
                    };

                    // console.log("Creating LASCO order with data:", orderData);

                    // Create order without deleting cart - use guest function if not authenticated
                    const response = isAuthenticated
                        ? await createOrderWithoutDeletingCart(orderData)
                        : await createGuestOrderWithoutDeletingCart(orderData);

                    if (!response.success || !response.data) {
                        throw new Error(response.error ? String(response.error) : "Failed to create order");
                    }

                    const orderId = response.data.id;
                    //  console.log("Order created successfully with ID:", orderId);

                    // Store minimal data in localStorage for confirmation page
                    const checkoutDataToSave = {
                        ...formData,
                        orderId: orderId,
                        subtotal: orderSummary.subtotal,
                        tax: orderSummary.tax,
                        shipping: orderSummary.shipping,
                        total: orderSummary.total,
                        paymentMethod: { type: "LascoPay" },
                        useCourier: selectedCourier ? true : false,
                        courierName: selectedCourier,
                        pendingCreation: false, // Order is already created
                        timestamp: new Date().toISOString()
                    };

                    localStorage.setItem("checkoutData", JSON.stringify(checkoutDataToSave));
                    localStorage.setItem("cartId", cart?.id || "");
                    localStorage.setItem("lascoPayOrderId", orderId);

                    // Redirect to confirmation page with order ID
                    //console.log("Redirecting to confirmation page for LASCO payment");
                    router.push(`/confirmation?orderId=${orderId}`);

                } catch (orderError) {
                    console.error("Error creating order:", orderError);
                    toast.error("Failed to create your order. Please try again.");
                    setIsCreatingOrder(false);
                }

            } else {
                // For GLOBAL market, store checkout data and redirect to confirmation page
                //  console.log("GLOBAL market: Storing checkout data for confirmation page");


                try {
                    // Save the user's address to their profile (only for authenticated users)
                    if (isAuthenticated) {
                        const addressResult = await createOrUpdateUserAddress({
                            street: formData.streetAddress || "",
                            city: formData.city || "",
                            state: formData.state || "",
                            postalCode: formData.postalCode || "",
                            country: formData.parish || "",
                            isUserManaged: true // Explicitly mark as not user-managed so it won't appear in address book
                        });
                        //  console.log("Address save response:", addressResult);
                    }
                } catch (addressError) {
                    console.error("Error saving address:", addressError);
                    // Continue with order creation even if address save fails
                }

                // Store checkout data in local storage for confirmation page
                const checkoutDataToSave = {
                    ...formData,
                    cartId: cart?.id,
                    subtotal: orderSummary.subtotal,
                    tax: orderSummary.tax,
                    shipping: orderSummary.shipping,
                    total: orderSummary.total,
                    paymentMethod: { type: paymentMethod || localStorage.getItem("paymentMethod") || "Cash", },
                    useCourier: selectedCourier !== null,
                    courierName: selectedCourier,
                    pendingCreation: true,  // Flag to indicate this needs to be created in the database
                    timestamp: new Date().toISOString(),  // Add timestamp for tracking
                    // Include email for guest orders
                    shippingAddress: {
                        fullName: formData.fullName || "",
                        email: formData.email || "",
                        phone: formData.phone || "",
                        address: formData.streetAddress || "",
                        city: formData.city || "",
                        state: formData.state || "",
                        zipCode: formData.postalCode || "",
                        country: !IS_LASCO_MARKET ? (formData.country || "") : (formData.parish || ""),
                    }
                };

                //  console.log("Saving checkout data to localStorage:", checkoutDataToSave);

                // Log the actual JSON that will be stored
                const jsonToStore = JSON.stringify(checkoutDataToSave);
                //  console.log("JSON being stored in localStorage:", jsonToStore);

                localStorage.setItem("checkoutData", jsonToStore);
                localStorage.setItem("cartId", cart?.id || "");

                // Directly navigate to confirmation page for order creation and review
                //console.log(`Redirecting to confirmation page for order creation and payment`);
                router.push(`/confirmation`);
            }

        } catch (err) {
            console.error("Form submission error:", err);
            toast.error("An error occurred. Please try again later.");
            setIsCreatingOrder(false);
        }
    };

    // Add validation function that was missing
    const validateForm = () => {
        const errors: Record<string, string> = {};

        // Check required fields
        if (!formData.fullName) errors.fullName = "Full name is required";
        if (!formData.streetAddress) errors.streetAddress = "Street address is required";
        if (!formData.city) errors.city = "City is required";

        // Email is required for guest users, optional for authenticated users
        if (!isAuthenticated && !formData.email) {
            errors.email = "Email is required for guest checkout";
        } else if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }

        // Check for either country or parish depending on market type
        if (IS_LASCO_MARKET && !formData.parish) {
            errors.parish = "Parish is required";
        } else if (!IS_LASCO_MARKET && !formData.country) {
            errors.country = "Country is required";
        }

        // Update form errors
        setFormErrors(errors);

        // Form is valid if no errors
        return Object.keys(errors).length === 0;
    };

    // Determine the total number of steps based on market type
    const totalSteps = IS_LASCO_MARKET ? 2 : 3;

    // If cart is loading, show loading state
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-light mb-8">SHIPPING & PAYMENT</h1>
                <ProgressSteps currentStep={2} totalSteps={totalSteps} />
                <div className="flex justify-center my-12">
                    <p>Loading cart information...</p>
                </div>
            </div>
        )
    }

    // If cart is empty, redirect to cart page
    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-light mb-8">SHIPPING & PAYMENT</h1>
                <ProgressSteps currentStep={2} totalSteps={totalSteps} />
                <div className="flex flex-col items-center justify-center my-12">
                    <p className="mb-4">Your cart is empty. Please add items to your cart before proceeding to checkout.</p>
                    <Button onClick={() => router.push("/cart")}>Return to Cart</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-light mb-8">SHIPPING & PAYMENT</h1>
            <ProgressSteps currentStep={2} totalSteps={totalSteps} />

            <div className="mb-6 mt-4">
                <Link href="/cart" className="inline-flex items-center text-sm text-primary hover:text-primary/80">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Cart to Update Items
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Left Column: Form Sections */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Shipping Address Form */}
                    <div className="border p-6 rounded-md">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-medium">Shipping Address</h2>
                                {!isAuthenticated && (
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-200">
                                        Guest Checkout
                                    </span>
                                )}
                                {isAuthenticated && (
                                    <span className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200">
                                        Signed In
                                    </span>
                                )}
                            </div>
                            {qualifiesForFreeShipping && !IS_LASCO_MARKET && (
                                <span className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200">
                                    Free Shipping Eligible
                                </span>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName || ""}
                                    onChange={handleInputChange}
                                    className={formErrors.fullName ? "border-red-500" : ""}
                                    disabled={!!orderCreated}
                                />
                                {formErrors.fullName && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    value={formData.email || ""}
                                    onChange={handleInputChange}
                                    className={formErrors.email ? "border-red-500" : ""}
                                    disabled={!!orderCreated}
                                />
                                {formErrors.email && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone || ""}
                                    onChange={handleInputChange}
                                    className={formErrors.phone ? "border-red-500" : ""}
                                    disabled={!!orderCreated}
                                />
                                {formErrors.phone && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="streetAddress">Street Address</Label>
                                <Input
                                    id="streetAddress"
                                    name="streetAddress"
                                    value={formData.streetAddress || ""}
                                    onChange={handleInputChange}
                                    className={formErrors.streetAddress ? "border-red-500" : ""}
                                    disabled={!!orderCreated}
                                />
                                {formErrors.streetAddress && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.streetAddress}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        value={formData.city || ""}
                                        onChange={handleInputChange}
                                        className={formErrors.city ? "border-red-500" : ""}
                                        disabled={!!orderCreated}
                                    />
                                    {formErrors.city && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="state">State/Province</Label>
                                    <Input
                                        id="state"
                                        name="state"
                                        value={formData.state || ""}
                                        onChange={handleInputChange}
                                        className={formErrors.state ? "border-red-500" : ""}
                                        disabled={!!orderCreated}
                                        placeholder="State or province"
                                    />
                                    {formErrors.state && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.state}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={IS_LASCO_MARKET ? "parish" : "country"}>
                                            {IS_LASCO_MARKET ? "Parish" : "Country"}
                                        </Label>
                                        {!IS_LASCO_MARKET && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-4 w-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-xs">
                                                            Please enter your country (e.g. USA, Canada, UK).
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                    <Input
                                        id={IS_LASCO_MARKET ? "parish" : "country"}
                                        name={IS_LASCO_MARKET ? "parish" : "country"}
                                        value={IS_LASCO_MARKET ? (formData.parish || "") : (formData.country || "")}
                                        onChange={handleInputChange}
                                        className={formErrors[IS_LASCO_MARKET ? "parish" : "country"] ? "border-red-500" : ""}
                                        placeholder={IS_LASCO_MARKET ? "Kingston, St. Catherine, etc." : "USA, Canada, UK, etc."}
                                        disabled={!!orderCreated}
                                    />
                                    {formErrors[IS_LASCO_MARKET ? "parish" : "country"] && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {formErrors[IS_LASCO_MARKET ? "parish" : "country"]}
                                        </p>
                                    )}
                                    {((IS_LASCO_MARKET && formData.parish) || (!IS_LASCO_MARKET && formData.country)) && !useCourier && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Standard shipping: ${((formData.shippingPrice || 0) / 100).toFixed(2)}
                                            {qualifiesForFreeShipping && " (Free shipping applied)"}
                                            <br />
                                            Estimated delivery: {getEstimatedShippingTime(IS_LASCO_MARKET ? formData.parish! : formData.country!)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Postal Code - Only show for GLOBAL market */}
                            {!IS_LASCO_MARKET && (
                                <div className="col-span-2">
                                    <Label htmlFor="postalCode" className={formErrors.postalCode ? "text-red-500" : ""}>
                                        Postal Code
                                    </Label>
                                    <Input
                                        id="postalCode"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleInputChange}
                                        className={formErrors.postalCode ? "border-red-500" : ""}
                                        placeholder="12345"
                                        disabled={!!orderCreated}
                                    />
                                    {formErrors.postalCode && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.postalCode}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shipping Method Section */}
                    {IS_LASCO_MARKET ? (
                        /* LASCO Market: Courier Selection with LascoPay Only */
                        <div className="border p-6 rounded-md">
                            <h2 className="text-xl font-medium mb-4">Shipping Method</h2>
                            <div className="space-y-4">
                                <Select
                                    value={selectedCourier}
                                    onValueChange={(value) => {
                                        const selectedCourier = COURIERS.find((c) => c.name === value)
                                        if (selectedCourier) {
                                            setSelectedCourier(value)
                                            setFormData(prev => ({
                                                ...prev,
                                                courier: selectedCourier.name,
                                                shippingPrice: selectedCourier.price
                                            }))
                                            // Clear error when selection is made
                                            setFormErrors({ ...formErrors, courier: "" })
                                            // Reset order created state
                                            setOrderCreated(null)
                                        }
                                    }}
                                    disabled={!!orderCreated}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a courier service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COURIERS.map((courier: Courier) => (
                                            <SelectItem key={courier.name} value={courier.name}>
                                                {courier.name} - ${(courier.price / 100).toFixed(2)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedCourier && (
                                    <div className="mt-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                                        <p>Estimated delivery: 2-3 business days</p>
                                        <p className="mt-1">Shipping cost: ${(COURIERS.find(c => c.name === selectedCourier)?.price || 0) / 100}</p>
                                    </div>
                                )}

                                {formErrors.courier && (
                                    <p className="text-red-500 text-sm mt-2">{formErrors.courier}</p>
                                )}

                                {/* Payment Section for LASCO market */}
                                <div className="mt-4 border-t pt-4">
                                    <p className="font-medium mb-2">Payment Method</p>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Payment is processed through Lasco Pay.
                                    </p>

                                    {orderCreated ? (
                                        <div className="space-y-4">
                                            <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-4">
                                                <p className="text-sm text-green-800 flex items-center gap-2">
                                                    <Check className="h-4 w-4" />
                                                    Order #{orderCreated.orderId} saved successfully! Please complete payment below.
                                                </p>
                                            </div>
                                            <div className="flex justify-center">
                                                <LascoPayButton
                                                    onClick={() => {
                                                        // console.log('LascoPay button clicked on shipping page. Redirecting directly to payment page...');
                                                        // Show toast before redirecting
                                                        toast.success("Redirecting to LascoPay payment page...", {
                                                            duration: 2000,
                                                            position: "top-center"
                                                        });
                                                        // Redirect directly to the LascoPay payment page
                                                        setTimeout(() => {
                                                            window.location.href = `https://pay.lascobizja.com/btn/YFxrwuD1qO9k?orderId=${orderCreated.orderId}`;
                                                        }, 1500);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mb-4">
                                            <p className="text-sm text-blue-800">
                                                Fill in your shipping details and click &quot;Save & Proceed to Payment&quot;
                                                to create your order and complete payment.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* GLOBAL Market: Standard Shipping with Regular Payment Methods */
                        <>
                            <div className="border p-6 rounded-md">
                                <h2 className="text-xl font-medium">Shipping Method</h2>
                                <div className="bg-muted/30 p-4 rounded-md mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Using standard shipping based on your country.
                                    </p>
                                </div>
                            </div>

                            {/* Payment Method for Global Market */}
                            <div className="border p-6 rounded-md">
                                <h2 className="text-xl font-medium mb-4">Payment Method</h2>
                                {orderCreated ? (
                                    <div className="space-y-4">
                                        <div className="bg-muted/50 p-4 rounded-md">
                                            <h3 className="font-medium mb-2">Complete your payment</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Your order has been placed. Please proceed to the confirmation page to complete your payment.
                                            </p>
                                        </div>
                                        <Button
                                            className="w-full"
                                            onClick={() => router.push(`/confirmation?orderId=${orderCreated.orderId}`)}
                                        >
                                            Proceed to Payment
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <RadioGroup
                                            value={paymentMethod}
                                            onValueChange={handlePaymentMethodChange}
                                            className="space-y-3"
                                        >
                                            {PAYMENT_METHODS.map((method) => (
                                                <div key={method} className="flex items-center space-x-2 border p-3 rounded-md">
                                                    <RadioGroupItem value={method} id={`payment-${method}`} />
                                                    <Label htmlFor={`payment-${method}`} className="flex-1 cursor-pointer">
                                                        <div className="flex flex-col">
                                                            <span>{method}</span>
                                                            {method === "PayPal" && (
                                                                <span className="text-xs text-muted-foreground mt-1">
                                                                    Pay securely using your PayPal account or credit card
                                                                </span>
                                                            )}
                                                            {method === "Stripe" && (
                                                                <span className="text-xs text-muted-foreground mt-1">
                                                                    Pay directly with your credit or debit card
                                                                </span>
                                                            )}
                                                            {method === "COD" && (
                                                                <span className="text-xs text-muted-foreground mt-1">
                                                                    Pay when you receive your order
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                        {formErrors.paymentMethod && (
                                            <p className="text-red-500 text-sm mt-2">{formErrors.paymentMethod}</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <Card className="p-6 sticky top-20">
                        <h2 className="text-xl font-medium mb-4">Order Summary</h2>
                        <div className="space-y-4">
                            {cart && cart.items && cart.items.length > 0 ? (
                                <>
                                    <div className="space-y-2">
                                        {cart.items.map((item: CartItem) => (
                                            <div key={item.id} className="flex justify-between">
                                                <span className="text-sm">
                                                    {item.name} × {item.quantity}
                                                </span>
                                                <span className="text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>${calculateOrderSummary().subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Shipping</span>
                                            <span>${calculateOrderSummary().shipping.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tax</span>
                                            <span>${calculateOrderSummary().tax.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between font-semibold">
                                            <span>Total</span>
                                            <span>${calculateOrderSummary().total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p>No items in cart</p>
                            )}

                            {/* Button display logic */}
                            {IS_LASCO_MARKET ? (
                                // LASCO market logic - show button only if all requirements are met
                                selectedCourier ? (
                                    orderCreated ? null : (
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isCreatingOrder}
                                        >
                                            {isCreatingOrder ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                "Save & Proceed to Payment"
                                            )}
                                        </Button>
                                    )
                                ) : (
                                    <p className="text-sm text-center text-muted-foreground">
                                        Please select a courier to continue
                                    </p>
                                )
                            ) : (
                                // GLOBAL market logic - always show button
                                <Button type="submit" className="w-full">
                                    Continue to Review
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </form>
        </div>
    )
}

