"use client";

import { useState, useEffect } from "react";
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { createPayPalOrder, approvePayPalOrder } from "@/lib/actions/order.actions";

interface PayPalCheckoutProps {
    orderId: string;
    totalAmount: number;
    onSuccess?: () => void;
}

// Component to show loading state for PayPal
function PayPalLoadingState() {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();
    console.log("PayPal script reducer state:", { isPending, isRejected });

    let status = '';
    if (isPending) {
        status = 'Loading PayPal...';
    } else if (isRejected) {
        status = 'Error in loading PayPal.';
    }
    return status;
}

export default function PayPalCheckout({ orderId, totalAmount, onSuccess }: PayPalCheckoutProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Add effect to log when component mounts
    useEffect(() => {
        console.log("PayPalCheckout component mounted", { orderId, totalAmount });

        // Check if the environment variable is available
        console.log("PayPal client ID:", process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? "Available" : "Not available");
    }, [orderId, totalAmount]);

    const handleCreateOrder = async () => {
        try {
            console.log("Creating PayPal order for orderId:", orderId);
            setIsProcessing(true);
            const response = await createPayPalOrder(orderId);
            console.log("PayPal order creation response:", response);

            if (!response.success || !response.data) {
                toast.error(response.message || "Failed to create PayPal order");
                throw new Error(response.message || "Failed to create PayPal order");
            }

            return response.data;
        } catch (error) {
            console.error("Error creating PayPal order:", error);
            toast.error("Failed to initialize PayPal. Please try again.");
            throw new Error("PayPal initialization failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApproveOrder = async (data: { orderID: string }) => {
        try {
            console.log("Approving PayPal order:", data.orderID);
            setIsProcessing(true);
            const response = await approvePayPalOrder(orderId, data);
            console.log("PayPal approval response:", response);

            if (!response.success) {
                toast.error(response.message || "Failed to process payment");
                return;
            }

            toast.success(response.message || "Payment successful!");

            if (onSuccess) {
                onSuccess();
            }

            // Redirect if provided in the response
            if (response.redirectTo) {
                window.location.href = response.redirectTo;
            }
        } catch (error) {
            console.error("Error approving PayPal payment:", error);
            toast.error("Payment processing failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Get client ID from environment variable
    // HARDCODE FOR TESTING - USE YOUR ACTUAL CLIENT ID INSTEAD OF SANDBOX
    const clientId = "AQB2OjTPdbWx7DCCODYKB4vcnGg8dczEO8accLkoCBBiiy3nnQoxoImZ00n5c6BsEWE7QkFkQ9-uCXO_";
    console.log("Using hardcoded PayPal client ID for testing");

    return (
        <div className="py-2">
            <div className="mb-2 p-2 bg-gray-100 text-xs rounded">
                Debug Info: PayPal component with ID: {clientId.substring(0, 10)}...
            </div>
            <PayPalScriptProvider
                options={{
                    clientId,
                    components: "buttons",
                    currency: "USD"
                }}
            >
                <PayPalLoadingState />
                <div className="my-2 p-2 bg-gray-100 text-xs rounded">Inside PayPalScriptProvider</div>
                <PayPalButtons
                    style={{
                        color: "blue",
                        layout: "vertical",
                        shape: "rect",
                        label: "pay"
                    }}
                    forceReRender={[orderId, totalAmount, clientId]}
                    disabled={isProcessing}
                    createOrder={handleCreateOrder}
                    onApprove={handleApproveOrder}
                    onInit={() => {
                        console.log("PayPal buttons initialized");
                    }}
                    onError={(err) => {
                        console.error("PayPal error:", err);
                        toast.error("PayPal encountered an error. Please try again.");
                    }}
                />
            </PayPalScriptProvider>
        </div>
    );
} 