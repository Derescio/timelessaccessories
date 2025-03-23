"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getLascoUserOrders, getUserOrders } from "@/lib/actions/user.actions"
import { formatPrice } from "@/lib/utils"
import { Loader2 } from "lucide-react"

// Define types for the order data from the API
interface OrderItem {
    id: string;
    name: string;
    price: string | number; // Can be string or number from DB
    quantity: number;
    image?: string | null;
}

interface Payment {
    id: string;
    status: string;
    provider: string;
    amount: string | number; // Can be string or number from DB
}

interface Order {
    id: string;
    status: string;
    createdAt: string | Date;
    total: string | number; // Can be string or number from DB
    subtotal: string | number;
    tax: string | number;
    shipping: string | number;
    items: OrderItem[];
    payment?: Payment | null;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchOrders() {
            try {
                setIsLoading(true)
                const data = process.env.NEXT_PUBLIC_MARKET === 'LASCO' ? await getLascoUserOrders() : await getUserOrders()
                console.log("Orders data:", data[0].shippingAddress)
                // Cast the fetched data to our Order type
                setOrders(data as Order[])
            } catch (error) {
                console.error("Error fetching orders:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrders()
    }, [])

    // Format the date to a readable string
    function formatDate(date: string | Date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    // Get the total number of items in an order
    function getTotalItems(items: OrderItem[]) {
        return items.reduce((sum, item) => sum + item.quantity, 0)
    }

    // Format the order status for display
    function formatStatus(status: string) {
        return status.charAt(0) + status.slice(1).toLowerCase()
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-light">ORDERS</h1>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-muted/30 rounded-lg p-12 text-center">
                    <h3 className="text-lg font-medium mb-2">No orders found</h3>
                    <p className="text-gray-500 mb-6">You haven&apos;t placed any orders yet.</p>
                    <Button asChild>
                        <Link href="/products">Continue Shopping</Link>
                    </Button>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="min-w-full">
                        <div className="bg-gray-50 border-b">
                            <div className="grid grid-cols-[1fr,1fr,1fr,1fr,auto] gap-4 px-6 py-3">
                                <div className="text-sm font-medium text-gray-500">ORDER</div>
                                <div className="text-sm font-medium text-gray-500">DATE</div>
                                <div className="text-sm font-medium text-gray-500">STATUS</div>
                                <div className="text-sm font-medium text-gray-500">TOTAL</div>
                                <div className="text-sm font-medium text-gray-500">ACTIONS</div>
                            </div>
                        </div>
                        <div className="divide-y">
                            {orders.map((order) => (
                                <div key={order.id} className="grid grid-cols-[1fr,1fr,1fr,1fr,auto] gap-4 px-6 py-4 items-center">
                                    <div className="text-sm">
                                        <span className="text-primary">
                                            #{order.id.substring(0, 8).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">{formatDate(order.createdAt)}</div>
                                    <div className="text-sm text-gray-600">{formatStatus(order.status)}</div>
                                    <div className="text-sm">
                                        {formatPrice(Number(order.total))} for {getTotalItems(order.items)} items
                                    </div>
                                    <div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={`/user/account/orders/${order.id}`}>
                                                VIEW
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

