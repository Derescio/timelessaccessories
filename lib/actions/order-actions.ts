// 'use server';

// import { isRedirectError } from 'next/dist/client/components/redirect-error';
// import { formatError, prismaToJSObject } from '../utils';
// import { auth } from '@/auth';
// import { getMyCart } from './cart.actions';
// import { getUserById } from './user.actions';
// import { insertOrderSchema } from '../validators';
// import { prisma } from '@/app/db/prisma';
// import { CartItem, PaymentResult, ShippingAddress } from '@/types/index';
// import { revalidatePath } from 'next/cache';
// import { paypal } from '../paypal';
// import { PAGE_SIZE } from '../constatnts';
// import { Prisma } from '@prisma/client';
// import { sendPurchaseReceipt } from '@/email';


// // Utility function to handle errors
// const handleError = (error: unknown) => {
//     if (isRedirectError(error)) throw error;
//     return { success: false, message: formatError(error) };
// };


// // Utility function to fetch order by ID
// const fetchOrderById = async (orderId: string) => {
//     const order = await prisma.order.findFirst({
//         where: { id: orderId },
//         include: { orderItems: true, user: { select: { name: true, email: true } } },
//     });
//     if (!order) throw new Error('Order not found');
//     return order;
// };

// /**
//  * Creates an order for the authenticated user.
//  * 
//  * This function performs the following steps:
//  * 1. Authenticates the user.
//  * 2. Retrieves the user's cart.
//  * 3. Validates the user's shipping address and payment method.
//  * 4. Creates an order object from the cart, user address, and payment method.
//  * 5. Creates a transaction to insert the order and order items into the database.
//  * 6. Clears the user's cart.
//  * 7. Returns the order ID if the order is successfully created.
//  * 
//  * returns {Promise<{ success: boolean, message: string, redirectTo?: string }>} 
//  * An object containing the success status, message, and optional redirect URL.
//  * 
//  * throws {Error} If the user is not authenticated, user not found, or order not created.
//  */
// export const createOrder = async (): Promise<{ success: boolean, message: string, redirectTo?: string }> => {

//     const session = await auth();
//     if (!session) throw new Error('User is not authenticated');
//     const cart = await getMyCart();
//     const userId = session?.user?.id;
//     if (!userId) throw new Error('User not found');
//     const user = await getUserById(userId);

//     try {

//         if (!cart || cart.items.length === 0) {
//             return {
//                 success: false,
//                 message: 'Your cart is empty',
//                 redirectTo: '/cart',
//             };
//         }

//         if (!user?.address) {
//             return {
//                 success: false,
//                 message: 'No shipping address',
//                 redirectTo: '/shipping',
//             };
//         }

//         if (!user.paymentMethod) {
//             return {
//                 success: false,
//                 message: 'No payment method',
//                 redirectTo: '/payment-method',
//             };
//         }


//         // Create order object from the cart and user address and payment method
//         const order = insertOrderSchema.parse({
//             userId: user.id,
//             shippingAddress: user.address,
//             paymentMethod: user.paymentMethod,
//             itemsPrice: cart.itemsPrice,
//             shippingPrice: cart.shippingPrice,
//             taxPrice: cart.taxPrice,
//             totalPrice: cart.totalPrice,
//         });


//         // Create a transaction to create order and order items in database
//         const insertedOrderId = await prisma.$transaction(async (tx) => {
//             // Create order
//             const insertedOrder = await tx.order.create({ data: order });
//             // Create order items from the cart items
//             for (const item of cart.items as CartItem[]) {
//                 await tx.orderItem.create({
//                     data: {
//                         orderId: insertedOrder.id,
//                         productId: item.productId, // ✅ Add product ID
//                         qty: item.qty, // ✅ Add quantity
//                         unitPrice: item.price, // ✅ Add unit price
//                         totalPrice: item.price * item.qty, // ✅ Calculate total price
//                         name: item.name, // ✅ Add product name
//                         slug: item.slug, // ✅ Add slug
//                         image: item.image, // ✅ Add image
//                     },
//                 });
//             }
//             // Clear cart
//             await tx.cart.update({
//                 where: { id: cart.id },
//                 data: {
//                     items: [],
//                     totalPrice: 0,
//                     taxPrice: 0,
//                     shippingPrice: 0,
//                     itemsPrice: 0,
//                 },
//             });

//             return insertedOrder.id;

//         });
//         // After the Prisma Transaction is completed, 
//         // check if its successful and return the order id. 
//         // If not successful, throw an error


//         if (!insertedOrderId) throw new Error('Order not created');
//         return {
//             success: true,
//             message: 'Order created',
//             //Redirect back to the client side to - order/OrderId page
//             redirectTo: `/order/${insertedOrderId}`,
//         };

//     } catch (error) {
//         return handleError(error);
//     }
// };



// export async function getOrderById(orderId: string) {
//     const data = await prisma.order.findFirst({
//         where: {
//             id: orderId,
//         },
//         include: {
//             orderItems: true,
//             user: { select: { name: true, email: true } },
//         },
//     });
//     return prismaToJSObject(data);
// }

// /**
//  * Creates a new PayPal order for the specified order ID.
//  * 
//  * This function retrieves the order from the database, creates a new PayPal order,
//  * and updates the order with the PayPal order ID. It then returns the PayPal order ID.
//  * 
//  * @param orderId - The ID of the order to create the PayPal order for.
//  * @returns An object with the following properties:
//  *   - `success`: A boolean indicating whether the operation was successful.
//  *   - `message`: A string describing the result of the operation.
//  *   - `data`: The ID of the created PayPal order.
//  */
// //Create New Papal Payment/Order
// export async function createPayPalOrder(orderId: string): Promise<{ success: boolean, message: string, data?: string }> {
//     try {
//         const order = await fetchOrderById(orderId);
//         if (order) {
//             // Create a paypal order
//             const paypalOrder = await paypal.createOrder(Number(order.totalPrice));

//             // Update the order with the paypal order id
//             await prisma.order.update({
//                 where: {
//                     id: orderId,
//                 },
//                 data: {
//                     paymentResult: {
//                         id: paypalOrder.id,
//                         email_address: '',
//                         status: '',
//                         pricePaid: '0',
//                     },
//                 },
//             });

//             // Return the paypal order id
//             return {
//                 success: true,
//                 message: 'PayPal order created successfully',
//                 data: paypalOrder.id,
//             };
//         } else {
//             throw new Error('Order not found');
//         }
//     } catch (err) {
//         return handleError(err);
//     }
// }

// export async function approvePayPalOrder(
//     orderId: string,
//     data: { orderID: string }
// ): Promise<{ success: boolean, message: string, redirectTo?: string }> {
//     try {
//         const order = await fetchOrderById(orderId);

//         // Check if the order is already paid
//         const captureData = await paypal.capturePayment(data.orderID)
//         if (
//             !captureData ||
//             captureData.id !== (order.paymentResult as PaymentResult)?.id ||
//             captureData.status !== 'COMPLETED'
//         )
//             throw new Error('Error in paypal payment')

//         await updateOrderToPaid({
//             orderId,
//             paymentResult: {
//                 id: captureData.id,
//                 status: captureData.status,
//                 email_address: captureData.payer.email_address,
//                 pricePaid:
//                     captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
//             },
//         });
//         revalidatePath(`/order/${orderId}`)

//         return {
//             success: true,
//             message: 'Your order has been successfully paid by PayPal',
//             redirectTo: '/',
//         }
//     } catch (err) {
//         return handleError(err);
//     }
// }


// export async function updateOrderToPaid({
//     orderId,
//     paymentResult,
// }: {
//     orderId: string;
//     paymentResult?: PaymentResult;
// }): Promise<void> {

//     const order = await fetchOrderById(orderId);

//     if (order.isPaid) throw new Error('Order is already paid');

//     // Transaction to update the order and update the product quantities
//     await prisma.$transaction(async (tx) => {
//         // Update all item quantities in the database
//         for (const item of order.orderItems) {
//             await tx.product.update({
//                 where: { id: item.productId },
//                 data: { stock: { increment: -item.qty } },
//             });
//         }

//         // Set the order to paid
//         await tx.order.update({
//             where: { id: orderId },
//             data: {
//                 isPaid: true,
//                 paidAt: new Date(),
//                 paymentResult,
//             },
//         });
//     });

//     // Get the updated order after the transaction
//     const updatedOrder = await prisma.order.findFirst({

//         where: {
//             id: orderId,
//         },
//         include: {
//             orderItems: true,
//             user: { select: { name: true, email: true } },
//         },
//     });

//     if (!updatedOrder) {
//         throw new Error('Order not found');
//     }

//     sendPurchaseReceipt({
//         order: {
//             ...updatedOrder,
//             orderItems: updatedOrder.orderItems.map(item => ({
//                 ...item,
//                 totalPrice: Number(item.totalPrice),
//                 unitPrice: Number(item.unitPrice),

//             })),

//             shippingAddress: updatedOrder.shippingAddress as ShippingAddress,
//             paymentResult: updatedOrder.paymentResult as PaymentResult,
//             itemsPrice: Number(updatedOrder.itemsPrice),
//             shippingPrice: Number(updatedOrder.shippingPrice),
//             taxPrice: Number(updatedOrder.taxPrice),
//             totalPrice: Number(updatedOrder.totalPrice),
//         },
//     });
// };




// export async function updateOrderToPaidByCOD(orderId: string): Promise<{ success: boolean, message: string }> {
//     try {
//         await updateOrderToPaid({ orderId });
//         revalidatePath(`/order/${orderId}`);
//         return { success: true, message: 'Order paid successfully' };
//     } catch (err) {
//         return handleError(err);
//     }
// }

// // Update COD Order To Delivered
// export async function deliverOrder(orderId: string): Promise<{ success: boolean, message: string }> {
//     try {
//         const order = await fetchOrderById(orderId);

//         if (!order.isPaid) throw new Error('Order is not paid');

//         await prisma.order.update({
//             where: { id: orderId },
//             data: {
//                 isDelivered: true,
//                 deliveredAt: new Date(),
//             },
//         });

//         revalidatePath(`/order/${orderId}`);

//         return { success: true, message: 'Order delivered successfully' };
//     } catch (err) {
//         return handleError(err);
//     }
// }


// //Fetch Orders
// export async function getOrder({ limit = PAGE_SIZE,
//     page,
// }: {
//     limit?: number;
//     page: number;
// }) {
//     const session = await auth();
//     if (!session) throw new Error('User is not authorized');

//     const data = await prisma.order.findMany({
//         where: { userId: session?.user?.id },
//         orderBy: { createdAt: 'desc' },
//         take: limit,
//         skip: (page - 1) * limit,
//     });

//     const dataCount = await prisma.order.count({
//         where: { userId: session?.user?.id },
//     });

//     return {
//         data,
//         totalPages: Math.ceil(dataCount / limit),
//     };
// }






// // type SalesDataType = {
// //     month: string;
// //     totalSales: number;
// // }[]

// /**
//  * Retrieves a summary of order-related data including counts, sales, and profits.
//  *
//  *  Returns {Promise<{
//  *   orderCount: number;
//  *   productCount: number;
//  *   userCount: number;
//  *   totalSales: { _sum: { totalPrice: number | null } };
//  *   latestOrders: Array<{ id: string; createdAt: Date; totalPrice: Prisma.Decimal; user: { name: string | null } }>;
//  *   salesData: Array<{ month: string; totalSales: number }>;
//  *   skuProfits: Array<{ productId: number; totalRevenue: number; totalCost: number; profit: number }>;
//  *   result: { totalRevenue: number; totalCost: number; profit: number };
//  * }>} A promise that resolves to an object containing order summary data.
//  *
//  * Example
//  * const summary = await getOrderSummary();
//  * console.log(summary.orderCount); // Output the total number of orders
//  */
// // export async function getOrderSummary(): Promise<{
// //     orderCount: number;
// //     productCount: number;
// //     userCount: number;
// //     totalSales: { _sum: { totalPrice: number | null } };
// //     latestOrders: Array<{ id: string; createdAt: Date; totalPrice: Prisma.Decimal; user: { name: string | null } }>;
// //     salesData: Array<{ month: string; totalSales: number }>;
// //     skuProfits: Array<{ productId: number; totalRevenue: number; totalCost: number; profit: number }>;
// //     result: { totalRevenue: number; totalCost: number; profit: number };
// // }> {
// //     //Get Count for each resource(Product, Category, User, Order)
// //     const orderCount = await prisma.order.count();
// //     const productCount = await prisma.product.count();
// //     const userCount = await prisma.user.count();

// //     //Calculate Total Sales
// //     const totalSales = await prisma.order.aggregate({
// //         _sum: {
// //             totalPrice: true,
// //         },
// //     });


// //     // Calculate Toatl CostPrce
// //     const totalProfit = async () => {
// //         // Aggregate all sales data
// //         const sales = await prisma.orderItem.aggregate({
// //             _sum: {
// //                 price: true, // Total sales revenue
// //                 qty: true,   // Total quantity sold
// //             },
// //         });

// //         // Join products to calculate the total cost
// //         const costData = await prisma.orderItem.findMany({
// //             include: {
// //                 product: {
// //                     select: {
// //                         costPrice: true, // Product costPrice
// //                     },
// //                 },
// //             },
// //         });
// //         //console.log(sales);


// //         // Calculate the total cost
// //         const totalCost = costData.reduce((sum, item) => {
// //             return sum + item.qty * item.product.costPrice.toNumber();
// //         }, 0);

// //         // Calculate profit
// //         const totalRevenue = Number(sales._sum.price) || 0;
// //         const profit = totalRevenue - totalCost;

// //         return {
// //             totalRevenue,
// //             totalCost,
// //             profit,
// //         };
// //     };

// //     // Example usage
// //     const result = await totalProfit();
// //     //console.log("Total Profit:", result);



// //     const profitBySKU = async () => {
// //         // Get aggregated data grouped by productId (SKU)
// //         const salesData = await prisma.orderItem.groupBy({
// //             by: ['productId'],
// //             _sum: {
// //                 qty: true,
// //                 price: true,
// //             },
// //         });

// //         // Fetch cost prices for the SKUs
// //         const productData = await prisma.product.findMany({
// //             select: {
// //                 id: true,
// //                 costPrice: true,
// //             },
// //         });

// //         // Map product costs
// //         const costMap = productData.reduce((map, product) => {
// //             map[product.id.toString()] = product.costPrice.toNumber();
// //             return map;
// //         }, {} as Record<string, number>);

// //         // Calculate profit for each SKU
// //         const profitDetails = salesData.map((item) => {
// //             const totalCost = (item._sum.qty || 0) * (costMap[item.productId.toString()] || 0);
// //             const totalRevenue = item._sum.price?.toString() || 0;
// //             return {
// //                 productId: Number(item.productId),
// //                 totalRevenue: Number(totalRevenue),
// //                 totalCost,
// //                 profit: Number(totalRevenue) - totalCost,
// //             };
// //         });

// //         return profitDetails;
// //     };

// //     // Example usage
// //     const skuProfits = await profitBySKU();
// //     // console.log("Profit by SKU:", skuProfits);


// //     //Get Sales Data(Revenue)
// //     const salesDataRaw = await prisma.$queryRaw<
// //         Array<{ month: string; totalSales: Prisma.Decimal }>
// //     >`SELECT to_char("createdAt", 'MM/YY') as "month", sum("totalPrice") as "totalSales" FROM "Order" GROUP BY to_char("createdAt", 'MM/YY')`;

// //     const salesData: SalesDataType = salesDataRaw.map((entry) => ({
// //         month: entry.month,
// //         totalSales: Number(entry.totalSales), // Convert Decimal to number
// //     }));
// //     //Get Lastest Sales
// //     const latestOrders = await prisma.order.findMany({
// //         orderBy: { createdAt: 'desc' },
// //         include: {
// //             user: { select: { name: true } },
// //         },
// //         take: 6,
// //     }).then(orders => orders.map(order => ({
// //         ...order,
// //         totalPrice: new Prisma.Decimal(order.totalPrice)
// //     })));

// //     return {
// //         orderCount,
// //         productCount,
// //         userCount,
// //         totalSales: {
// //             _sum: {
// //                 totalPrice: totalSales._sum.totalPrice ? Number(totalSales._sum.totalPrice) : null,
// //             },
// //         },
// //         latestOrders,
// //         salesData,
// //         skuProfits,
// //         result,
// //     };
// // }

// // export async function getOrderSummary(): Promise<{
// //     orderCount: number;
// //     productCount: number;
// //     userCount: number;
// //     totalRevenue: number;
// //     totalProfit: number;
// //     latestOrders: Array<{ id: string; createdAt: Date; totalPrice: number; user: { name: string | null } }>;
// //     salesData: Array<{ month: string; totalSales: number }>;
// // }> {
// //     // 1. Get Counts
// //     const [productCount, orderCount] = await Promise.all([
// //         prisma.product.count(),
// //         prisma.order.count({ where: { isPaid: true } }),
// //     ]);

// //     // 2. Calculate Total Revenue & Profit
// //     const profitData = await prisma.$queryRaw<{ revenue: number; cost: number }[]>`
// //       SELECT 
// //         COALESCE(SUM(o."totalPrice"), 0) as revenue,
// //         COALESCE(SUM(p."costPrice" * oi.qty), 0) as cost
// //       FROM "Order" o
// //       JOIN "OrderItem" oi ON o.id = oi."orderId"
// //       JOIN "Product" p ON oi."productId" = p.id 
// //       WHERE o."isPaid" = true
// //     `;
// //     const totalRevenue = profitData[0]?.revenue || 0;
// //     const totalProfit = totalRevenue - (profitData[0]?.cost || 0);

// //     // 3. Get Unique Customers
// //     const userCount = await prisma.order.findMany({
// //         distinct: ['userId'],
// //         where: { isPaid: true },
// //     }).then(orders => orders.length);

// //     // 4. Sales Data by Month (Convert Decimal to Number)
// //     const salesDataRaw = await prisma.$queryRaw<{ month: string; totalSales: Prisma.Decimal }[]>`
// //       SELECT 
// //         TO_CHAR(o."createdAt", 'MM/YY') as month, 
// //         COALESCE(SUM(o."totalPrice"), 0) as "totalSales"
// //       FROM "Order" o
// //       WHERE o."isPaid" = true
// //       GROUP BY TO_CHAR(o."createdAt", 'MM/YY')
// //       ORDER BY MAX(o."createdAt") DESC
// //     `;
// //     const salesData = salesDataRaw.map(entry => ({
// //         month: entry.month,
// //         totalSales: Number(entry.totalSales), // ✅ Convert Prisma.Decimal to number
// //     }));

// //     // 5. Latest Paid Orders (Convert Decimal to Number)
// //     const latestOrders = await prisma.order.findMany({
// //         where: { isPaid: true },
// //         orderBy: { createdAt: 'desc' },
// //         take: 6,
// //         include: { user: { select: { name: true } } },
// //     });

// //     return {
// //         orderCount,
// //         productCount,
// //         userCount,
// //         totalRevenue,
// //         totalProfit,
// //         salesData,
// //         latestOrders: latestOrders.map(order => ({
// //             ...order,
// //             totalPrice: Number(order.totalPrice), // ✅ Convert Prisma.Decimal to number
// //         })),
// //     };
// // }






// // Get All Orders (Admin)


// // Fetch order, product, and user counts
// async function getOrderCounts() {
//     return {
//         orderCount: await prisma.order.count(),
//         paidOrderCount: await prisma.order.count({ where: { isPaid: true } }),
//         productCount: await prisma.product.count(),
//         userCount: await prisma.user.count(),
//     };
// }


// // Aggregate total sales
// async function getTotalSales() {
//     const totalSales = await prisma.order.aggregate({
//         _sum: { totalPrice: true },
//         where: { isPaid: true }
//     });
//     return totalSales._sum.totalPrice ? Number(totalSales._sum.totalPrice) : 0;
// }


// // Compute revenue, cost, and profit
// async function getTotalProfit() {
//     const sales = await prisma.orderItem.aggregate({
//         _sum: { totalPrice: true, qty: true },
//         where: { order: { isPaid: true } }
//     });

//     const costData = await prisma.orderItem.findMany({
//         where: { order: { isPaid: true } },
//         include: { product: { select: { costPrice: true } } },
//     });

//     const totalCost = costData.reduce((sum, item) => sum + item.qty * item.product.costPrice.toNumber(), 0);
//     const totalRevenue = Number(sales._sum.totalPrice) || 0;
//     const roundToCents = (num: number) => Math.round(num * 100) / 100;
//     return {
//         totalRevenue: roundToCents(totalRevenue),
//         totalCost: roundToCents(totalCost),
//         profit: roundToCents(totalRevenue - totalCost)
//     };
// }


// // Fetch sales data for charts
// // In your order-actions.ts
// async function getSalesData() {
//     const salesDataRaw = await prisma.$queryRaw<
//         Array<{
//             month: string;
//             totalSales: Prisma.Decimal;
//             userCount: number;
//             orderCount: number;
//         }>
//     >`
//       SELECT 
//         to_char("createdAt", 'MM/YY') as "month",
//         sum("totalPrice") as "totalSales",
//         COUNT(DISTINCT "userId") as "userCount",
//         COUNT(*) as "orderCount"
//       FROM "Order" 
//       WHERE "isPaid" = true 
//       GROUP BY to_char("createdAt", 'MM/YY')
//     `;

//     return salesDataRaw.map(entry => ({
//         month: entry.month,
//         totalSales: Number(entry.totalSales),
//         userCount: Number(entry.userCount),
//         orderCount: Number(entry.orderCount)
//     }));
// }


// // Retrieve latest orders
// async function getLatestOrders() {
//     return await prisma.order.findMany({
//         where: { isPaid: true },
//         orderBy: { createdAt: "desc" },
//         include: { user: { select: { name: true } } },
//         take: 6,
//     }).then(orders => orders.map(order => ({ ...order, totalPrice: new Prisma.Decimal(order.totalPrice) })));
// }


// // Calculate profit per SKU
// async function getProfitBySKU() {
//     const salesData = await prisma.orderItem.groupBy({
//         by: ["productId"],
//         where: { order: { isPaid: true } },
//         _sum: { qty: true, totalPrice: true },
//     });
//     const productData = await prisma.product.findMany({ select: { id: true, costPrice: true } });
//     const costMap = productData.reduce((map, product) => {
//         map[product.id.toString()] = product.costPrice.toNumber();
//         return map;
//     }, {} as Record<string, number>);

//     return salesData.map(item => {
//         const totalCost = (item._sum.qty || 0) * (costMap[item.productId.toString()] || 0);
//         const totalRevenue = Number(item._sum.totalPrice) || 0;
//         return { productId: item.productId, totalRevenue, totalCost, profit: totalRevenue - totalCost };
//     });
// }

// // Main function to get all order summary data
// export async function getOrderSummary() {
//     const [counts, totalSales, totalProfit, salesData, latestOrders, skuProfits] = await Promise.all([
//         getOrderCounts(),
//         getTotalSales(),
//         getTotalProfit(),
//         getSalesData(),
//         getLatestOrders(),
//         getProfitBySKU(),
//     ]);

//     return {
//         ...counts,
//         totalSales,
//         latestOrders,
//         salesData,
//         skuProfits,
//         result: totalProfit,
//     };
// }

// export async function getAllOrders({
//     limit = PAGE_SIZE,
//     page,
//     query,
// }: {
//     limit?: number;
//     page: number;
//     query: string;
// }) {
//     const queryFilter: Prisma.OrderWhereInput =
//         query && query !== 'all'
//             ? {
//                 user: {
//                     name: {
//                         contains: query,
//                         mode: 'insensitive',
//                     } as Prisma.StringFilter,
//                 },
//             }
//             : {};

//     const data = await prisma.order.findMany({
//         where: {
//             ...queryFilter,
//         },
//         orderBy: { createdAt: 'desc' },
//         take: limit,
//         skip: (page - 1) * limit,
//         include: { user: { select: { name: true } } },
//     });

//     const dataCount = await prisma.order.count();

//     return {
//         data,
//         totalPages: Math.ceil(dataCount / limit),
//     };
// }

// export async function deleteOrder(id: string): Promise<{ success: boolean, message: string }> {
//     try {
//         await prisma.order.delete({ where: { id } });

//         revalidatePath('/admin/orders');

//         return {
//             success: true,
//             message: 'Order deleted successfully',
//         };
//     } catch (error) {
//         return handleError(error);
//     }
// }