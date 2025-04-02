'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCart } from '@/lib/actions/cart.actions';

export default function CartCount() {
    const [itemCount, setItemCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCartCount = async () => {
            // console.log('Fetching cart count...');
            setIsLoading(true);
            try {
                const cart = await getCart();
                // console.log('Cart data received:', cart);

                if (cart && typeof cart.itemCount === 'number') {
                    console.log(`Setting item count to ${cart.itemCount}`);
                    setItemCount(cart.itemCount);
                } else {
                    // console.log('No valid cart or itemCount found, setting count to 0');
                    setItemCount(0);
                }
            } catch (error) {
                console.error('Error fetching cart:', error);
                setItemCount(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCartCount();

        // Update cart count when cart is updated
        const handleCartUpdate = () => {
            fetchCartCount();
        };

        window.addEventListener('cart-updated', handleCartUpdate);
        return () => {
            window.removeEventListener('cart-updated', handleCartUpdate);
        };
    }, []);

    //console.log('CartCount rendering with count:', itemCount);

    return (
        <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {!isLoading && itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[11px] font-medium text-primary-foreground flex items-center justify-center">
                        {itemCount > 99 ? '99+' : itemCount}
                    </span>
                )}
            </Link>
        </Button>
    );
} 