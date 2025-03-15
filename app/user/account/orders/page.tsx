"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"

interface Order {
    id: string
    number: string
    date: string
    status: string
    total: string
    items: number
}

const orders: Order[] = [
    {
        id: "1",
        number: "#2416",
        date: "October 1, 2023",
        status: "On hold",
        total: "$1,200.65",
        items: 3,
    },
    {
        id: "2",
        number: "#2417",
        date: "October 2, 2023",
        status: "On hold",
        total: "$1,200.65",
        items: 3,
    },
    {
        id: "3",
        number: "#2418",
        date: "October 3, 2023",
        status: "On hold",
        total: "$1,200.65",
        items: 3,
    },
    {
        id: "4",
        number: "#2419",
        date: "October 4, 2023",
        status: "On hold",
        total: "$1,200.65",
        items: 3,
    },
]

export default function OrdersPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-light">ORDERS</h1>

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
                                    <Link href={`/account/orders/${order.number}`} className="text-primary hover:underline">
                                        {order.number}
                                    </Link>
                                </div>
                                <div className="text-sm text-gray-600">{order.date}</div>
                                <div className="text-sm text-gray-600">{order.status}</div>
                                <div className="text-sm">
                                    {order.total} for {order.items} items
                                </div>
                                <div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            // Handle view order
                                        }}
                                    >
                                        VIEW
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

