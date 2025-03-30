"use client";

import { useEffect, useState, use } from "react";
import { getOrderById, updateOrderStatus } from "@/lib/actions/order.actions";
import { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Define proper interface for the order object
interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    inventory?: {
        sku: string;
    };
}

interface Order {
    id: string;
    status: OrderStatus;
    createdAt: string | Date;
    updatedAt: string | Date;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    user: {
        id: string;
        name: string;
        email: string;
    };
    items: OrderItem[];
    payment?: {
        id: string;
        provider: string;
        status: string;
    } | null;
    shippingAddress: Record<string, string | undefined>;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode?: string;
        country: string;
    } | null;
}

interface OrderDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
    const resolvedParams = use(params);
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const response = await getOrderById(resolvedParams.id);

                if (response.success && response.data) {
                    setOrder(response.data as Order);
                } else {
                    toast.error(response.error || "Failed to fetch order");
                }
            } catch (error) {
                toast.error("An error occurred while fetching order" + error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [resolvedParams.id]);

    const handleStatusChange = async (newStatus: OrderStatus) => {
        try {
            const response = await updateOrderStatus({
                id: resolvedParams.id,
                status: newStatus,
            });

            if (response.success) {
                toast.success("Order status updated successfully");
                setOrder(response.data as Order);
            } else {
                toast.error(response.error || "Failed to update order status");
            }
        } catch (error) {
            toast.error("An error occurred while updating order status" + error);
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING:
                return "bg-yellow-500";
            case OrderStatus.PROCESSING:
                return "bg-blue-500";
            case OrderStatus.SHIPPED:
                return "bg-purple-500";
            case OrderStatus.DELIVERED:
                return "bg-green-500";
            case OrderStatus.CANCELLED:
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    if (loading) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/orders">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Loading...</h2>
                        <p className="text-muted-foreground">Please wait while we fetch the order details</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/orders">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Order Not Found</h2>
                        <p className="text-muted-foreground">The order you are looking for does not  exist</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/orders">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Order Details</h2>
                    <p className="text-muted-foreground">Order ID: {order.id}</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <Select value={order.status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue>
                                        <Badge className={getStatusColor(order.status)}>
                                            {order.status}
                                        </Badge>
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
                                    <SelectItem value={OrderStatus.PROCESSING}>Processing</SelectItem>
                                    <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
                                    <SelectItem value={OrderStatus.DELIVERED}>Delivered</SelectItem>
                                    <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Date</span>
                            <span>{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Customer</span>
                            <span>{order.user.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Email</span>
                            <span>{order.user.email}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Tax</span>
                            <span>${order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Shipping</span>
                            <span>${order.shipping.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between font-bold">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {order.items.map((item: OrderItem) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between border-b pb-4 last:border-0"
                            >
                                <div className="flex items-center gap-4">
                                    {item.image && (
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            className="h-16 w-16 rounded-md object-cover"
                                            width={64}
                                            height={64}
                                        />
                                    )}
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            SKU: {item.inventory?.sku}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">${item.price.toFixed(2)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Quantity: {item.quantity}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {order.address ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p>{order.address.street}</p>
                            <p>
                                {order.address.city}, {order.address.state} {order.address.postalCode || ''}
                            </p>
                            <p>{order.address.country}</p>
                        </div>
                    </CardContent>
                </Card>
            ) : order.shippingAddress ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(order.shippingAddress)
                                .filter(([, value]) => value)
                                .map(([key, value]) => (
                                    <p key={key}>{value}</p>
                                ))
                            }
                        </div>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
} 