'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Package, ExternalLink, RefreshCw, Eye } from 'lucide-react';

interface PrintifyOrder {
    id: string;
    orderId: string;
    printifyOrderId?: string;
    status: string;
    fulfillmentStatus: string;
    totalAmount: number;
    currency: string;
    customerEmail: string;
    createdAt: string;
    updatedAt: string;
    items: Array<{
        id: string;
        productName: string;
        quantity: number;
        price: number;
    }>;
}

const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-green-100 text-green-800',
    DELIVERED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
};

export default function PrintifyOrders() {
    const [orders, setOrders] = useState<PrintifyOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/printify/orders');

            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }

            const data = await response.json();
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load Printify orders');
        } finally {
            setLoading(false);
        }
    };

    const syncOrderStatus = async (orderId: string) => {
        try {
            setSyncing(orderId);

            const response = await fetch(`/api/admin/printify/sync-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId }),
            });

            if (!response.ok) {
                throw new Error('Failed to sync order');
            }

            toast.success('Order status synced successfully!');
            fetchOrders(); // Refresh the list

        } catch (error) {
            console.error('Error syncing order:', error);
            toast.error('Failed to sync order status');
        } finally {
            setSyncing(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                            <Skeleton className="h-3 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Printify orders yet</h3>
                <p className="text-muted-foreground">
                    Orders will appear here when customers purchase Printify products
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {orders.length} order{orders.length !== 1 ? 's' : ''} sent to Printify
                </p>
                <Button onClick={fetchOrders} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="space-y-4">
                {orders.map((order) => (
                    <Card key={order.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">
                                        Order #{order.orderId.slice(-8).toUpperCase()}
                                    </CardTitle>
                                    <CardDescription>
                                        {order.customerEmail} • {new Date(order.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={statusColors[order.fulfillmentStatus as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                                        {order.fulfillmentStatus}
                                    </Badge>
                                    <Badge variant="outline">
                                        ${order.totalAmount.toFixed(2)}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Order Items */}
                            <div className="space-y-2 mb-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                        <span>{item.productName}</span>
                                        <span className="text-muted-foreground">
                                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => syncOrderStatus(order.id)}
                                    disabled={syncing === order.id}
                                >
                                    {syncing === order.id ? (
                                        <>Syncing...</>
                                    ) : (
                                        <>
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            Sync Status
                                        </>
                                    )}
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.location.href = `/admin/orders/${order.orderId}`}
                                >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Details
                                </Button>

                                {order.printifyOrderId && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(`https://printify.com/app/orders/${order.printifyOrderId}`, '_blank')}
                                    >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Printify
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 