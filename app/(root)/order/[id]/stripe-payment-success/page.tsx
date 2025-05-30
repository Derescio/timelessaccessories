import NotFound from "@/app/not-found";
import { Button } from "@/components/ui/button";
import { getOrderById } from "@/lib/actions/user.actions";
import { getOrderWithItems } from "@/lib/actions/order.actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { auth } from "@/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

const SuccessPage = async (props: {
    params: Promise<{ id: string }>
    ; searchParams: Promise<{ payment_intent: string }>
}) => {

    const { id } = await props.params;
    const { payment_intent: paymentIntentId } = await props.searchParams;

    // Check if user is authenticated
    const session = await auth();
    const isAuthenticated = !!session?.user;

    if (!paymentIntentId) {
        console.error("Missing payment_intent in query parameters.");
        return <NotFound />;
    }

    // Fetch the order by id - use different functions based on authentication
    let orderResult;
    if (isAuthenticated) {
        orderResult = await getOrderById(id);
    } else {
        // For guest users, use the general order function that doesn't require authentication
        orderResult = await getOrderWithItems(id);
    }

    if (!orderResult.success || !orderResult.data) return <NotFound />;

    const order = orderResult.data;

    // Retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if the payment intent is for this order
    if (paymentIntent.metadata.orderId == null || paymentIntent.metadata.orderId !== order.id.toString()) {
        return <NotFound />;
    }

    // Check if the payment intent is succeeded
    const isSuccess = paymentIntent.status === "succeeded";

    if (!isSuccess) {
        return redirect(`/order/${order.id}`);
    }

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
};

export default SuccessPage;