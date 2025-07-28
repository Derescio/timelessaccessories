"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

interface EnhancedAnalyticsResponse {
    success: boolean;
    data?: {
        revenue: { name: string; value: string; }[];
        sales: { name: string; value: number; }[];
        topProducts: { name: string; value: string; }[];
        totalCustomers: number;
        totalCategories: number;
        totalProducts: number;
        recentSales: RecentSale[];
        growthMetrics: {
            revenueGrowth: number;
            orderGrowth: number;
            customerGrowth: number;
        };
        averageOrderValue: number;
    };
    error?: string;
}

interface RecentSale {
    id: string;
    customerName: string;
    customerEmail: string;
    amount: number;
    createdAt: Date;
}

export async function getAnalytics(): Promise<EnhancedAnalyticsResponse> {
    try {
        // Set the launch date to 3 days ago
        const launchDate = new Date();
        launchDate.setDate(launchDate.getDate() - 3);
        launchDate.setHours(0, 0, 0, 0); // Start of the launch day

        const currentMonth = new Date();
        currentMonth.setDate(1);

        const lastMonth = new Date(currentMonth);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        // For the 6-month view, we'll still show 6 months but filter data from launch date
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Use the later of the two dates (launch date or 6 months ago)
        const dataStartDate = launchDate > sixMonthsAgo ? launchDate : sixMonthsAgo;

        // Parallel queries for better performance - all filtered by launch date
        const [
            monthlyData,
            topProducts,
            totalCustomers,
            totalCategories,
            totalProducts,
            recentSales,
            currentMonthStats,
            lastMonthStats
        ] = await Promise.all([
            // Combined monthly revenue and sales query - filtered by launch date
            prisma.$queryRaw<Array<{ month: Date, revenue: string, orders: string }>>`
                SELECT 
                    DATE_TRUNC('month', "createdAt") as month,
                    SUM(total) as revenue,
                    COUNT(*) as orders
                FROM "Order" 
                WHERE "createdAt" >= ${launchDate}
                AND status IN ('PROCESSING', 'SHIPPED', 'DELIVERED')
                GROUP BY DATE_TRUNC('month', "createdAt")
                ORDER BY month ASC
            `,

            // Top products by revenue - filtered by launch date
            prisma.orderItem.groupBy({
                by: ['productId'],
                where: {
                    order: {
                        createdAt: { gte: launchDate },
                        status: { in: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] }
                    }
                },
                _sum: { price: true },
                orderBy: { _sum: { price: 'desc' } },
                take: 5,
            }),

            // Total customers who placed orders since launch
            prisma.user.count({
                where: {
                    role: 'USER',
                    orders: {
                        some: {
                            createdAt: { gte: launchDate }
                        }
                    }
                }
            }),

            // Total categories (not time-dependent)
            prisma.category.count(),

            // Total products (not time-dependent)
            prisma.product.count(),

            // Recent sales since launch
            prisma.order.findMany({
                where: {
                    createdAt: { gte: launchDate },
                    status: { in: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] }
                },
                include: {
                    user: {
                        select: { name: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),

            // Current month stats since launch - FIXED: Use launch date instead of current month
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: launchDate }, // Changed this line
                    status: { in: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] }
                },
                _sum: { total: true },
                _count: { _all: true }
            }),

            // Last month stats - FIXED: This should be empty since launch was 3 days ago
            prisma.order.aggregate({
                where: {
                    createdAt: {
                        gte: lastMonth,
                        lt: launchDate // Changed this line to end before launch
                    },
                    status: { in: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] }
                },
                _sum: { total: true },
                _count: { _all: true }
            })
        ]);

        // Process monthly data - FIXED: Since launch was 3 days ago, only show current month
        const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        // For a 3-day old site, we only show the current month
        const months = [
            {
                name: currentMonthName,
                date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
        ];

        // Direct calculation for verification
        const directRevenue = await prisma.order.aggregate({
            where: {
                createdAt: { gte: launchDate },
                status: { in: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] }
            },
            _sum: {
                total: true,
                subtotal: true,
                tax: true,
                shipping: true
            },
            _count: {
                _all: true
            }
        });

        // console.log('Direct Revenue Calculation:', {
        //     totalRevenue: Number(directRevenue._sum.total),
        //     subtotal: Number(directRevenue._sum.subtotal),
        //     tax: Number(directRevenue._sum.tax),
        //     shipping: Number(directRevenue._sum.shipping),
        //     orderCount: directRevenue._count._all
        // });

        // Update the revenue array to use the direct calculation
        const revenue = [
            {
                name: currentMonthName,
                value: Number(directRevenue._sum.total || 0).toFixed(2)
            }
        ];

        const sales = [
            {
                name: currentMonthName,
                value: directRevenue._count._all || 0
            }
        ];

        // Get product names for top products
        const topProductsWithNames = await Promise.all(
            topProducts.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { name: true }
                });
                return {
                    name: product?.name || 'Unknown Product',
                    value: item._sum.price?.toFixed(2) || '0.00'
                };
            })
        );

        // Calculate growth metrics - FIXED: Since there's no "last month" data, show as new launch
        const calculateGrowth = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Number(((current - previous) / previous * 100).toFixed(1));
        };

        const growthMetrics = {
            revenueGrowth: calculateGrowth(
                Number(currentMonthStats._sum.total) || 0,
                Number(lastMonthStats._sum.total) || 0
            ),
            orderGrowth: calculateGrowth(
                currentMonthStats._count._all || 0,
                lastMonthStats._count._all || 0
            ),
            customerGrowth: 100 // Show 100% since all customers are new since launch
        };

        // Calculate average order value
        const totalRevenue = Number(currentMonthStats._sum.total) || 0;
        const totalOrders = currentMonthStats._count._all || 0;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Format recent sales
        const formattedRecentSales: RecentSale[] = recentSales.map(order => ({
            id: order.id,
            customerName: order.user?.name || 'Guest Customer',
            customerEmail: order.user?.email || order.guestEmail || 'guest@email.com',
            amount: Number(order.total),
            createdAt: order.createdAt
        }));

        // Add this debug query right before the return statement to see what's in the orders
        const debugOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: launchDate },
                status: { in: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] }
            },
            select: {
                id: true,
                total: true,
                subtotal: true,
                tax: true,
                shipping: true,
                status: true,
                createdAt: true,
                items: {
                    select: {
                        price: true,
                        quantity: true,
                        name: true
                    }
                }
            }
        });

        // console.log('Debug Orders Detail:', debugOrders.map(order => ({
        //     id: order.id,
        //     total: Number(order.total),
        //     subtotal: Number(order.subtotal),
        //     itemsTotal: order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0),
        //     items: order.items
        // })));

        // console.log('Debug Analytics:', {
        //     launchDate,
        //     totalOrders: currentMonthStats._count._all,
        //     totalRevenue: currentMonthStats._sum.total,
        //     recentSalesCount: formattedRecentSales.length,
        //     monthlyDataCount: monthlyData.length
        // });

        return {
            success: true,
            data: {
                revenue,
                sales,
                topProducts: topProductsWithNames,
                totalCustomers,
                totalCategories,
                totalProducts,
                recentSales: formattedRecentSales,
                growthMetrics,
                averageOrderValue
            }
        };

    } catch (error) {
        console.error("Error fetching analytics:", error);
        return {
            success: false,
            error: "Failed to fetch analytics data"
        };
    }
}