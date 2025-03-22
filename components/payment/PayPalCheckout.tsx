"use client";

import { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";

interface PayPalCheckoutProps {
    orderId: string;
    totalAmount: number;
    onSuccess: (paypalOrderId: string) => void;
}

// Define a type for the PayPal order data structure
interface PayPalOrderResponseData {
    orderID: string;
    [key: string]: unknown;
}

export default function PayPalCheckout({ orderId, totalAmount, onSuccess }: PayPalCheckoutProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPaid, setIsPaid] = useState(false);

    // Get client ID from environment variable
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
    console.log("Using PayPal client ID from env variable");

    // Reset error state when component mounts or key props change
    useEffect(() => {
        setError(null);
        setIsPaid(false);

        // Clean up function to handle component unmounting
        return () => {
            // This ensures any pending operations are properly cleaned up
            if (isLoading) {
                console.log("PayPal checkout component unmounted during transaction");
            }
        };
    }, [orderId, totalAmount, isLoading]);

    // Handle window communication errors globally
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            // Only handle PayPal related errors
            if (event.message?.includes('paypal') || event.error?.toString().includes('paypal')) {
                console.error("PayPal error intercepted:", event);
                // Don't show these specific errors to users as they're often just 
                // communication errors that don't affect the payment
                if (!event.message?.includes('postrobot_method') &&
                    !event.message?.includes('Target window is closed')) {
                    setError("Payment service communication error. Please check if payment was completed.");
                }
            }
        };

        window.addEventListener('error', handleError);

        return () => {
            window.removeEventListener('error', handleError);
        };
    }, []);

    const createPayPalOrder = async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log(`Creating PayPal order for order: ${orderId}`);
            const response = await fetch(`/api/payment/paypal/create-order?orderId=${orderId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create PayPal order");
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Failed to create PayPal order");
            }

            console.log("PayPal order created:", data.data);
            return data.data; // This is the PayPal order ID
        } catch (error) {
            console.error("Error creating PayPal order:", error);
            setError(`Payment initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Type-safe version using our interface
    const onApprove = async (data: PayPalOrderResponseData) => {
        setIsLoading(true);

        try {
            console.log("Payment approved:", data);

            const response = await fetch(`/api/payment/paypal/capture`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId: orderId,
                    paypalOrderId: data.orderID,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Payment capture failed: ${errorText}`);
            }

            const captureData = await response.json();

            if (!captureData.success) {
                throw new Error(captureData.message || "Payment capture failed");
            }

            console.log("Payment captured successfully");
            setIsPaid(true);
            onSuccess(data.orderID);
            toast.success("Payment completed successfully!");

        } catch (error) {
            console.error("Error capturing payment:", error);
            setError(`Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            toast.error("Payment processing failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // If the component is still mounted but we lost connection with PayPal
    const onError = (err: Record<string, unknown>) => {
        // Don't set error state for communication errors that might be false positives
        if (typeof err.message === 'string' &&
            !err.message.includes('postrobot_method') &&
            !err.message.includes('Target window is closed')) {
            console.error("PayPal error:", err);
            setError("Payment failed. Please try again.");
            toast.error("Payment service error. Please try again.");
        } else {
            // Just log communication errors but don't show to user
            console.warn("PayPal communication error (may be harmless):", err);
        }
        setIsLoading(false);
    };

    const onCancel = () => {
        console.log("Payment cancelled by user");
        setIsLoading(false);
        toast.info("Payment cancelled");
    };

    if (error) {
        return (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                <p>Error: {error}</p>
                <button
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() => setError(null)}
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (isPaid) {
        return (
            <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
                <p>Payment successful! Processing your order...</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {isLoading && (
                <div className="mb-4 text-center">
                    <p className="text-sm text-gray-600">Processing payment, please wait...</p>
                    <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="animate-pulse h-full bg-blue-600 rounded-full"></div>
                    </div>
                </div>
            )}

            <PayPalScriptProvider options={{
                clientId: clientId,
                currency: "USD",
                intent: "capture",
                components: "buttons",
                "disable-funding": "credit,card"
            }}>
                <PayPalButtons
                    style={{ layout: "vertical", shape: "rect" }}
                    createOrder={createPayPalOrder}
                    onApprove={onApprove}
                    onCancel={onCancel}
                    onError={onError}
                    disabled={isLoading}
                />
            </PayPalScriptProvider>
        </div>
    );
} 