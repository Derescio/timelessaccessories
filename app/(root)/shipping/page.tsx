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
// import { Separator } from "@/components/ui/separator"
// import { Switch } from "@/components/ui/switch"
// import { formatCurrency } from "@/lib/utils"
import { createOrder } from "@/lib/actions/order.actions"
import { OrderStatus, PaymentStatus } from "@prisma/client"
import { ArrowLeft } from "lucide-react"
import { useSession } from "next-auth/react"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"

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
    const { data: session } = useSession()

    // State for cart data
    const [cart, setCart] = useState<Cart | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // State for form data
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
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
                const [cartResult, addresses] = await Promise.all([
                    getCart(),
                    getUserAddresses()
                ])

                console.log('Loading data:', {
                    cartResult,
                    addresses,
                    marketType: IS_LASCO_MARKET ? 'LASCO' : 'GLOBAL'
                })

                if (cartResult) {
                    setCart(cartResult)
                }

                // If user has addresses, populate the form with the first address
                if (addresses && addresses.length > 0) {
                    const address = addresses[0] as Address
                    console.log('Populating form with address:', {
                        address,
                        isLascMarket: IS_LASCO_MARKET
                    })

                    setFormData(prev => ({
                        ...prev,
                        fullName: session?.user?.name || "",
                        streetAddress: address.street || "",
                        city: address.city || "",
                        state: address.state || "",
                        parish: IS_LASCO_MARKET ? (address.country || "") : "",
                        country: !IS_LASCO_MARKET ? (address.country || "") : "",
                        postalCode: address.postalCode || "",
                        courier: "",
                        shippingPrice: 0,
                    }))
                }
            } catch (error) {
                console.error("Error loading data:", error)
                toast.error("Failed to load data")
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [session?.user?.name])

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

    // Calculate order summary
    const calculateOrderSummary = () => {
        if (!cart) return { subtotal: 0, shipping: 0, total: 0 };

        const subtotal = cart.items.reduce((total, item) =>
            total + (item.price * item.quantity), 0);
        const shipping = formData.shippingPrice;
        const total = subtotal + shipping;

        return { subtotal, shipping, total };
    };

    // Check if this order qualifies for free shipping
    const qualifiesForFreeShipping = calculateOrderSummary().subtotal >= 100

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
        setPaymentMethod(method)
        setFormErrors({ ...formErrors, paymentMethod: "" })
    }

    // Create order in database and return order data
    const createOrderInDatabase = async () => {
        try {
            setIsCreatingOrder(true)

            if (!cart) {
                throw new Error("Cart is not available")
            }

            // Create order in database
            const response = await createOrder({
                cartId: cart.id,
                shippingAddress: {
                    fullName: formData.fullName || "",
                    email: "", // Will be populated from session
                    phone: "", // Optional
                    address: formData.streetAddress || "",
                    city: formData.city || "",
                    state: formData.state || "",
                    zipCode: formData.postalCode || "",
                    country: formData.country || formData.parish || "",
                },
                shipping: {
                    method: selectedCourier
                        ? `Courier - ${selectedCourier}`
                        : "Standard Shipping",
                    cost: formData.shippingPrice || 0,
                },
                payment: {
                    method: paymentMethod,
                    status: PaymentStatus.PENDING,
                    providerId: "", // Will be filled after payment
                },
                subtotal: calculateOrderSummary().subtotal,
                tax: calculateTax(formData.parish || 'DEFAULT', calculateOrderSummary().subtotal),
                total: calculateOrderSummary().total,
                status: OrderStatus.PENDING,
            })

            if (!response.success) {
                throw new Error(response.error || "Failed to create order")
            }

            return response.data
        } catch (error) {
            console.error("Error creating order:", error)
            throw error
        } finally {
            setIsCreatingOrder(false)
        }
    }

    // Add validation function that was missing
    const validateForm = () => {
        const errors: Record<string, string> = {};

        // Check required fields
        if (!formData.fullName) errors.fullName = "Full name is required";
        if (!formData.streetAddress) errors.streetAddress = "Street address is required";
        if (!formData.city) errors.city = "City is required";

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

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Form submitted')
        console.log('Form Data:', formData)
        console.log('Market Type:', IS_LASCO_MARKET ? 'LASCO' : 'GLOBAL')

        try {
            // Validate form first
            if (!validateForm()) {
                toast.error("Please fill in all required fields");
                return;
            }

            // For LASCO market (courier with LascoPay)
            if (IS_LASCO_MARKET) {
                console.log('Processing LASCO market submission')
                // Validate courier selection
                if (!selectedCourier) {
                    console.log('Courier validation failed')
                    setFormErrors({ courier: "Please select a courier" })
                    toast.error("Please select a courier before continuing")
                    return
                }

                // Create order in database
                console.log('Creating order in database...')
                const order = await createOrderInDatabase()

                // Check if order was created successfully
                if (!order) {
                    console.log('Order creation failed')
                    toast.error("Failed to create order")
                    return
                }

                console.log('Order created successfully:', order)

                // Set order created state to show LascoPay button
                setOrderCreated({
                    orderId: order.id,
                    total: calculateOrderSummary().total
                })

                // Force re-render by logging state
                console.log('Set orderCreated state:', {
                    orderId: order.id,
                    total: calculateOrderSummary().total
                })

                // Save checkout data to localStorage for reference
                localStorage.setItem('checkoutData', JSON.stringify({
                    shippingAddress: {
                        ...formData,
                        zipCode: formData.postalCode, // Ensure postalCode is saved as zipCode
                    },
                    paymentMethod: { type: "LascoPay" },
                    useCourier: true,
                    orderId: order.id
                }))

                // Clear cart from localStorage
                localStorage.removeItem('cart')

                toast.success("Order saved. Please complete payment with LascoPay")
                return
            }

            // For GLOBAL market (standard shipping with regular payment methods)
            if (!IS_LASCO_MARKET) {
                console.log('Processing GLOBAL market submission')
                // Form is already validated at this point

                console.log('Form validation passed, saving to localStorage')
                console.log('Saving postal code:', formData.postalCode);

                // Save checkout data to localStorage
                const checkoutData = {
                    shippingAddress: {
                        ...formData,
                        zipCode: formData.postalCode, // Explicitly save postalCode as zipCode
                    },
                    paymentMethod: { type: paymentMethod },
                    useCourier: false
                }

                console.log('Saving checkout data with postal code:', formData.postalCode);
                localStorage.setItem('checkoutData', JSON.stringify(checkoutData))

                // Clear cart from localStorage
                console.log('Clearing cart from localStorage')
                localStorage.removeItem('cart')

                // Proceed to confirmation page
                toast.success("Shipping and payment details saved")
                router.push("/confirmation")
            }

        } catch (error) {
            console.error("Error processing form:", error)
            toast.error("An error occurred while processing your information")
        }
    }

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
                            <h2 className="text-xl font-medium">Shipping Address</h2>
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
                                                        console.log('LascoPay button clicked. Redirecting to payment page...');
                                                        // Redirect to the LascoPay payment page with the order ID
                                                        window.location.href = `https://pay.lascobizja.com/btn/YFxrwuD1qO9k?orderId=${orderCreated.orderId}`;
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
                                                    {method === "Credit Card" && (
                                                        <span className="text-xs text-muted-foreground mt-1">
                                                            Pay directly with your credit or debit card
                                                        </span>
                                                    )}
                                                    {method === "Cash On Delivery" && (
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
                                            <span>${calculateTax(formData.parish || 'DEFAULT', calculateOrderSummary().subtotal).toFixed(2)}</span>
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

