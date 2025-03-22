"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { OrderStatus, PaymentStatus } from "@prisma/client"
import { PaymentResult } from "@/types"
import { paypal } from "../paypal/paypal"
import { Decimal } from "@prisma/client/runtime/library"
import { prisma } from "../prisma"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { savePaymentResult } from "@/lib/actions/payment.actions"

// Only keep interfaces that are actually used
interface ShippingMethod {
  method: string
  cost: number
}

interface OrderData {
  cartId: string
  shippingAddress: {
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    fullName?: string
    email?: string
    phone?: string
    [key: string]: string | undefined
  }
  shipping: ShippingMethod
  payment?: {
    method: string
    status?: keyof typeof PaymentStatus | string
    providerId?: string
  }
  subtotal: number
  tax: number
  total: number
  status?: keyof typeof OrderStatus | string
}

//Format Errors
export async function formatError(error: unknown): Promise<string> {
  // Check for Zod errors
  if (error && typeof error === 'object' && 'name' in error) {
    if (error.name === 'ZodError' && 'errors' in error && typeof error.errors === 'object') {
      // Handle Zod error
      const fieldErrors = Object.keys(error.errors as Record<string, { message: string | unknown }>).map((field) => {
        const message = (error.errors as Record<string, { message: string | unknown }>)[field].message;
        return typeof message === 'string' ? message : JSON.stringify(message);
      });
      
      return fieldErrors.join('. ');
    } 
    // Check for Prisma errors
    else if (
      error.name === 'PrismaClientKnownRequestError' && 
      'code' in error && 
      error.code === 'P2002' &&
      'meta' in error && 
      error.meta && 
      typeof error.meta === 'object' && 
      'target' in error.meta && 
      Array.isArray(error.meta.target)
    ) {
      // Handle Prisma error
      const field = error.meta.target[0] as string;
      return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    } 
    // Handle general error with message property
    else if ('message' in error) {
      return typeof error.message === 'string'
        ? error.message
        : JSON.stringify(error.message);
    }
  }
  
  // Fallback for any other error
  return `Unknown error: ${String(error)}`;
}


// Utility function to fetch order by ID
const fetchOrderById = async (orderId: string) => {
  const order = await db.order.findFirst({
    where: { id: orderId },
    include: {
      items: true,
      user: { select: { name: true, email: true } }
    },
  });
  
  if (!order) throw new Error('Order not found');
  return order;
};

// Utility function to handle errors
const handleError = async (error: unknown): Promise<{ success: false, message: string }> => {
  if (isRedirectError(error)) throw error;
  const errorMessage = await formatError(error);
  return { success: false, message: errorMessage };
};


/**
 * Create Order
 * 
 * Creates an order in the database without deleting the cart.
 * Cart cleanup will happen after payment confirmation via webhooks.
 */
export const createOrder = async (orderData: OrderData) => {
  try {
    // Get the cart to ensure it exists
    const cart = await db.cart.findUnique({
      where: { id: orderData.cartId },
      include: { 
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              }
            },
            inventory: {
              select: {
                id: true,
                retailPrice: true,
                images: true,
              }
            }
          }
        }
      },
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Get user from session
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Prepare order items
    const orderItems = cart.items.map(item => ({
      productId: item.productId,
      inventoryId: item.inventoryId,
      price: Number(item.inventory.retailPrice),
      quantity: item.quantity,
      name: item.product.name,
      image: item.inventory.images && item.inventory.images.length > 0 
        ? item.inventory.images[0] 
        : null,
    }));

    // Add order notes with shipping and payment method
    const notes = `Shipping Method: ${orderData.shipping.method}, Payment Method: ${orderData.payment?.method || 'Not specified'}`;

    // Create the order
    const order = await db.order.create({
      data: {
        userId,
        cartId: cart.id,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping.cost,
        total: orderData.total,
        status: orderData.status ? OrderStatus[orderData.status as keyof typeof OrderStatus] || OrderStatus.PENDING : OrderStatus.PENDING,
        items: {
          create: orderItems
        },
        shippingAddress: JSON.stringify(orderData.shippingAddress),
        notes: notes,
      },
      include: {
        items: true,
      },
    });

    // We do NOT delete the cart here - it will be deleted after payment confirmation

    return { 
      success: true, 
      data: { 
        id: order.id,
        total: Number(order.total) 
      } 
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: error };
  }
}

export async function createOrderWithoutDeletingCart(data: OrderData) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return { success: false, error: "You must be logged in to create an order" }
    }
    
    const userId = session.user.id as string
    
    // Get cart items
    const cart = await db.cart.findUnique({
      where: { id: data.cartId },
      include: { 
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              }
            },
            inventory: {
              select: {
                id: true,
                retailPrice: true,
                images: true,
              }
            }
          }
        }
      },
    })
    
    if (!cart) {
      return { success: false, error: "Cart not found" }
    }
    
    if (cart.items.length === 0) {
      return { success: false, error: "Cart is empty" }
    }
    
    // Add notes with shipping and payment method information
    const notes = `Shipping Method: ${data.shipping.method}, Payment Method: ${data.payment?.method || 'Not specified'}`;

    // Create the order items array to insert
    const orderItems = cart.items.map((item) => ({
      productId: item.productId,
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      price: new Decimal(item.inventory.retailPrice),
      name: item.product.name,
      image: item.inventory.images?.[0] || null
    }))
    
    // Prepare address data with proper validation
    const addressData = {
      userId,
      street: data.shippingAddress.address || "",
      city: data.shippingAddress.city || "",
      state: data.shippingAddress.state || "",
      postalCode: data.shippingAddress.zipCode || "",
      country: data.shippingAddress.country || "",
    };
    
    // Log address data before creation with explicit zipCode value
    console.log("Preparing to create address with data:", {
      userId,
      street: addressData.street,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country,
      rawZipCode: data.shippingAddress.zipCode,  // Log the raw zipCode for debugging
      rawData: JSON.stringify(data.shippingAddress) // Log the full raw shipping data for debugging
    });
    
    // Create address record with explicit error handling
    let address;
    try {
      address = await db.address.create({
        data: addressData
      });
      
      // Verify address was created correctly
      const createdAddress = await db.address.findUnique({
        where: { id: address.id }
      });
      
      console.log("Address created successfully:", {
        id: createdAddress?.id,
        street: createdAddress?.street,
        city: createdAddress?.city,
        state: createdAddress?.state,
        postalCode: createdAddress?.postalCode, // Verify postal code was saved
        country: createdAddress?.country,
      });
    } catch (error) {
      console.error("Error creating address:", error);
      throw new Error(`Failed to create address: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Map payment status string to enum
    const paymentStatusValue = typeof data.payment?.status === 'string' 
      ? (data.payment.status === 'PENDING' || data.payment.status === 'pending' 
          ? PaymentStatus.PENDING 
          : PaymentStatus.PENDING) 
      : (data.payment?.status || PaymentStatus.PENDING);
    
    // Map order status string to enum
    const orderStatusValue = typeof data.status === 'string'
      ? (data.status === 'PENDING' || data.status === 'pending'
          ? OrderStatus.PENDING
          : OrderStatus.PENDING)
      : (data.status || OrderStatus.PENDING);
    
    // Create order
    const order = await db.order.create({
      data: {
        userId,
        addressId: address.id,
        status: orderStatusValue,
        shippingAddress: JSON.stringify(data.shippingAddress),
        shipping: new Decimal(data.shipping.cost),
        subtotal: new Decimal(data.subtotal),
        tax: new Decimal(data.tax),
        total: new Decimal(data.total),
        paymentIntent: data.payment?.providerId || null,
        notes: notes,
        items: {
          create: orderItems
        }
      },
    })
    
    // Update inventory quantities
    for (const item of cart.items) {
      await db.productInventory.update({
        where: { id: item.inventoryId },
        data: {
          quantity: {
            decrement: item.quantity
          }
        }
      })
    }
    
    // Create payment record if payment details are provided
    if (data.payment) {
      console.log("Creating payment record for order:", order.id, "with method:", data.payment.method);
      
      try {
        const payment = await db.payment.create({
          data: {
            orderId: order.id,
            amount: new Decimal(data.total),
            status: paymentStatusValue,
            provider: data.payment.method || "unknown",
            paymentId: data.payment.providerId || null,
          }
        });
        
        console.log("Payment record created successfully:", {
          id: payment.id,
          orderId: payment.orderId,
          provider: payment.provider,
          status: payment.status,
          amount: payment.amount.toString(),
        });
      } catch (error) {
        console.error("Error creating payment record:", error);
        // Don't throw here, just log the error to prevent order creation failure
      }
    } else {
      console.error("No payment details provided for order:", order.id);
    }

    // NOTE: We're not deleting the cart here, which is the key difference from createOrder
    
    // Convert Decimal objects to numbers for client component compatibility
    const serializedOrder = {
      ...order,
      shipping: Number(order.shipping),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      total: Number(order.total),
    }
    
    // Revalidate relevant paths
    revalidatePath("/shipping")
    revalidatePath("/cart")
    revalidatePath("/user/account/orders")
    
    return { success: true, data: serializedOrder }
  } catch (error) {
    console.error("Error creating order:", error)
    return { success: false, error: "Failed to create order" }
  }
} 

export async function createPayPalOrder(orderId: string): Promise<{ success: boolean, message: string, data?: string }> {
  try {
    const order = await fetchOrderById(orderId);
    
    // Handle potential issues with the order
    if (order.status !== 'PENDING') {
      return {
        success: false,
        message: `Order is already ${order.status.toLowerCase()}. Cannot create payment for a non-pending order.`
      };
    }
    
    console.log(`Creating PayPal order for order ID ${orderId} with amount ${Number(order.total)}`);
    
    // Create a PayPal order
    const paypalOrder = await paypal.createOrder(Number(order.total));
    
    if (!paypalOrder || !paypalOrder.id) {
      throw new Error("PayPal order creation failed - no order ID returned");
    }
    
    console.log(`PayPal order created successfully with ID: ${paypalOrder.id}`);
    
    // Return the PayPal order ID
    return {
      success: true,
      message: 'PayPal order created successfully',
      data: paypalOrder.id,
    };
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return handleError(error);
  }
}

export async function approvePayPalOrder(
  orderId: string,
  data: { orderID: string }
): Promise<{ success: boolean, message: string, redirectTo?: string }> {
  try {
    // Fetch the order to make sure it exists and is valid
    const order = await fetchOrderById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Check if the order has already been paid by fetching payment status
    const payment = await prisma.payment.findFirst({
      where: { orderId: orderId }
    });
    
    if (payment?.status === 'COMPLETED') {
      return {
        success: true,
        message: 'Payment was already processed',
        redirectTo: `/order-success?orderId=${orderId}`,
      };
    }
    
    // Capture the payment from PayPal
    const captureData = await paypal.capturePayment(data.orderID);
    console.log('Payment capture data:', captureData);
    
    if (!captureData || !captureData.id) {
      throw new Error('Failed to capture PayPal payment');
    }
    
    // Update order status and payment record in a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // First, update the order status to PROCESSING
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PROCESSING }
      });
      
      // Next, update or create the payment record
      if (payment?.id) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            paymentId: captureData.id,
            paymentResult: JSON.stringify({
              provider: "PayPal",
              transactionId: captureData.id,
              payerEmail: captureData.payer?.email_address || '',
              timestamp: new Date().toISOString(),
            }),
            lastUpdated: new Date()
          }
        });
      } else {
        await tx.payment.create({
          data: {
            orderId,
            amount: order.total,
            status: PaymentStatus.COMPLETED,
            provider: "PayPal",
            paymentId: captureData.id,
            paymentResult: JSON.stringify({
              provider: "PayPal",
              transactionId: captureData.id,
              payerEmail: captureData.payer?.email_address || '',
              timestamp: new Date().toISOString(),
            })
          }
        });
      }
      
      // Finally, update inventory quantities for each item in the order
      for (const item of order.items) {
        await tx.productInventory.update({
          where: { id: item.inventoryId },
          data: { 
            quantity: { 
              decrement: item.quantity 
            }
          }
        });
        
        console.log(`Decremented inventory for item ${item.inventoryId} by ${item.quantity}`);
      }
    });
    
    // Save payment result
    await savePaymentResult({
      orderId,
      paymentId: captureData.id,
      paymentProvider: "PayPal",
      amount: Number(order.total),
      status: "COMPLETED",
      details: JSON.stringify({
        provider: "PayPal",
        transactionId: captureData.id,
        payerEmail: captureData.payer?.email_address || '',
        timestamp: new Date().toISOString(),
      }),
    });
    
    // Return success
    return {
      success: true,
      message: 'Payment processed successfully',
      redirectTo: `/order-success?orderId=${orderId}`,
    };
  } catch (error) {
    console.error("Error approving PayPal payment:", error);
    return handleError(error);
  }
}

export async function updateOrderToPaid({
  orderId,
  paymentResult,
}: {
  orderId: string;
  paymentResult?: PaymentResult;
}): Promise<void> {

  const order = await fetchOrderById(orderId);

  // Check if order is already paid based on status
  if (order.status === 'DELIVERED' || order.status === 'SHIPPED') {
    throw new Error('Order is already processed');
  }

  // Transaction to update the order and update the product quantities
  await prisma.$transaction(async (tx) => {
      // Update all item quantities in the database
      for (const item of order.items) {
          await tx.product.update({
              where: { id: item.productId },
              data: { 
                inventories: {
                  update: {
                    where: { id: item.inventoryId },
                    data: { quantity: { decrement: item.quantity } }
                  }
                }
              },
          });
      }

      // Set the order to paid
      await tx.order.update({
          where: { id: orderId },
          data: {
              status: 'PROCESSING',
              updatedAt: new Date(),
              payment: {
                create: {
                  amount: order.total,
                  provider: paymentResult?.id ? 'PayPal' : 'COD', 
                  paymentId: paymentResult?.id,
                  paymentResult: paymentResult ? { paymentResult } : undefined,
                  status: 'COMPLETED'
                }
              }
          },
      });
  });

  // Get the updated order after the transaction
  const updatedOrder = await prisma.order.findFirst({
      where: {
          id: orderId,
      },
      include: {
          items: true,
          user: { select: { name: true, email: true } },
      },
  });

  if (!updatedOrder) {
      throw new Error('Order not found');
  }
};
  // sendPurchaseReceipt({
  //     order: {
  //         ...updatedOrder,
  //         orderItems: updatedOrder.orderItems.map(item => ({
  //             ...item,
  //             totalPrice: Number(item.totalPrice),
  //             unitPrice: Number(item.unitPrice),

  //         })),

  //         shippingAddress: updatedOrder.shippingAddress as ShippingAddress,
  //         paymentResult: updatedOrder.paymentResult as PaymentResult,
  //         itemsPrice: Number(updatedOrder.itemsPrice),
  //         shippingPrice: Number(updatedOrder.shippingPrice),
  //         taxPrice: Number(updatedOrder.taxPrice),
  //         totalPrice: Number(updatedOrder.totalPrice),
  //     },
  // });

// Add a new function to get order with items
export async function getOrderWithItems(orderId: string) {
  try {
    if (!orderId) {
      return { success: false, error: "Order ID is required" }
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        payment: true
      }
    })

    if (!order) {
      return { success: false, error: "Order not found" }
    }

    // Convert Decimal objects to numbers for client component compatibility
    const serializedOrder = {
      ...order,
      shipping: Number(order.shipping),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      total: Number(order.total),
      // Serialize order items, converting Decimal price to number
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        // Ensure image is a string or undefined, not null
        image: item.image || undefined
      })),
      payment: order.payment ? {
        ...order.payment,
        amount: Number(order.payment.amount)
      } : null
    }

    return { success: true, data: serializedOrder }
  } catch (error) {
    console.error("Error fetching order:", error)
    return { success: false, error: "Failed to fetch order" }
  }
}

