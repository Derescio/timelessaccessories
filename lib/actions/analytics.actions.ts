"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

interface GetAnalyticsResponse {
    success: boolean;
    data?: {
        revenue: {
            name: string;
            value: string;
        }[];
        sales: {
            name: string;
            value: number;
        }[];
        topProducts: {
            name: string;
            value: string;
        }[];
    };
    error?: string;
}

export async function getAnalytics(): Promise<GetAnalyticsResponse> {
    try {
        // Get the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Get monthly revenue
        const monthlyRevenue = await prisma.order.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: {
                    gte: sixMonthsAgo,
                },
                status: {
                    in: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
                },
            },
            _sum: {
                total: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        //   console.log('Monthly Revenue:', monthlyRevenue);

        // Get monthly sales count
        const monthlySales = await prisma.order.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: {
                    gte: sixMonthsAgo,
                },
                status: {
                    in: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
                },
            },
            _count: {
                _all: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        // console.log('Monthly Sales:', monthlySales);

        // Get top products by revenue
        const topProducts = await prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                order: {
                    status: {
                        in: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
                    },
                },
            },
            _sum: {
                price: true,
            },
            orderBy: {
                _sum: {
                    price: 'desc',
                },
            },
            take: 5,
        });

        //  console.log('Top Products:', topProducts);

        // Get product names for top products
        const productIds = topProducts.map(p => p.productId);
        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
            select: {
                id: true,
                name: true,
            },
        });

        //    console.log('Products:', products);

        // Create an array of the last 6 months
        const months = Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return date;
        }).reverse();

        // Format the data with all months included
        const revenue = months.map(month => {
            const monthData = monthlyRevenue.filter(
                rev => rev.createdAt.getMonth() === month.getMonth() &&
                    rev.createdAt.getFullYear() === month.getFullYear()
            );
            const total = monthData.reduce((sum, rev) => sum + Number(rev._sum.total), 0);
            return {
                name: month.toLocaleDateString('en-US', { month: 'short' }),
                value: total.toString(),
            };
        });

        const sales = months.map(month => {
            const monthData = monthlySales.filter(
                sale => sale.createdAt.getMonth() === month.getMonth() &&
                    sale.createdAt.getFullYear() === month.getFullYear()
            );
            const total = monthData.reduce((sum, sale) => sum + sale._count._all, 0);
            return {
                name: month.toLocaleDateString('en-US', { month: 'short' }),
                value: total,
            };
        });

        const topProductsData = topProducts.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                name: product?.name || 'Unknown Product',
                value: item._sum.price?.toString() || '0',
            };
        });

        // console.log('Formatted Data:', {
        //     revenue,
        //     sales,
        //     topProducts: topProductsData,
        // });

        return {
            success: true,
            data: {
                revenue,
                sales,
                topProducts: topProductsData,
            },
        };
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return {
            success: false,
            error: "Failed to fetch analytics data",
        };
    }
} 