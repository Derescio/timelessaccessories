"use client";

import { useEffect, useState, use } from "react";
import { getOrderById, updateOrderStatus } from "@/lib/actions/order.actions";
import { getAttributeNamesByIds } from "@/lib/actions/product.actions";
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
import { Input } from "@/components/ui/input";

// Define proper interface for the order object
interface OrderItem {
    id: string;
    name: string;
    price: string | number;
    quantity: number;
    image?: string | null;
    attributes?: Record<string, string>;
    inventory: {
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
    } | null;
    guestEmail?: string;
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
    trackingNumber?: string;
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
    const [trackingNumber, setTrackingNumber] = useState("");
    const [attributeDisplayNames, setAttributeDisplayNames] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const response = await getOrderById(resolvedParams.id);

                if (response.success && response.data) {
                    const orderData = response.data as Order;
                    setOrder(orderData);
                    // Set tracking number if it exists
                    setTrackingNumber(orderData.trackingNumber || "");

                    // Extract all unique attribute IDs from order items
                    const attributeIds: string[] = [];
                    orderData.items.forEach(item => {
                        if (item.attributes) {
                            Object.keys(item.attributes).forEach(attributeId => {
                                if (!attributeIds.includes(attributeId)) {
                                    attributeIds.push(attributeId);
                                }
                            });
                        }
                    });

                    // Fetch display names for the attribute IDs
                    if (attributeIds.length > 0) {
                        const displayNames = await getAttributeNamesByIds(attributeIds);
                        setAttributeDisplayNames(displayNames);
                    }
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
                trackingNumber: trackingNumber.trim() || undefined,
            });

            if (response.success) {
                const message = newStatus === OrderStatus.SHIPPED
                    ? "Order marked as shipped and customer notified via email!"
                    : "Order status updated successfully";
                toast.success(message);
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
                            <div className="text-right">
                                {order.user ? (
                                    <div>
                                        <div className="font-medium">{order.user.name}</div>
                                        <div className="text-sm text-muted-foreground">Registered User</div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="font-medium">Guest</div>
                                        <div className="text-sm text-muted-foreground">Guest Order</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Email</span>
                            <span>{order.user?.email || order.guestEmail}</span>
                        </div>
                        {/* Add a text field to input tracking number to send in email */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Tracking Number
                            </label>
                            <Input
                                type="text"
                                placeholder="Enter tracking number"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                                Will be included in shipping confirmation email with Canada Post tracking link when status is set to "Shipped"
                            </p>
                            {trackingNumber.trim() && trackingNumber !== (order?.trackingNumber || "") && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStatusChange(order!.status)}
                                    className="w-full"
                                >
                                    Save Tracking Number
                                </Button>
                            )}
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
                                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {Object.entries(item.attributes).map(([key, value]) => (
                                                    <div key={key}>
                                                        <span className="font-medium">
                                                            {attributeDisplayNames[key] || key}:
                                                        </span> {value}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">${Number(item.price).toFixed(2)}</p>
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
                            {typeof order.shippingAddress === 'string' ? (
                                // If it's a string, try to parse it as JSON
                                (() => {
                                    try {
                                        const parsedAddress = JSON.parse(order.shippingAddress);
                                        return Object.entries(parsedAddress)
                                            .filter(([, value]) => value)
                                            .map(([key, value]) => (
                                                <p key={key} className="capitalize">
                                                    <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {String(value)}
                                                </p>
                                            ));
                                    } catch (e) {
                                        // If parsing fails, display the raw string
                                        return <p>{String(order.shippingAddress)}</p>;
                                    }
                                })()
                            ) : (
                                // If it's already an object, display it directly
                                Object.entries(order.shippingAddress)
                                    .filter(([, value]) => value)
                                    .map(([key, value]) => (
                                        <p key={key} className="capitalize">
                                            <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {String(value)}
                                        </p>
                                    ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
} 