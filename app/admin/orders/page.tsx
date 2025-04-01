"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchInput } from "../components/search-input";
import { getOrders } from "@/lib/actions/order.actions";
import { OrderStatus } from "@prisma/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

// Define interface for order data structure
interface OrderItem {
    id: string;
    name?: string;
    quantity: number;
    price: number;
    image?: string | null;
    product: {
        id: string;
        name: string;
    };
    inventory?: {
        id: string;
        sku: string;
    };
}

interface Order {
    id: string;
    status: OrderStatus;
    createdAt: string | Date;
    total: string | number;
    user: {
        id: string;
        name: string;
        email: string;
    };
    items: OrderItem[];
}

export default function OrdersPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
    const [page, setPage] = useState(1);
    const [orders, setOrders] = useState<Order[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getOrders({
                page,
                limit: 10,
                status: status === "ALL" ? undefined : status,
                search: search || undefined,
            });

            if (response.success && response.data) {
                setOrders(response.data.orders);
                setTotalPages(response.data.totalPages);
            } else {
                toast.error(response.error || "Failed to fetch orders");
            }
        } catch (error) {
            toast.error("An error occurred while fetching orders" + error);
        } finally {
            setLoading(false);
        }
    }, [page, status, search]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

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

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        const halfMaxPages = Math.floor(maxVisiblePages / 2);

        let startPage = Math.max(1, page - halfMaxPages);
        const endPage = Math.min(page + 2, totalPages);

        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Always show first page
        if (startPage > 1) {
            pages.push(
                <Button
                    key={1}
                    variant={page === 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(1)}
                    className="min-w-[2.5rem]"
                >
                    1
                </Button>
            );
            if (startPage > 2) {
                pages.push(
                    <span key="start-ellipsis" className="px-2">
                        ...
                    </span>
                );
            }
        }

        // Show page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={page === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(i)}
                    className="min-w-[2.5rem]"
                >
                    {i}
                </Button>
            );
        }

        // Always show last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(
                    <span key="end-ellipsis" className="px-2">
                        ...
                    </span>
                );
            }
            pages.push(
                <Button
                    key={totalPages}
                    variant={page === totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    className="min-w-[2.5rem]"
                >
                    {totalPages}
                </Button>
            );
        }

        return pages;
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
                    <p className="text-muted-foreground">Manage customer orders</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Select value={status} onValueChange={(value: OrderStatus | "ALL") => setStatus(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Orders</SelectItem>
                            <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
                            <SelectItem value={OrderStatus.PROCESSING}>Processing</SelectItem>
                            <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
                            <SelectItem value={OrderStatus.DELIVERED}>Delivered</SelectItem>
                            <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <SearchInput
                        placeholder="Search orders..."
                        value={search}
                        onChange={setSearch}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    No orders found
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.id}</TableCell>
                                    <TableCell>{order.user.name}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(order.status)}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>${Number(order.total).toFixed(2)}</TableCell>
                                    <TableCell>
                                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/admin/orders/${order.id}`)}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                        {renderPageNumbers()}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
} 