"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CodPaymentProviderProps {
    orderId: string;
    totalAmount: number;
    onSuccess?: (paymentId: string) => void;
    onError?: (error: string) => void;
}

export default function CodPaymentProvider({
    orderId,
    totalAmount,
    onSuccess,
    onError,
}: CodPaymentProviderProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const handlePayment = async () => {
        if (!termsAccepted) {
            toast.error("Terms not accepted", {
                description: "Please accept the terms to continue with Cash on Delivery"
            });
            return;
        }

        setIsLoading(true);
        try {
            // Process the Cash on Delivery (COD) order
            const response = await fetch("/api/payments/cod", {
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
                throw new Error(data.message || "Order processing failed");
            }

            toast.success("Order confirmed", {
                description: "Your order has been placed successfully!"
            });

            if (onSuccess) {
                onSuccess(data.paymentId);
            }
        } catch (error) {
            console.error("COD order error:", error);
            toast.error("Order failed", {
                description: error instanceof Error ? error.message : "An error occurred while processing your order"
            });

            if (onError) {
                onError(error instanceof Error ? error.message : "Order processing error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-md">
                <h3 className="font-medium text-sm text-amber-900 mb-2">Cash on Delivery</h3>
                <p className="text-sm text-amber-700">
                    Pay with cash upon delivery. Please have the exact amount ready.
                </p>
            </div>

            <div className="flex items-start space-x-2 my-4">
                <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <Label
                    htmlFor="terms"
                    className="text-sm text-gray-600 leading-tight cursor-pointer"
                >
                    I understand that I will need to pay the full amount of ${totalAmount.toFixed(2)} in cash when my order is delivered.
                </Label>
            </div>

            <Button
                onClick={handlePayment}
                disabled={isLoading || !termsAccepted}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
                {isLoading ? "Processing..." : (
                    <span className="flex items-center justify-center gap-2">
                        <Icons.cash className="h-5 w-5 text-white" />
                        <span>Place Order (Pay on Delivery)</span>
                    </span>
                )}
            </Button>
        </div>
    );
} 