"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getUserById, updateUserRole } from "@/lib/actions/user.actions";
import { Role, User, Order } from "@prisma/client";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface SerializedOrder extends Omit<Order, 'subtotal' | 'tax' | 'shipping' | 'total'> {
    subtotal: string;
    tax: string;
    shipping: string;
    total: string;
    items: Array<{
        id: string;
        name: string;
        price: string;
        product: {
            id: string;
            name: string;
        };
        inventory: {
            id: string;
            sku: string;
        };
    }>;
}

interface UserWithRelations extends Omit<User, 'orders'> {
    orders: SerializedOrder[];
    _count: {
        orders: number;
    };
    totalSpent: number;
}

export default function UserDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [user, setUser] = useState<UserWithRelations | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getUserById(id);
            if (response.success && response.data) {
                setUser(response.data as unknown as UserWithRelations);
            } else {
                toast.error(response.error || "Failed to fetch user");
            }
        } catch (err) {
            console.error('Error fetching user:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleRoleChange = async (newRole: Role) => {
        try {
            const response = await updateUserRole({
                id,
                role: newRole,
            });
            if (response.success) {
                toast.success("User role updated successfully");
                await fetchUser();
            } else {
                toast.error(response.error || "Failed to update user role");
            }
        } catch (err) {
            console.error('Error updating user:', err);
        }
    };

    const getRoleColor = (role: Role) => {
        switch (role) {
            case Role.ADMIN:
                return "bg-red-500";
            case Role.USER:
                return "bg-blue-500";
            default:
                return "bg-gray-500";
        }
    };

    const getOrderStatusColor = (status: string) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-500";
            case "PROCESSING":
                return "bg-blue-500";
            case "SHIPPED":
                return "bg-purple-500";
            case "DELIVERED":
                return "bg-green-500";
            case "CANCELLED":
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
                        <Link href="/admin/users">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Loading...</h2>
                        <p className="text-muted-foreground">Please wait while we fetch the user details</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/users">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">User Not Found</h2>
                        <p className="text-muted-foreground">The user youare looking for does not exist</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/users">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">User Details</h2>
                    <p className="text-muted-foreground">User ID: {user.id}</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Name</span>
                            <span>{user.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Email</span>
                            <span>{user.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Role</span>
                            <Select value={user.role} onValueChange={handleRoleChange}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue>
                                        <Badge className={getRoleColor(user.role)}>
                                            {user.role}
                                        </Badge>
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                                    <SelectItem value={Role.USER}>User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Joined</span>
                            <span>{format(new Date(user.createdAt), "MMM d, yyyy")}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Account Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total Orders</span>
                            <span>{user._count.orders}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total Spent</span>
                            <span>${user.totalSpent?.toFixed(2) || "0.00"}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {user.orders?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        No orders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                user.orders?.map((order: SerializedOrder) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.id}</TableCell>
                                        <TableCell>
                                            {format(new Date(order.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getOrderStatusColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>${Number(order.total).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/admin/orders/${order.id}`)}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
} 