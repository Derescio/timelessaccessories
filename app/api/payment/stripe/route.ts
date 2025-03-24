
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-24.acacia",
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, orderId } = body;

        // Ensure the amount is an integer (in cents)
        const amountInCents = Math.round(amount);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: "usd",
            metadata: { orderId },
        });
        // Log the full response from Stripe
        console.log("Stripe Payment Intent Response:", paymentIntent);

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Error creating payment intent:", error);
        return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
    }
}
