"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Check } from "lucide-react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

interface PaymentMethodSelectorProps {
    orderId: string;
    totalAmount: number;
    onSuccess?: (paymentId: string) => void;
    onError?: (error: string) => void;
}

export default function PaymentMethodSelector({
    orderId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    totalAmount,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess,
    onError,
}: PaymentMethodSelectorProps) {
    const [selectedMethod, setSelectedMethod] = useState<string>(PAYMENT_METHODS[0]);
    const [isProcessing, setIsProcessing] = useState(false);

    const getMethodIcon = (method: string) => {
        switch (method) {
            case "Stripe":
                return <Icons.stripe className="h-5 w-5" />;
            case "PayPal":
                return <Icons.paypal className="h-5 w-5" />;
            case "COD":
                return <Icons.cash className="h-5 w-5" />;
            default:
                return <Icons.stripe className="h-5 w-5" />;
        }
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            // Redirect to confirmation page
            window.location.href = `/confirmation?orderId=${orderId}`;
        } catch (error) {
            setIsProcessing(false);
            const errorMessage = error instanceof Error ? error.message : "Payment processing error";
            if (onError) onError(errorMessage);
        }
    };

    return (
        <div className="space-y-4">
            <div className="mb-6">
                <RadioGroup
                    value={selectedMethod}
                    onValueChange={setSelectedMethod}
                    className="grid gap-3"
                >
                    {PAYMENT_METHODS.map((method) => (
                        <div
                            key={method}
                            className={`flex items-center space-x-2 border p-4 rounded-md cursor-pointer transition-colors ${selectedMethod === method
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/50"
                                }`}
                            onClick={() => setSelectedMethod(method)}
                        >
                            <RadioGroupItem value={method} id={method} />
                            <Label
                                htmlFor={method}
                                className="flex items-center justify-between w-full cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    {getMethodIcon(method)}
                                    <span className="font-medium">{method}</span>
                                </div>
                                {selectedMethod === method && (
                                    <Check className="h-5 w-5 text-primary" />
                                )}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full"
            >
                {isProcessing ? "Processing..." : "Continue to Payment"}
            </Button>
        </div>
    );
} 