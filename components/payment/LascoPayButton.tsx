"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { savePaymentResult } from "@/lib/actions/payment.actions"
import { toast } from "sonner"

interface LascoPayButtonProps {
    orderId: string
    totalAmount: number
    externalRedirect?: boolean
    onSuccess?: (paymentId: string) => void
    onError?: (error: string) => void
}

export function LascoPayButton({
    orderId,
    totalAmount,
    externalRedirect = false,
    onSuccess,
    onError,
}: LascoPayButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handlePayment = async () => {
        try {
            setIsLoading(true)

            if (externalRedirect) {
                // This simulates redirecting to an external payment gateway
                // In a real implementation, you would redirect to LascoPay's payment page
                // e.g., window.location.href = `https://pay.lascobizja.com/payment/${orderId}?amount=${totalAmount}`;

                // For the demo, we'll simulate the redirect and completion
                await new Promise((resolve) => setTimeout(resolve, 500))

                // Instead of actual redirect, store in localStorage that we're in external payment flow
                localStorage.setItem('lascoPayment', JSON.stringify({
                    orderId,
                    totalAmount,
                    timestamp: new Date().toISOString()
                }))

                // Simulate redirect to external page
                window.location.href = `/order-success?simulation=true&orderId=${orderId}`
                return
            }

            // If not redirecting externally, process payment locally (simulation)
            await new Promise((resolve) => setTimeout(resolve, 2000))

            // Generate a mock payment ID
            const paymentId = `lascoPay_${Date.now()}_${Math.floor(Math.random() * 1000)}`

            // Save the payment result to the database
            await savePaymentResult({
                orderId,
                paymentId,
                paymentProvider: "lascoPay",
                amount: totalAmount,
                status: "completed",
                details: JSON.stringify({
                    transactionId: paymentId,
                    timestamp: new Date().toISOString(),
                    processor: "LascoPay",
                    currency: "USD"
                })
            })

            // Show success message
            toast.success("Payment successful! Your order has been placed.")

            // Call the success callback if provided
            if (onSuccess) {
                onSuccess(paymentId)
            }

            // Redirect to the order success page
            router.push(`/order-success?orderId=${orderId}`)
        } catch (error) {
            console.error("Payment failed:", error)
            toast.error("Payment failed. Please try again.")

            // Call the error callback if provided
            if (onError) {
                onError(error instanceof Error ? error.message : String(error))
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={handlePayment}
                        disabled={isLoading}
                        className="w-full bg-[#4a154b] hover:bg-[#611f64] text-white"
                        size="lg"
                    >
                        {isLoading ? "Processing..." : "Pay with LascoPay"}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Secure payment with LascoPay</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
} 