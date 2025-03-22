"use client";

import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { createPayPalOrder, approvePayPalOrder } from "@/lib/actions/order.actions";

interface PayPalButtonsProps {
    orderId: string;
    totalAmount: number;
    onSuccess?: () => void;
}

// Component to show loading state for PayPal
function PayPalLoadingState() {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();

    if (isPending) {
        return <div className="text-sm text-muted-foreground py-2">Loading PayPal...</div>;
    }

    if (isRejected) {
        return <div className="text-sm text-red-500 py-2">Error loading PayPal. Please try again later.</div>;
    }

    return null;
}

export default function PayPalButtonsComponent({ orderId, totalAmount, onSuccess }: PayPalButtonsProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Function to create a PayPal order
    const handleCreateOrder = async () => {
        try {
            setIsProcessing(true);
            const response = await createPayPalOrder(orderId);

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

    // Function to handle PayPal approval
    const handleApproveOrder = async (data: { orderID: string }) => {
        try {
            setIsProcessing(true);
            const response = await approvePayPalOrder(orderId, data);

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
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

    return (
        <div className="py-2">
            <PayPalScriptProvider options={{
                clientId,
                currency: "USD",
                intent: "capture"
            }}>
                <PayPalLoadingState />

                <PayPalButtons
                    style={{
                        layout: "vertical",
                        color: "blue",
                        shape: "rect",
                        label: "pay"
                    }}
                    disabled={isProcessing}
                    forceReRender={[orderId, totalAmount, clientId]}
                    createOrder={handleCreateOrder}
                    onApprove={handleApproveOrder}
                    onError={(err) => {
                        console.error("PayPal error:", err);
                        toast.error("PayPal encountered an error. Please try again.");
                    }}
                />
            </PayPalScriptProvider>
        </div>
    );
} 