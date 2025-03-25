// import NotFound from "@/app/not-found";
// import { Button } from "@/components/ui/button";
// import { getOrderById } from "@/lib/actions/user.actions";
// import Link from "next/link";
// import { redirect } from "next/navigation";
// import Stripe from "stripe"


// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

// const SuccessPage = async (props: {
//     params: Promise<{ id: string }>
//     ; searchParams: Promise<{ payment_intent: string }>
// }) => {

//     const { id } = await props.params;
//     const { payment_intent: paymentIntentId } = await props.searchParams;

//     //Fetch the order by id
//     const order = await getOrderById(id);
//     if (!order) return <NotFound />;

//     //Retrieve the payment intent
//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

//     //Check if the payment intent is succeeded
//     if (paymentIntent.metadata.orderId == null || !order.data || paymentIntent.metadata.orderId !== order.data.id.toString()) {
//         return <NotFound />
//     }

//     //Check if the payment intent is succeeded
//     const isSuccess = paymentIntent.status === 'succeeded';

//     if (!isSuccess) {
//         return redirect(`/}`)
//     }



//     return (
//         <div className="max-w-4xl mx-auto w-full space-y-8">
//             <div className="flex flex-col gap-6 items-center">
//                 <h1 className="bold">Thanks for your purchase</h1>
//                 <p>Your order has been successfully placed and is being processed.</p>
//                 <Button asChild>
//                     <Link href={`/user/orders`} className="w-full">View Order</Link>

//                 </Button>
//             </div>
//         </div>
//     )
// }

// export default SuccessPage;


import NotFound from "@/app/not-found";
import { Button } from "@/components/ui/button";
import { getOrderById } from "@/lib/actions/user.actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

const SuccessPage = async (props: {
    params: Promise<{ id: string }>
    ; searchParams: Promise<{ payment_intent: string }>
}) => {

    const { id } = await props.params;
    const { payment_intent: paymentIntentId } = await props.searchParams;


    if (!paymentIntentId) {
        console.error("Missing payment_intent in query parameters.");
        return <NotFound />;
    }

    // Fetch the order by id
    const orderResult = await getOrderById(id);
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
                <h1 className="text-3xl font-bold">Thanks for your purchase</h1>
                <p>Your order has been successfully placed and is being processed.</p>
                <Button asChild>
                    <Link href={`/user/account/orders`} className="w-full">
                        View Order
                    </Link>
                </Button>
            </div>
        </div>
    );
};

export default SuccessPage;