'use client'

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ShippingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isGuestCheckout = searchParams.get('guest') === 'true';

    useEffect(() => {
        // Only redirect if not loading, not authenticated, and not guest checkout
        if (status !== 'loading' && !session && !isGuestCheckout) {
            router.push("/sign-in?callbackUrl=/shipping&message=Please sign in to continue with checkout");
        }
    }, [session, status, isGuestCheckout, router]);

    // Show loading state while checking authentication
    if (status === 'loading') {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center min-h-[400px]">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // Render children for authenticated users or guest checkout
    return <>{children}</>;
} 