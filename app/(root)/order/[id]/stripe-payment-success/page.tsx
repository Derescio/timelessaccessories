import NotFound from "@/app/not-found";
import { Button } from "@/components/ui/button";
import { getOrderById } from "@/lib/actions/user.actions";
import { getOrderWithItems } from "@/lib/actions/order.actions";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import Stripe from "stripe";
import { auth } from "@/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export default async function StripePaymentSuccessPage(props: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ payment_intent: string }>
}) {
    const { id } = await props.params;
    const { payment_intent: paymentIntentId } = await props.searchParams;

    console.log('💳 Payment Success Page - Accessed for order:', id);

    const session = await auth();
    const isAuthenticated = !!session?.user;

    console.log('💳 Payment Success Page - User authenticated:', isAuthenticated);
    console.log('💳 Payment Success Page - User ID:', session?.user?.id || 'Guest');

    if (!paymentIntentId) {
        console.error("💳 Payment Success Page - Missing payment_intent in query parameters");
        return <NotFound />;
    }

    try {
        console.log('💳 Payment Success Page - Fetching order details');

        // Fetch the order by id - use different functions based on authentication
        let orderResult;
        if (isAuthenticated) {
            orderResult = await getOrderById(id);
        } else {
            // For guest users, use the general order function that doesn't require authentication
            orderResult = await getOrderWithItems(id);
        }

        if (!orderResult.success || !orderResult.data) {
            console.error('💳 Payment Success Page - Order not found:', id);
            return <NotFound />;
        }

        const order = orderResult.data;

        console.log('💳 Payment Success Page - Order found:', {
            id: order.id,
            total: order.total
        });

        // Retrieve the payment intent
        console.log('💳 Payment Success Page - Retrieving payment intent');
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // Check if the payment intent is for this order
        if (paymentIntent.metadata.orderId == null || paymentIntent.metadata.orderId !== order.id.toString()) {
            console.error('💳 Payment Success Page - Payment intent order ID mismatch');
            return <NotFound />;
        }

        // Check if the payment intent is succeeded
        const isSuccess = paymentIntent.status === "succeeded";
        console.log('💳 Payment Success Page - Payment status:', paymentIntent.status);

        if (!isSuccess) {
            console.log('💳 Payment Success Page - Payment not successful, redirecting');
            return redirect(`/order/${order.id}`);
        }

        console.log('💳 Payment Success Page - Payment successful, rendering success page');

        return (
            <div className="max-w-4xl mx-auto w-full space-y-8">
                <div className="flex flex-col gap-6 items-center">
                    <h1 className="text-3xl font-bold">Thanks for your purchase!</h1>
                    <p>Your order has been successfully placed and is being processed.</p>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 w-full max-w-md">
                        <h3 className="font-semibold text-green-800 mb-2">Order Details</h3>
                        <p className="text-green-700">Order ID: {order.id}</p>
                        <p className="text-green-700">Total: ${typeof order.total === 'number' ? order.total.toFixed(2) : parseFloat(order.total).toFixed(2)}</p>
                        {('guestEmail' in order) && order.guestEmail && (
                            <p className="text-green-700">Confirmation sent to: {order.guestEmail}</p>
                        )}
                    </div>

                    {isAuthenticated ? (
                        <Button asChild>
                            <Link href={`/user/account/orders`} className="w-full">
                                View Your Orders
                            </Link>
                        </Button>
                    ) : (
                        <div className="flex flex-col gap-3 w-full max-w-md">
                            <p className="text-center text-sm text-muted-foreground">
                                Want to track your order and save your preferences?
                            </p>
                            <Button asChild>
                                <Link href={`/sign-up`} className="w-full">
                                    Create Account
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={`/`} className="w-full">
                                    Continue Shopping
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error('💳 Payment Success Page - Error:', error);
        return <NotFound />;
    }
}