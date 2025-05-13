'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to console for debugging
        //console.error('Confirmation page error:', error);

        // Specifically look for PayPal-related errors
        const isPayPalError = error.message?.includes('paypal') ||
            error.message?.includes('postrobot') ||
            error.stack?.includes('paypal');

        if (isPayPalError) {
            console.warn('PayPal communication error detected in error boundary');
        }
    }, [error]);

    // Check if this is likely a PayPal window communication error
    const isPayPalWindowError = error.message?.includes('Target window is closed') ||
        error.message?.includes('postrobot_method');

    return (
        <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center mb-4">
                    <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
                    <h2 className="text-lg font-semibold text-red-700">
                        {isPayPalWindowError
                            ? 'Payment Processing Issue'
                            : 'Something went wrong'}
                    </h2>
                </div>

                <div className="text-sm text-gray-700 mb-6">
                    {isPayPalWindowError ? (
                        <p>
                            We had trouble communicating with the payment service. This sometimes happens
                            when a payment window is closed before the process completes.
                            <br /><br />
                            <strong>Your payment may have still gone through.</strong> Please check your email
                            or account for confirmation before trying again.
                        </p>
                    ) : (
                        <p>
                            An unexpected error occurred while processing your order.
                            Our team has been notified of this issue.
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/cart'}
                        className="w-full"
                    >
                        Return to Cart
                    </Button>
                    <Button
                        onClick={reset}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        </div>
    );
} 