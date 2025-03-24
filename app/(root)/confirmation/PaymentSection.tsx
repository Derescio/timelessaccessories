"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createPayPalOrder, approvePayPalOrder } from "@/lib/actions/order.actions";
import { cleanupCartAfterSuccessfulPayment } from "@/lib/actions/cart.actions";
import { updateOrderPaymentStatus } from "@/lib/actions/payment.actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    PayPalButtons,
    PayPalScriptProvider,
    usePayPalScriptReducer
} from "@paypal/react-paypal-js";
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle } from 'lucide-react';
import LascoPayButton from "@/components/checkout/LascoPayButton";
import { PaymentStatus } from "@prisma/client";
//import StripePayment from "./stripe/stripe-payment";
import StripePayment from "@/components/payment/StripePayment";
import { triggerCartUpdate } from "@/lib/utils";
//import { SERVER_URL } from "@/lib/constants";
//import Stripe from "stripe";

// Define the props interface with optional paymentMethod
interface PaymentSectionProps {
    orderId: string;
    totalAmount: number;
    paymentMethod?: string | { type: string };
}

export default function PaymentSection({ orderId, totalAmount, paymentMethod = "PayPal" }: PaymentSectionProps) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isPending, setIsPending] = useState(false); // New state for LascoPay pending status
    const [error, setError] = useState<string | null>(null);
    const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
    const [isStripeLoading] = useState(false);

    // Normalize payment method to handle variations
    const displayedPaymentMethod =
        typeof paymentMethod === 'object' && paymentMethod !== null
            ? paymentMethod.type || "PayPal"
            : paymentMethod || "PayPal";

    // Check if we have a valid order ID
    const hasValidOrderId = orderId && orderId !== "" && orderId !== "pending";

    // Effect to load Stripe payment intent when using Stripe
    // useEffect(() => {
    //     const loadStripePaymentIntent = async () => {
    //         if (displayedPaymentMethod === "Stripe" && hasValidOrderId) {
    //             setIsStripeLoading(true);
    //             try {
    //                 const result = await createStripePaymentIntent(orderId);
    //                 if (result.success && result.clientSecret) {
    //                     setStripeClientSecret(result.clientSecret);
    //                 } else if (result.requiresAuth) {
    //                     // Show authentication error
    //                     setError("Authentication required. Please log in to continue with payment.");
    //                     toast.error("Please log in to continue with payment", {
    //                         duration: 5000,
    //                     });
    //                 } else {
    //                     setError(result.message || "Failed to initialize Stripe payment");
    //                 }
    //             } catch (err) {
    //                 console.error("Error initializing Stripe payment:", err);
    //                 setError(err instanceof Error ? err.message : "Failed to initialize payment");
    //             } finally {
    //                 setIsStripeLoading(false);
    //             }
    //         }
    //     };

    //     loadStripePaymentIntent();
    // }, [displayedPaymentMethod, orderId, hasValidOrderId]);


    ///NEW METHOD
    useEffect(() => {
        const createStripePaymentIntent = async () => {
            if (displayedPaymentMethod === "Stripe" && hasValidOrderId) {
                try {
                    const response = await fetch("/api/payment/stripe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            amount: totalAmount * 100, // Amount in cents
                            orderId,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error("Failed to create payment intent.");
                    }
                    const { clientSecret } = await response.json();
                    setStripeClientSecret(clientSecret);
                } catch (error) {
                    console.error("Error creating Stripe Payment Intent:", error);
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Failed to create Stripe Payment Intent."
                    );
                }
            }
        };

        createStripePaymentIntent();
    }, [displayedPaymentMethod, hasValidOrderId, totalAmount, orderId]);
    // If we don't have a valid order ID, show an error message
    if (!hasValidOrderId) {
        return (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-center">
                <p className="text-yellow-700">Please confirm your order to proceed with payment.</p>
            </div>
        );
    }

    // PayPal client ID - in production this should come from an environment variable
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

    // Function to handle PayPal order creation
    const handleCreatePayPalOrder = async () => {
        try {
            // console.log("Creating PayPal order for orderId:", orderId);
            const result = await createPayPalOrder(orderId);

            if (result.success && result.data) {
                //  console.log("PayPal order created successfully:", result.data);
                return result.data;
            } else {
                throw new Error(result.message || "Failed to create PayPal order");
            }
        } catch (err) {
            console.error("Error creating PayPal order:", err);
            toast.error("Failed to create PayPal order. Please try again.");
            return "";
        }
    };

    // Function to handle PayPal payment approval
    const handleApprovePayPalOrder = async (data: { orderID: string }) => {
        setIsProcessing(true);
        try {
            //   console.log("Approving PayPal order:", data.orderID);
            const result = await approvePayPalOrder(orderId, data);

            if (result.success) {
                // console.log("PayPal payment approved successfully");
                setSuccess(true);

                // Clean up the cart after successful payment
                try {
                    const result = await cleanupCartAfterSuccessfulPayment(orderId);
                    //  console.log("Cart cleaned up successfully");
                    if (result.success) {
                        triggerCartUpdate()
                    }
                } catch (cleanupError) {
                    console.error("Error cleaning up cart:", cleanupError);
                    // Continue with success flow even if cart cleanup fails
                }

                toast.success("Payment completed successfully!");

                // Allow some time for the success message to be seen
                setTimeout(() => {
                    router.push(`/order-success?orderId=${orderId}`);
                }, 1500);
            } else {
                throw new Error(result.message || "Failed to approve PayPal payment");
            }
        } catch (err) {
            console.error("Error approving PayPal payment:", err);
            setError(err instanceof Error ? err.message : "Failed to process payment");
            toast.error("Failed to process payment. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Function to handle COD orders
    const handleCODOrder = () => {
        // For COD orders, also clean up the cart
        cleanupCartAfterSuccessfulPayment(orderId)
            .then(() => {
                //    console.log("Cart cleaned up successfully for COD order");
            })
            .catch((error) => {
                console.error("Error cleaning up cart for COD order:", error);
            })
            .finally(() => {
                router.push(`/order-success?orderId=${orderId}`);
            });
    };

    // Function to handle LascoPay redirect
    const handleLascoPayRedirect = async () => {
        // console.log('LascoPay button clicked. Checking for existing order...');
        setIsProcessing(true);

        try {
            // Check if we already have an order ID in localStorage
            const existingOrderId = localStorage.getItem("lascoPayOrderId");

            // If there's an existing order ID and it doesn't match the current one, 
            // it means we might be creating a duplicate order
            if (existingOrderId && existingOrderId !== orderId) {
                //  console.log("Found existing order ID:", existingOrderId, "Current order ID:", orderId);
                // console.log("Using existing order ID to prevent duplication");

                // Show toast and redirect using the existing order ID
                toast.success("Redirecting to payment page...", {
                    duration: 2000,
                    position: "top-center"
                });

                setTimeout(() => {
                    window.location.href = `https://pay.lascobizja.com/btn/YFxrwuD1qO9k?orderId=${existingOrderId}`;
                }, 1500);

                return;
            }

            // If we just created the order through the confirmation screen,
            // the payment is already in PENDING state, so we can skip this step
            const skipPaymentUpdate = localStorage.getItem("skipPaymentUpdate") === "true";

            // If not skipping payment update, update the payment record
            if (!skipPaymentUpdate) {
                // Double-check that the payment record is properly created
                const paymentUpdateResult = await updateOrderPaymentStatus({
                    orderId,
                    status: PaymentStatus.PENDING,
                    paymentMethod: "LascoPay"
                });

                if (!paymentUpdateResult.success) {
                    console.error("Failed to update payment status:", paymentUpdateResult.error);
                    toast.error("Could not process payment information. Please try again.");
                    setIsProcessing(false);
                    return;
                }

                //  console.log("Payment status updated to PENDING for LascoPay");
            } else {
                //   console.log("Skipping payment update as we just created the order");
                localStorage.removeItem("skipPaymentUpdate");
            }

            // Clean up the cart after order creation
            try {
                await cleanupCartAfterSuccessfulPayment(orderId);
                //   console.log("Cart cleaned up successfully");
            } catch (cleanupError) {
                console.error("Error cleaning up cart:", cleanupError);
                // Continue with the flow even if cart cleanup fails
            }

            // Set pending state to show success message
            setIsPending(true);

            // Show success toast message
            toast.success("Redirecting to payment page. You'll be able to view your order status in your account after payment.", {
                duration: 3000, // Shorter duration since we're just redirecting
                position: "top-center",
            });

            // Allow some time for the toast to be seen
            setTimeout(() => {
                //  console.log('Redirecting to LascoPay payment page...');
                window.location.href = `https://pay.lascobizja.com/btn/YFxrwuD1qO9k?orderId=${orderId}`;
            }, 2000); // Shorter timeout for redirection
        } catch (err) {
            console.error("Error processing LascoPay order:", err);
            setError(err instanceof Error ? err.message : "Failed to process payment");
            toast.error("Failed to process payment. Please try again.");
            setIsProcessing(false);
        }
    };

    // Function to handle successful Stripe payment
    // const handleStripeSuccess = async () => {
    //     // This function will be called by the Stripe payment success callback page
    //     // For now, we'll just clean up the cart and show success message
    //     setSuccess(true);

    //     try {
    //         await cleanupCartAfterSuccessfulPayment(orderId);
    //         // console.log("Cart cleaned up successfully after Stripe payment");
    //     } catch (cleanupError) {
    //         console.error("Error cleaning up cart after Stripe payment:", cleanupError);
    //     }

    //     toast.success("Payment completed successfully!");

    //     // Allow some time for the success message to be seen
    //     setTimeout(() => {
    //         router.push(`${SERVER_URL}/order/${orderId}/stripe-payment-success`,);
    //     }, 1500);
    // };

    // Function to handle login redirect
    const handleLoginRedirect = () => {
        // Save current page to redirect back after login
        if (typeof window !== 'undefined') {
            // Store the current URL to redirect back after login
            localStorage.setItem('loginRedirectUrl', window.location.href);
            // Redirect to login page
            router.push('/login');
        }
    };

    // Helper component to show loading state for PayPal
    function PayPalLoadingState() {
        const [{ isPending, isRejected }] = usePayPalScriptReducer();

        if (isPending) {
            return <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                <p>Loading PayPal...</p>
            </div>;
        }

        if (isRejected) {
            return <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">Failed to load PayPal. Please refresh the page or try another payment method.</p>
            </div>;
        }

        return null;
    }

    if (success) {
        return (
            <div className="p-6 bg-green-50 rounded-lg border border-green-200 text-center">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-xl font-medium text-green-800 mb-2">Payment Successful!</h3>
                <p className="text-green-700">Your order has been paid successfully. Redirecting to order confirmation...</p>
                {isProcessing && <Spinner className="mt-4 mx-auto" />}
            </div>
        );
    }

    // Show pending state for LascoPay
    if (isPending) {
        return (
            <div className="p-6 bg-green-50 rounded-lg border border-green-200 text-center">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-xl font-medium text-green-800 mb-2">Order Created!</h3>
                <p className="text-green-700 mb-2">Your order has been recorded successfully.</p>
                <p className="text-green-700">Redirecting to LascoPay to complete your payment...</p>
                {isProcessing && <Spinner className="mt-4 mx-auto" />}
            </div>
        );
    }

    if (error) {
        // Check if error is authentication related
        const isAuthError = error.includes('Authentication required') ||
            error.includes('Please log in');

        return (
            <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                <div className="flex justify-center mb-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="text-xl font-medium text-red-800 mb-2">Payment Error</h3>
                <p className="text-red-700 mb-4">{error}</p>

                {isAuthError ? (
                    <Button
                        variant="default"
                        className="w-full"
                        onClick={handleLoginRedirect}
                    >
                        Log in to continue
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setError(null)}
                    >
                        Try Again
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Card className="w-full mt-4">
            <CardHeader>
                <CardTitle>{displayedPaymentMethod} Payment</CardTitle>
            </CardHeader>
            <CardContent>
                {displayedPaymentMethod === "PayPal" && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600">
                                Complete your payment using PayPal&apos;s secure payment system.
                            </p>
                        </div>

                        <PayPalScriptProvider options={{
                            clientId: paypalClientId,
                            currency: "USD",
                            intent: "capture"
                        }}>
                            <PayPalLoadingState />
                            <PayPalButtons
                                createOrder={handleCreatePayPalOrder}
                                onApprove={handleApprovePayPalOrder}
                                style={{ layout: "vertical" }}
                                disabled={isProcessing}
                            />
                        </PayPalScriptProvider>
                    </div>
                )}

                {displayedPaymentMethod === "LascoPay" && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600">
                                Complete your payment using LascoPay&apos;s secure payment system.
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <LascoPayButton
                                onClick={handleLascoPayRedirect}
                                disabled={isProcessing}
                            />
                        </div>
                    </div>
                )}

                {displayedPaymentMethod === "Stripe" && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600">
                                Complete your payment using the Stripe secure payment system.
                            </p>
                        </div>

                        {isStripeLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                                <p>Initializing payment...</p>
                            </div>
                        ) : stripeClientSecret ? (
                            <StripePayment
                                priceInCents={Math.round(totalAmount * 100)}
                                orderId={orderId}
                                clientSecret={stripeClientSecret}

                            />
                        ) : (
                            <div className="p-4 bg-yellow-50 rounded-md">
                                <p className="text-yellow-700">
                                    {error || "Unable to initialize payment. Please try again or choose another payment method."}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {displayedPaymentMethod === "COD" && (
                    <div>
                        <p>Your order has been placed and will be delivered to your address.</p>
                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <h3 className="font-medium mb-2">Instructions:</h3>
                            <ul className="list-disc pl-5 text-sm">
                                <li>Have the exact amount ready for payment</li>
                                <li>The delivery person will collect payment upon arrival</li>
                                <li>A receipt will be provided upon payment</li>
                            </ul>
                        </div>
                        <Button
                            className="w-full mt-4"
                            onClick={handleCODOrder}
                        >
                            Confirm Order
                        </Button>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                    <p>Total Amount: ${totalAmount.toFixed(2)}</p>
                    <p>Order ID: {orderId}</p>
                </div>
            </CardFooter>
        </Card>
    );
} 