"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function OrderSuccessPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="max-w-lg mx-auto p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <h1 className="text-2xl font-semibold">Order Placed Successfully!</h1>
                    <p className="text-muted-foreground">
                        Thank you for your order. We&apos;ll send you a confirmation email with your order details.
                    </p>
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