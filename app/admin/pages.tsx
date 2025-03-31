import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/app/admin/components/user-avatar";
import {
    DollarSign,
    Package,
    ShoppingBag,
    Tags,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

import { getAnalytics } from "@/lib/actions/analytics.actions";

// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// const iconMap = {
//     total: DollarSign,
//     sales: CreditCard,
//     products: Package,
//     categories: Tags,
//     customers: User,
//     orders: ShoppingBag,
// };

// interface CardProps {
//     title: string;
//     value: string;
//     description: string;
//     icon: keyof typeof iconMap;
// }

// function DashboardCard({ title, value, description, icon }: CardProps) {
//     const Icon = iconMap[icon];
//     return (
//         <Card>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">{title}</CardTitle>
//                 <Icon className="h-4 w-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//                 <div className="text-2xl font-bold">{value}</div>
//                 <p className="text-xs text-muted-foreground">{description}</p>
//             </CardContent>
//         </Card>
//     );
// }


export default async function AdminPages() {
    const { success, data, error } = await getAnalytics();

    if (!success || !data) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="text-center text-red-500">
                    {error || "Failed to load analytics data"}
                </div>
            </div>
        );
    }

    // Calculate totals
    const totalSales = data.revenue.reduce((sum, item) => sum + parseFloat(item.value), 0);
    const totalOrders = data.sales.reduce((sum, item) => sum + item.value, 0);
    const totalProducts = data.topProducts.length;
    const totalCustomers = 0; // This will need to be added to the analytics endpoint

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <UserAvatar />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">+15% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                        <p className="text-xs text-muted-foreground">+19% from last month</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md">
                                <p className="text-muted-foreground">Sales chart will be displayed here</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="col-span-3">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Recent Sales</CardTitle>
                            <CardDescription>
                                You made {totalOrders} sales this month.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div className="flex items-center gap-4" key={i}>
                                        <Avatar className="hidden h-9 w-9 sm:flex">
                                            <AvatarImage src={`https://avatar.vercel.sh/${i}.png`} alt="Avatar" />
                                            <AvatarFallback>
                                                {String.fromCharCode(65 + i)}
                                                {String.fromCharCode(90 - i)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                Customer {i + 1}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                customer{i + 1}@example.com
                                            </p>
                                        </div>
                                        <div className="font-medium">+${(i + 1) * 125}.00</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/admin/orders">View all orders</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Products Management</CardTitle>
                        <CardDescription>
                            Manage your product catalog
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-muted-foreground" />
                                <span>Total Products: <strong>{totalProducts}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Tags className="h-5 w-5 text-muted-foreground" />
                                <span>Categories: <strong>{totalProducts}</strong></span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button asChild variant="outline">
                            <Link href="/admin/products">Manage Products</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/admin/products/new">Add Product</Link>
                        </Button>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Category Management</CardTitle>
                        <CardDescription>
                            Organize your products with categories
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center gap-2">
                                <Tags className="h-5 w-5 text-muted-foreground" />
                                <span>Total Categories: <strong>{totalProducts}</strong></span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button asChild variant="outline">
                            <Link href="/admin/categories">Manage Categories</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/admin/categories/new">Add Category</Link>
                        </Button>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Orders</CardTitle>
                        <CardDescription>
                            Track and manage customer orders
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                                <span>Total Orders: <strong>{totalOrders}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-muted-foreground" />
                                <span>Total Revenue: <strong>{formatCurrency(totalSales)}</strong></span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/admin/orders">Manage Orders</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
} 