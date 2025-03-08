import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia', // Latest version
  typescript: true,
});

// Client-side Stripe promise
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Helper to format price for Stripe (converts to cents)
export const formatStripePrice = (price: number) => Math.round(price * 100);

// Helper to format price from Stripe (converts from cents)
export const formatPriceFromStripe = (price: number) => (price / 100).toFixed(2); 