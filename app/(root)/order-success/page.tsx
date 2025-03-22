"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        // Get order ID from URL if available, otherwise from localStorage
        const urlOrderId = searchParams.get('orderId');
        const storedCheckoutData = localStorage.getItem('checkoutData');

        if (urlOrderId) {
            setOrderId(urlOrderId);
        } else if (storedCheckoutData) {
            try {
                const checkoutData = JSON.parse(storedCheckoutData);
                if (checkoutData.orderId) {
                    setOrderId(checkoutData.orderId);
                }
            } catch (error) {
                console.error("Error parsing checkout data:", error);
            }
        }

        // Clear checkout data from localStorage after order completion
        localStorage.removeItem('checkoutData');
    }, [searchParams]);

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="max-w-lg mx-auto p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <h1 className="text-2xl font-semibold">Order Placed Successfully!</h1>
                    <p className="text-muted-foreground">
                        Thank you for your order. We&apos;ll send you a confirmation email with your order details.
                    </p>

                    {orderId && (
                        <div className="mt-4 p-4 bg-gray-50 w-full rounded-md">
                            <p className="text-sm text-gray-700">Order ID: <span className="font-medium">{orderId}</span></p>
                        </div>
                    )}

                    <div className="flex gap-4 mt-6">
                        <Link href="/orders">
                            <Button variant="outline">View Orders</Button>
                        </Link>
                        <Link href="/products">
                            <Button>Continue Shopping</Button>
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
} 