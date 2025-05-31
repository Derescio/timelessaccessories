"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [orderId, setOrderId] = useState<string | null>(null);
    const isAuthenticated = status === 'authenticated';

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

                    <div className="flex flex-col gap-3 mt-6 w-full">
                        {isAuthenticated ? (
                            // Authenticated user options
                            <div className="flex gap-4">
                                <Link href="/user/account/orders" className="flex-1">
                                    <Button variant="outline" className="w-full">View Orders</Button>
                                </Link>
                                <Link href="/products" className="flex-1">
                                    <Button className="w-full">Continue Shopping</Button>
                                </Link>
                            </div>
                        ) : (
                            // Guest user options
                            <>
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                                    <p className="text-sm text-blue-800 font-medium mb-1">Want to track your order?</p>
                                    <p className="text-xs text-blue-700">Create an account to view order history and track shipments.</p>
                                </div>

                                <Link href="/sign-up">
                                    <Button className="w-full">Create Account</Button>
                                </Link>

                                <Link href="/products">
                                    <Button variant="outline" className="w-full">Continue Shopping</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
} 