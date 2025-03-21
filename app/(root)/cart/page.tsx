import { Suspense } from 'react';
import CartPageContent from '@/components/cart/CartPageContent';
import CartPageSkeleton from '@/components/cart/CartPageSkeleton';
import { Metadata } from 'next';
import ProgressSteps from '@/components/cart/cart-progress-steps';

export const metadata: Metadata = {
    title: 'Your Cart - Timeless Accessories',
    description: 'View and manage your shopping cart',
}

export default function CartPage() {
    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
            <ProgressSteps currentStep={1} />
            <Suspense fallback={<CartPageSkeleton />}>
                <CartPageContent />
            </Suspense>
        </div>
    );
} 