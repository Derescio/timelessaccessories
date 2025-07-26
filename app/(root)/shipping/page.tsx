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
import { Check, Info, Loader2, CreditCard } from "lucide-react"
import { COURIERS } from "@/lib/validators"
import { toast } from "sonner"
import { calculateShipping, getEstimatedShippingTime } from "@/lib/utils/shipping-calculator"
import { CountrySelectorDB } from "@/components/shared/CountrySelectorDB"
import { calculateTax } from "@/lib/utils/tax-calculator"
import LascoPayButton from "@/components/checkout/LascoPayButton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createOrderWithoutDeletingCart, createGuestOrderWithoutDeletingCart } from "@/lib/actions/order.actions"
import { OrderStatus, PaymentStatus } from "@prisma/client"
import { ArrowLeft } from "lucide-react"
import { useSession } from "next-auth/react"
import { createOrUpdateUserAddress } from "@/lib/actions/user.actions"
import { useCartPromotions } from "@/hooks/use-cart-promotions"
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

    // Get applied promotions from cart - only when cart is loaded
    const { appliedPromotions, getTotalDiscount, isLoaded: promotionsLoaded } = useCartPromotions(cart)


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

    // State for country selector (GLOBAL market only)
    interface Country {
        id: number;
        name: string;
        iso2: string;
        emoji: string;
        hasStates: boolean;
        region?: string;
        capital?: string;
    }

    interface State {
        id: number;
        name: string;
        stateCode: string;
        hasCities: boolean;
    }

    const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(undefined)
    const [selectedState, setSelectedState] = useState<State | undefined>(undefined)
    const [selectedCity, setSelectedCity] = useState<string>('')

    // Load cart data and user addresses on component mount
    useEffect(() => {
        console.log('🔄 [SHIPPING] useEffect triggered - Loading data...', {
            sessionUserName: session?.user?.name,
            isAuthenticated,
            sessionStatus: status
        })

        async function loadData() {
            setIsLoading(true)
            try {
                // Always load cart data
                console.log('🔄 [SHIPPING] Calling getCart()...')
                const cartResult = await getCart()
                console.log('🔄 [SHIPPING] getCart() result:', !!cartResult)

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
                    console.log('🛒 [SHIPPING] Cart loaded:', {
                        cartId: cartResult.id,
                        itemsCount: cartResult.items?.length || 0
                    })
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
    }, [session?.user?.name, isAuthenticated, status])

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

        // Handle both sync and async results
        if (typeof shippingCost === 'number') {
            setFormData(prev => ({
                ...prev,
                shippingPrice: shippingCost
            }));
        } else {
            shippingCost.then(cost => {
                setFormData(prev => ({
                    ...prev,
                    shippingPrice: cost
                }));
            });
        }
    }, [formData.parish, formData.country, calculateStandardShipping]);

    useEffect(() => {
        // Recalculate shipping when courier toggle changes
        const region = IS_LASCO_MARKET ? formData.parish || '' : formData.country || '';
        const shippingCost = calculateStandardShipping(region);

        // Handle both sync and async results
        if (typeof shippingCost === 'number') {
            setFormData(prev => ({
                ...prev,
                shippingPrice: shippingCost
            }));
        } else {
            shippingCost.then(cost => {
                setFormData(prev => ({
                    ...prev,
                    shippingPrice: cost
                }));
            });
        }
    }, [useCourier, formData.parish, formData.country, calculateStandardShipping]);

    // Handle shipping calculation when country is selected (GLOBAL market)
    const handleShippingCalculation = useCallback(async (countryId: number, stateId?: number) => {
        console.log('🚚 [SHIPPING CALC] Starting shipping calculation:', {
            countryId,
            stateId,
            selectedCountryName: selectedCountry?.name,
            selectedCountryIso2: selectedCountry?.iso2,
            market: 'GLOBAL',
            timestamp: new Date().toISOString()
        });

        try {
            const orderTotal = cart?.items.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;

            console.log('🚚 [SHIPPING CALC] Order details:', {
                cartItemCount: cart?.items?.length || 0,
                orderTotalDollars: orderTotal,
                cartItems: cart?.items?.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.price * item.quantity
                })) || []
            });

            // Call the shipping API endpoint
            const response = await fetch('/api/geographical/shipping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    countryId,
                    stateId,
                    subtotal: orderTotal,
                    market: 'GLOBAL'
                })
            });

            const result = await response.json();

            console.log('🚚 [SHIPPING CALC] API Response:', {
                success: result.success,
                data: result.data,
                error: result.error
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to calculate shipping');
            }

            console.log('🚚 [SHIPPING CALC] Shipping calculation details:', {
                countryName: result.data.countryName,
                countryCode: result.data.countryCode,
                shippingRateDollars: result.data.rate,
                freeShippingThresholdDollars: result.data.freeShippingThreshold,
                isFreeShipping: result.data.isFreeShipping,
                currency: result.data.currency,
                currencySymbol: result.data.currencySymbol
            });

            setFormData(prev => ({
                ...prev,
                country: selectedCountry?.name || '',
                shippingPrice: result.data.rate
            }));

            // Clear any country-related errors
            setFormErrors(prev => ({ ...prev, country: "" }));

            console.log('🚚 [SHIPPING CALC] Updated form data:', {
                country: selectedCountry?.name || '',
                shippingPriceDollars: result.data.rate,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('🚚 [SHIPPING CALC] Error calculating shipping:', error);
            // Set a fallback shipping rate if calculation fails
            setFormData(prev => ({
                ...prev,
                country: selectedCountry?.name || '',
                shippingPrice: 25 // $25 fallback
            }));

            console.log('🚚 [SHIPPING CALC] Applied fallback shipping:', {
                fallbackRateDollars: 25,
                country: selectedCountry?.name || '',
                timestamp: new Date().toISOString()
            });
        }
    }, [cart, selectedCountry]);

    // Handle country selection for GLOBAL market
    const handleCountryChange = useCallback((country: Country | null) => {
        setSelectedCountry(country || undefined);
        if (country) {
            setFormData(prev => ({
                ...prev,
                country: country.name
            }));
            setFormErrors(prev => ({ ...prev, country: "" }));
        }
    }, []);

    // Handle state selection for GLOBAL market
    const handleStateChange = useCallback((state: State | null) => {
        setSelectedState(state || undefined);
        if (state) {
            setFormData(prev => ({
                ...prev,
                state: state.name
            }));
            setFormErrors(prev => ({ ...prev, state: "" }));
        }
    }, []);

    // Handle city input for GLOBAL market
    const handleCityChange = useCallback((city: string) => {
        setSelectedCity(city);
        setFormData(prev => ({
            ...prev,
            city: city
        }));
        setFormErrors(prev => ({ ...prev, city: "" }));
    }, []);

    // Calculate order summary - Updated to include tax and proper free shipping handling
    const calculateOrderSummary = () => {
        if (!cart || !promotionsLoaded) {
            console.log('🎯 [ORDER SUMMARY] Waiting for cart or promotions to load:', {
                hasCart: !!cart,
                promotionsLoaded,
                cartId: cart?.id
            });
            return { subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0, qualifiesForFreeShipping: false };
        }

        const subtotal = cart.items.reduce((total, item) =>
            total + (item.price * item.quantity), 0);
        const discount = getTotalDiscount();
        const discountedSubtotal = Math.max(0, subtotal - discount);

        console.log('🎯 [ORDER SUMMARY] Initial calculations:', {
            subtotalDollars: subtotal,
            discountDollars: discount,
            discountedSubtotalDollars: discountedSubtotal,
            appliedPromotionsCount: appliedPromotions.length,
            cartItemCount: cart.items.length
        });

        // Check if order qualifies for free shipping based on discounted subtotal
        // For LASCO market: $200 threshold, for GLOBAL market: $400 threshold
        const freeShippingThreshold = IS_LASCO_MARKET ? 200 : 400; // in dollars
        const qualifiesForFreeShipping = discountedSubtotal >= freeShippingThreshold;

        console.log('🎯 [ORDER SUMMARY] Free shipping check:', {
            market: IS_LASCO_MARKET ? 'LASCO' : 'GLOBAL',
            freeShippingThresholdDollars: freeShippingThreshold,
            discountedSubtotalDollars: discountedSubtotal,
            qualifiesForFreeShipping,
            shortfallDollars: qualifiesForFreeShipping ? 0 : (freeShippingThreshold - discountedSubtotal)
        });

        // Set shipping to $0 if qualifies for free shipping, otherwise use the calculated rate
        const shipping = qualifiesForFreeShipping ? 0 : formData.shippingPrice;

        console.log('🎯 [ORDER SUMMARY] Shipping calculation:', {
            rawShippingPriceDollars: formData.shippingPrice,
            finalShippingDollars: shipping,
            wasShippingWaived: qualifiesForFreeShipping
        });

        // Calculate tax based on the discounted subtotal + shipping (13% tax rate)
        const taxableAmount = discountedSubtotal + shipping;
        const tax = calculateTax(formData.parish || formData.country || 'DEFAULT', taxableAmount);

        console.log('🎯 [ORDER SUMMARY] Tax calculation:', {
            taxRegion: formData.parish || formData.country || 'DEFAULT',
            taxableAmountDollars: taxableAmount,
            taxRate: '13%',
            taxAmountDollars: tax
        });

        // Include tax in the total calculation
        const total = discountedSubtotal + shipping + tax;

        console.log('🎯 [ORDER SUMMARY] Final calculation:', {
            subtotalDollars: subtotal,
            discountDollars: discount,
            discountedSubtotalDollars: discountedSubtotal,
            shippingDollars: shipping,
            taxDollars: tax,
            totalDollars: total,
            qualifiesForFreeShipping,
            appliedPromotionsCount: appliedPromotions.length,
            timestamp: new Date().toISOString()
        });

        return { subtotal, discount, discountedSubtotal, tax, shipping, total, qualifiesForFreeShipping };
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

        console.log('🚚 [SHIPPING] Form submission started:', {
            cartId: cart?.id,
            appliedPromotionsCount: appliedPromotions.length,
            appliedPromotions: appliedPromotions,
            totalDiscount: getTotalDiscount(),
            orderSummary: calculateOrderSummary(),
            isAuthenticated,
            market: IS_LASCO_MARKET ? 'LASCO' : 'GLOBAL',
            timestamp: new Date().toISOString()
        });

        try {
            setIsCreatingOrder(true);

            // Validate the form
            // console.log('📦 Shipping form - Validating form');
            const formIsValid = validateForm();
            if (!formIsValid) {
                // console.log("📦 Shipping form - Form validation failed:", formErrors);
                toast.error("Please fill in all required fields in the shipping address form");
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

                    // Get the first applied promotion for the order (currently we only support one promotion per order)
                    const firstAppliedPromotion = appliedPromotions.length > 0 ? appliedPromotions[0] : null;

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
                        discount: orderSummary.discount,
                        tax: orderSummary.tax,
                        total: orderSummary.total,
                        status: OrderStatus.PENDING,
                        appliedPromotion: firstAppliedPromotion ? {
                            id: firstAppliedPromotion.id,
                            discount: firstAppliedPromotion.discount
                        } : undefined,
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
                        discount: orderSummary.discount,
                        appliedPromotions: appliedPromotions,
                        tax: orderSummary.tax,
                        shipping: orderSummary.shipping,
                        total: orderSummary.total,
                        paymentMethod: { type: "LascoPay" },
                        useCourier: selectedCourier ? true : false,
                        courierName: selectedCourier,
                        pendingCreation: false, // Order is already created
                        timestamp: new Date().toISOString()
                    };

                    console.log('🚚 [SHIPPING-LASCO] Saving checkout data to localStorage:', {
                        orderId: orderId,
                        checkoutDataKeys: Object.keys(checkoutDataToSave),
                        appliedPromotionsCount: checkoutDataToSave.appliedPromotions?.length || 0,
                        appliedPromotions: checkoutDataToSave.appliedPromotions,
                        discount: checkoutDataToSave.discount,
                        total: checkoutDataToSave.total,
                        pendingCreation: checkoutDataToSave.pendingCreation,
                        timestamp: checkoutDataToSave.timestamp
                    });

                    localStorage.setItem("checkoutData", JSON.stringify(checkoutDataToSave));
                    localStorage.setItem("cartId", cart?.id || "");
                    localStorage.setItem("lascoPayOrderId", orderId);

                    // Track promotion usage for analytics
                    if (appliedPromotions.length > 0) {
                        try {
                            for (const promotion of appliedPromotions) {
                                await fetch('/api/promotions/track-usage', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        promotionId: promotion.id,
                                        userId: isAuthenticated ? session?.user?.id : 'guest',
                                        orderId: orderId,
                                        discountAmount: promotion.discount,
                                        originalAmount: orderSummary.subtotal,
                                        finalAmount: orderSummary.total,
                                        couponCode: promotion.couponCode,
                                        cartItemCount: cart?.items?.length || 0,
                                        customerSegment: isAuthenticated ? 'returning' : 'new',
                                        deviceType: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
                                        isFirstTimeUse: !isAuthenticated,
                                        userEmail: isAuthenticated ? session?.user?.email : formData.email
                                    })
                                });
                            }
                        } catch (trackingError) {
                            console.error('Error tracking promotion usage:', trackingError);
                            // Don't fail the order creation if tracking fails
                        }
                    }

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
                            country: formData.country || "",
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
                    discount: orderSummary.discount,
                    appliedPromotions: appliedPromotions,
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

                console.log('🚚 [SHIPPING] Saving checkout data to localStorage:', {
                    checkoutDataKeys: Object.keys(checkoutDataToSave),
                    appliedPromotionsCount: checkoutDataToSave.appliedPromotions?.length || 0,
                    appliedPromotions: checkoutDataToSave.appliedPromotions,
                    discount: checkoutDataToSave.discount,
                    total: checkoutDataToSave.total,
                    cartId: checkoutDataToSave.cartId,
                    pendingCreation: checkoutDataToSave.pendingCreation,
                    timestamp: checkoutDataToSave.timestamp
                });

                localStorage.setItem("checkoutData", JSON.stringify(checkoutDataToSave));
                localStorage.setItem("cartId", cart?.id || "");

                console.log('🚚 [SHIPPING] Data saved to localStorage successfully');

                // Directly navigate to confirmation page for order creation and review
                console.log('🚚 [SHIPPING] Redirecting to confirmation page');
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
        if (!formData.fullName?.trim()) errors.fullName = "Full name is required";
        if (!formData.streetAddress?.trim()) errors.streetAddress = "Street address is required";

        // Email is required for guest users, optional for authenticated users
        if (!isAuthenticated && !formData.email?.trim()) {
            errors.email = "Email is required for guest checkout";
        } else if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }

        // Market-specific validations
        if (IS_LASCO_MARKET) {
            // LASCO market: Parish is required
            if (!formData.parish?.trim()) {
                errors.parish = "Parish is required";
            }
            // Courier selection is required for LASCO market
            if (!selectedCourier) {
                errors.courier = "Please select a courier service";
            }
        } else {
            // GLOBAL market: Country, state, and city are required
            if (!formData.country?.trim()) {
                errors.country = "Country is required";
            }
            if (!formData.state?.trim()) {
                errors.state = "State/Province is required";
            }
            if (!formData.city?.trim()) {
                errors.city = "City is required";
            }
        }

        // Phone validation (optional but if provided, should be valid)
        if (formData.phone && formData.phone.trim() && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
            errors.phone = "Please enter a valid phone number";
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
                            {/* Full Name */}
                            <div>
                                <Label htmlFor="fullName">Full Name *</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName || ""}
                                    onChange={handleInputChange}
                                    className={formErrors.fullName ? "border-red-500" : ""}
                                    disabled={!!orderCreated}
                                    required
                                />
                                {formErrors.fullName && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <Label htmlFor="email">Email {!isAuthenticated && "*"}</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email || ""}
                                    onChange={handleInputChange}
                                    className={formErrors.email ? "border-red-500" : ""}
                                    disabled={!!orderCreated}
                                    required={!isAuthenticated}
                                />
                                {formErrors.email && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
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

                            {/* Country/Parish Section */}
                            {IS_LASCO_MARKET ? (
                                /* LASCO Market: Parish Input */
                                <div>
                                    <Label htmlFor="parish">Parish *</Label>
                                    <Input
                                        id="parish"
                                        name="parish"
                                        value={formData.parish || ""}
                                        onChange={handleInputChange}
                                        className={formErrors.parish ? "border-red-500" : ""}
                                        placeholder="Kingston, St. Catherine, etc."
                                        disabled={!!orderCreated}
                                        required
                                    />
                                    {formErrors.parish && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.parish}</p>
                                    )}
                                    {formData.parish && !useCourier && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Standard shipping: ${((formData.shippingPrice || 0) / 100).toFixed(2)}
                                            <br />
                                            Estimated delivery: {getEstimatedShippingTime(formData.parish)}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                /* GLOBAL Market: Country Selector with States and Cities */
                                <div className="space-y-4">
                                    <CountrySelectorDB
                                        selectedCountry={selectedCountry}
                                        selectedState={selectedState}
                                        selectedCity={selectedCity}
                                        onCountryChange={handleCountryChange}
                                        onStateChange={handleStateChange}
                                        onCityChange={handleCityChange}
                                        onShippingCalculation={handleShippingCalculation}
                                        disabled={!!orderCreated}
                                    />
                                    {formErrors.country && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.country}</p>
                                    )}
                                    {formErrors.state && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.state}</p>
                                    )}
                                    {formErrors.city && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                                    )}
                                    {/* {formData.country && (
                                        <p className="text-sm text-muted-foreground">
                                            Standard shipping: ${formData.shippingPrice.toFixed(2)}
                                            {calculateOrderSummary().qualifiesForFreeShipping && " (Free shipping applied)"}
                                        </p>
                                    )} */}
                                </div>
                            )}

                            {/* Street Address */}
                            <div>
                                <Label htmlFor="streetAddress">Street Address *</Label>
                                <Input
                                    id="streetAddress"
                                    name="streetAddress"
                                    value={formData.streetAddress || ""}
                                    onChange={handleInputChange}
                                    className={formErrors.streetAddress ? "border-red-500" : ""}
                                    disabled={!!orderCreated}
                                    required
                                />
                                {formErrors.streetAddress && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.streetAddress}</p>
                                )}
                            </div>

                            {/* Postal Code - Only show for GLOBAL market */}
                            {!IS_LASCO_MARKET && (
                                <div>
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
                        /* GLOBAL Market: Payment Method First, Then Shipping */
                        <>
                            {/* Payment Method for Global Market - Moved Above Shipping */}
                            <div className="border p-6 rounded-md">
                                <h2 className="text-xl font-medium mb-6">Payment Method</h2>
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
                                        <div className="grid grid-cols-1 gap-3">
                                            {PAYMENT_METHODS.map((method) => (
                                                <div
                                                    key={method}
                                                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary/50 ${paymentMethod === method
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                    onClick={() => handlePaymentMethodChange(method)}
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        {/* Payment Method Icon */}
                                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white border shadow-sm">
                                                            {method === "Stripe" && (
                                                                <CreditCard className="w-6 h-6 text-blue-600" />
                                                            )}
                                                            {method === "PayPal" && (
                                                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                                                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.28A.641.641 0 0 1 5.568 1.8h6.896c1.789 0 3.199.37 4.19 1.102.99.732 1.486 1.892 1.486 3.48 0 .388-.04.775-.118 1.162 1.274.67 1.911 1.892 1.911 3.666 0 1.774-.706 3.147-2.118 4.119-1.412.972-3.452 1.458-6.12 1.458h-1.294a.641.641 0 0 0-.633.553l-.118.553-.394 2.484a.641.641 0 0 1-.633.553z" fill="#253B80" />
                                                                    <path d="M16.947 6.99c-.158 1.025-.553 1.892-1.184 2.6-.632.709-1.501 1.273-2.607 1.693a8.502 8.502 0 0 1-3.295.632H7.076l-.79 4.977h3.688c.395 0 .711-.316.79-.711l.079-.395.474-2.958.079-.474c.079-.395.395-.711.79-.711h.474c2.212 0 3.925-.869 4.42-3.401.197-1.025.079-1.892-.474-2.484-.197-.237-.474-.395-.79-.553z" fill="#179BD7" />
                                                                    <path d="M15.842 6.516c-.158-.079-.316-.158-.553-.237a5.085 5.085 0 0 0-.948-.158c-.632-.079-1.342-.079-2.133-.079H9.05c-.237 0-.474.158-.553.395L7.628 10.99l-.158.948c.079-.395.395-.711.79-.711h2.685c2.607 0 4.656-.948 5.25-3.717.237-1.104.079-2.054-.553-2.764z" fill="#222D65" />
                                                                </svg>
                                                            )}
                                                        </div>

                                                        {/* Payment Method Details */}
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2">
                                                                <h3 className="font-semibold text-gray-900">{method}</h3>
                                                                {paymentMethod === method && (
                                                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                                        <Check className="w-3 h-3 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {method === "PayPal" && "Pay securely with your PayPal account or credit card"}
                                                                {method === "Stripe" && "Pay directly with your credit or debit card"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {formErrors.paymentMethod && (
                                            <p className="text-red-500 text-sm mt-2">{formErrors.paymentMethod}</p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Shipping Method - Moved Below Payment */}
                            <div className="border p-6 rounded-md">
                                <h2 className="text-xl font-medium">Shipping Method</h2>
                                <div className="bg-muted/30 p-4 rounded-md mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Using standard shipping based on your country.
                                    </p>
                                </div>
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

                                        {/* Applied Promotions */}
                                        {appliedPromotions.map((promo) => (
                                            <div key={promo.id} className="flex justify-between text-green-600">
                                                <span className="text-sm">
                                                    {promo.couponCode} - {promo.name}
                                                </span>
                                                <span>-${promo.discount.toFixed(2)}</span>
                                            </div>
                                        ))}

                                        {calculateOrderSummary().discount > 0 && (
                                            <div className="flex justify-between flex-col text-green-600 font-medium">
                                                {/* <div>
                                                    <span className="text-black">Subtotal : </span>
                                                    <span>${calculateOrderSummary().subtotal.toFixed(2)}</span>
                                                </div> */}
                                                <div>
                                                    <span className="text-black">Total Savings : </span>
                                                    <span>-${calculateOrderSummary().discount.toFixed(2)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-black">Pre Tax Total After Discount : </span>
                                                    <span>${(calculateOrderSummary().discountedSubtotal || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {appliedPromotions.length > 0 && (
                                            <div className="text-xs text-gray-500 text-center">
                                                <Link href="/cart" className="text-blue-600 hover:underline">
                                                    ← Back to cart to modify promotions
                                                </Link>
                                            </div>
                                        )}

                                        <div className="flex justify-between">
                                            <span>Shipping</span>
                                            <span>
                                                {calculateOrderSummary().qualifiesForFreeShipping ? (
                                                    <span className="text-green-600 font-medium">FREE</span>
                                                ) : (
                                                    `$${calculateOrderSummary().shipping.toFixed(2)}`
                                                )}
                                            </span>
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

