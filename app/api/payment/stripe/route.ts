import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-24.acacia",
});

// Validation schema for payment intent creation
const paymentIntentSchema = z.object({
    amount: z.number().positive().min(50), // Minimum $0.50 (50 cents)
    orderId: z.string().min(1, "Order ID is required"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Validate input
        const validation = paymentIntentSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { amount, orderId } = validation.data;

        // Verify order exists
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                total: true,
                status: true,
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Verify amount matches order total (allow small rounding differences)
        const orderTotalInCents = Math.round(Number(order.total) * 100);
        const requestedAmountInCents = Math.round(amount);
        const amountDifference = Math.abs(orderTotalInCents - requestedAmountInCents);
        
        // Allow up to 1 cent difference for rounding
        if (amountDifference > 1) {
            return NextResponse.json(
                { error: "Amount does not match order total" },
                { status: 400 }
            );
        }

        // Ensure the amount is an integer (in cents)
        const amountInCents = Math.round(amount);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: "usd",
            metadata: { orderId },
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Error creating payment intent:", error);
        
        // Don't expose internal error details
        if (error instanceof Stripe.errors.StripeError) {
            return NextResponse.json(
                { error: "Payment processing error" },
                { status: 500 }
            );
        }
        
        return NextResponse.json(
            { error: "Failed to create payment intent" },
            { status: 500 }
        );
    }
}
