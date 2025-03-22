"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StripePaymentProviderProps {
    orderId: string;
    totalAmount: number;
    onSuccess?: (paymentId: string) => void;
    onError?: (error: string) => void;
}

export default function StripePaymentProvider({
    orderId,
    totalAmount,
    onSuccess,
    onError,
}: StripePaymentProviderProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            // In a real application, this would redirect to Stripe checkout
            // or render Stripe Elements for payment

            // Simulating a successful payment for demonstration
            const response = await fetch("/api/payments/stripe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId,
                    amount: totalAmount,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Payment failed");
            }

            toast.success("Payment successful", {
                description: "Your order has been placed successfully!"
            });

            if (onSuccess) {
                onSuccess(data.paymentId);
            }
        } catch (error) {
            console.error("Stripe payment error:", error);
            toast.error("Payment failed", {
                description: error instanceof Error ? error.message : "An error occurred during payment"
            });

            if (onError) {
                onError(error instanceof Error ? error.message : "Payment processing error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-medium text-sm text-slate-900 mb-2">Secure payment with Stripe</h3>
                <p className="text-sm text-slate-500">
                    Your payment information is processed securely. We do not store your credit card details.
                </p>
            </div>

            <Button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full"
            >
                {isLoading ? "Processing..." : `Pay $${totalAmount.toFixed(2)}`}
            </Button>
        </div>
    );
} 