"use server"

// import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client"
import { PaymentResult } from "@/types"
import { paypal } from "../paypal/paypal"
import { Decimal } from "@prisma/client/runtime/library"
import { prisma } from "../prisma"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { savePaymentResult } from "@/lib/actions/payment.actions"
import { cleanupCartAfterSuccessfulPayment } from "@/lib/actions/cart.actions"
import { sendOrderConfirmationEmail } from "@/email"

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

// Define serialized order type
interface SerializedOrder {
    id: string;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    user: {
        id: string;
        name: string;
        email: string;
    };
    items: Array<{
        id: string;
        name?: string;
        price: number;
        quantity: number;
        image?: string | null;
        attributes?: Record<string, string>;
        product: {
            id: string;
            name: string;
        };
        inventory?: {
            id: string;
            sku: string;
            attributeValues?: Array<{
                value: string;
                attribute: {
                    name: string;
                };
            }>;
        };
    }>;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode?: string;
        country: string;
    } | null;
    shippingAddress?: Record<string, string | undefined>;
    payment?: {
        id: string;
        provider: string;
        status: string;
    } | null;
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
  const order = await prisma.order.findFirst({
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
    const cart = await prisma.cart.findUnique({
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
                attributes: true,
                attributeValues: {
                  include: {
                    attribute: true
                  }
                }
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

    // Prepare order items with attributes
    const orderItems = cart.items.map(item => {
      // Format attributes for storage
      const attributeData: Record<string, string> = {};
      
      // Add attributes from the JSON field
      if (item.inventory.attributes) {
        Object.assign(attributeData, item.inventory.attributes);
      }
      
      // Add attributes from the attributeValues relation
      if (item.inventory.attributeValues) {
        item.inventory.attributeValues.forEach(attrValue => {
          attributeData[attrValue.attribute.displayName] = attrValue.value;
        });
      }
      
      return {
        productId: item.productId,
        inventoryId: item.inventoryId,
        price: Number(item.inventory.retailPrice),
        quantity: item.quantity,
        name: item.product.name,
        image: item.inventory.images && item.inventory.images.length > 0
          ? item.inventory.images[0]
          : null,
        attributes: attributeData,
      };
    });

    // Add order notes with shipping and payment method
    const notes = `Shipping Method: ${orderData.shipping.method}, Payment Method: ${orderData.payment?.method || 'Not specified'}`;

    // Create the order
    const order = await prisma.order.create({
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
    const cart = await prisma.cart.findUnique({
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
                attributes: true,
                attributeValues: {
                  include: {
                    attribute: true
                  }
                }
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
    const orderItems = cart.items.map((item) => {
      // Format attributes for storage
      const attributeData: Record<string, string> = {};
      
      // Add attributes from the JSON field
      if (item.inventory.attributes) {
        Object.assign(attributeData, item.inventory.attributes);
      }
      
      // Add attributes from the attributeValues relation
      if (item.inventory.attributeValues) {
        item.inventory.attributeValues.forEach(attrValue => {
          attributeData[attrValue.attribute.displayName] = attrValue.value;
        });
      }
      
      return {
        productId: item.productId,
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        price: Number(item.inventory.retailPrice),
        name: item.product.name,
        image: item.inventory.images?.[0] || null,
        attributes: attributeData,
      };
    })

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
      address = await prisma.address.create({
        data: addressData
      });

      // Verify address was created correctly
      const createdAddress = await prisma.address.findUnique({
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
    const order = await prisma.order.create({
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
      await prisma.productInventory.update({
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
        const payment = await prisma.payment.create({
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
        // If paymentResult contains an ID, use it as the chargeId
        chargeId: paymentResult?.id,
        payment: {
          upsert: {
            create: {
              amount: order.total,
              provider: paymentResult?.id ? 'Stripe' : 'COD',
              paymentId: paymentResult?.id,
              paymentResult: paymentResult ? paymentResult : undefined,
              status: 'COMPLETED'
            },
            update: {
              status: 'COMPLETED',
              paymentId: paymentResult?.id,
              paymentResult: paymentResult ? paymentResult : undefined,
            }
          }
        }
      }
    });
  });

  // Clean up the cart after successful payment
  await cleanupCartAfterSuccessfulPayment(orderId);

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
  await sendOrderConfirmationEmail(orderId);
};

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        inventory: {
          include: {
            attributeValues: {
              include: {
                attribute: true
              }
            }
          }
        }
      }
    },
    user: {
      select: {
        name: true,
        email: true
      }
    },
    payment: true
  }
}>;

// Add a new function to get order with items
export async function getOrderWithItems(orderId: string) {
  try {
    if (!orderId) {
      return { success: false, error: "Order ID is required" }
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            inventory: {
              include: {
                attributeValues: {
                  include: {
                    attribute: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        },
        payment: true
      }
    }) as OrderWithItems | null;

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
      items: order.items.map(item => {
        // Format attributes for display
        let attributeData: Record<string, string> = {};
        
        // Get attributes from the inventory's attributeValues
        if (item.inventory?.attributeValues) {
          item.inventory.attributeValues.forEach(attrValue => {
            attributeData[attrValue.attribute.displayName] = attrValue.value;
          });
        }
        
        return {
          ...item,
          price: Number(item.price),
          // Ensure image is a string or undefined, not null
          image: item.image || undefined,
          // Add the formatted attributes
          attributes: attributeData,
          // Serialize inventory data
          inventory: item.inventory ? {
            ...item.inventory,
            retailPrice: Number(item.inventory.retailPrice),
            compareAtPrice: item.inventory.compareAtPrice ? Number(item.inventory.compareAtPrice) : null,
            costPrice: Number(item.inventory.costPrice),
          } : null
        };
      }),
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

/**
 * Creates a Stripe payment intent for an order
 * @param orderId The ID of the order to create a payment for
 * @returns Object containing success status, message, and client secret if successful
 */
export async function createStripePaymentIntent(orderId: string): Promise<{
  success: boolean;
  message: string;
  clientSecret?: string;
  requiresAuth?: boolean;
}> {
  try {
    // Validate orderId
    if (!orderId) {
      return {
        success: false,
        message: 'Order ID is required'
      };
    }

    console.log(`Creating Stripe payment intent for order ID: ${orderId}`);

    // Import SERVER_URL from constants
    const { SERVER_URL } = await import('@/lib/constants');
    const url = `${SERVER_URL}/api/payments/stripe`;
    console.log(`Sending request to: ${url}`);

    // Call the API endpoint to create a payment intent with absolute URL
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
      credentials: 'include', // Include cookies for authentication
    });

    console.log(`Stripe API response status: ${response.status}`);
    console.log(`Stripe API response status text: ${response.statusText}`);

    // Handle authentication errors specifically
    if (response.status === 401) {
      console.error('Authentication required for creating payment intent');
      return {
        success: false,
        message: 'Please log in to complete your payment',
        requiresAuth: true
      };
    }

    if (!response.ok) {
      // Try to parse error from response
      let errorMessage = 'Failed to create Stripe payment intent';
      try {
        const errorData = await response.json();
        console.error('Error data from Stripe API:', errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Stripe payment intent result:', JSON.stringify(result, null, 2));

    if (!result.success || !result.clientSecret) {
      throw new Error(result.error || 'Failed to create Stripe payment intent');
    }

    console.log('Stripe payment intent created successfully');

    return {
      success: true,
      message: 'Stripe payment intent created successfully',
      clientSecret: result.clientSecret,
    };
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    return handleError(error);
  }
}

interface GetOrdersParams {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    search?: string;
}

interface GetOrdersResponse {
    success: boolean;
    data?: {
        orders: SerializedOrder[];
        total: number;
        totalPages: number;
        currentPage: number;
    };
    error?: string;
}

export async function getOrders({
    page = 1,
    limit = 10,
    status,
    search,
}: GetOrdersParams): Promise<GetOrdersResponse> {
    try {
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.OrderWhereInput = {
            ...(status && { status }),
            ...(search && {
                OR: [
                    { id: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { userId: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { user: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
                    { user: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } },
                ],
            }),
        };

        // Get total count
        const total = await prisma.order.count({ where });

        // Get orders with related data
        const orders = await prisma.order.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        inventory: {
                            select: {
                                id: true,
                                sku: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        });

        // Convert Decimal objects to numbers
        const serializedOrders = orders.map(order => ({
            ...order,
            subtotal: Number(order.subtotal),
            tax: Number(order.tax),
            shipping: Number(order.shipping),
            total: Number(order.total),
            items: order.items.map(item => ({
                ...item,
                price: Number(item.price),
            })),
        })) as unknown as SerializedOrder[];

        return {
            success: true,
            data: {
                orders: serializedOrders,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
            },
        };
    } catch (error) {
        console.error("Error fetching orders:", error);
        return {
            success: false,
            error: "Failed to fetch orders",
        };
    }
}

interface GetOrderByIdResponse {
    success: boolean;
    data?: SerializedOrder;
    error?: string;
}

export async function getOrderById(id: string): Promise<GetOrderByIdResponse> {
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        inventory: {
                            select: {
                                id: true,
                                sku: true,
                                attributeValues: {
                                    include: {
                                        attribute: true
                                    }
                                }
                            },
                        },
                    },
                },
                address: true,
            },
        });

        if (!order) {
            return {
                success: false,
                error: "Order not found",
            };
        }

        // Convert Decimal objects to numbers and parse attributes
        const serializedOrder = {
            ...order,
            subtotal: Number(order.subtotal),
            tax: Number(order.tax),
            shipping: Number(order.shipping),
            total: Number(order.total),
            items: order.items.map(item => ({
                ...item,
                price: Number(item.price),
                attributes: item.attributes ? JSON.parse(JSON.stringify(item.attributes)) : undefined,
            })),
        } as SerializedOrder;

        return {
            success: true,
            data: serializedOrder,
        };
    } catch (error) {
        console.error("Error fetching order:", error);
        return {
            success: false,
            error: "Failed to fetch order",
        };
    }
}

interface UpdateOrderStatusParams {
    id: string;
    status: OrderStatus;
}

interface UpdateOrderStatusResponse {
    success: boolean;
    data?: SerializedOrder;
    error?: string;
}

export async function updateOrderStatus({
    id,
    status,
}: UpdateOrderStatusParams): Promise<UpdateOrderStatusResponse> {
    try {
        const order = await prisma.order.update({
            where: { id },
            data: { status },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        inventory: {
                            select: {
                                id: true,
                                sku: true,
                            },
                        },
                    },
                },
                address: true,
            },
        });

        // Convert Decimal objects to numbers
        const serializedOrder = {
            ...order,
            subtotal: Number(order.subtotal),
            tax: Number(order.tax),
            shipping: Number(order.shipping),
            total: Number(order.total),
            items: order.items.map(item => ({
                ...item,
                price: Number(item.price),
            })),
        } as unknown as SerializedOrder;

        revalidatePath("/admin/orders");
        revalidatePath(`/admin/orders/${id}`);

        return {
            success: true,
            data: serializedOrder,
        };
    } catch (error) {
        console.error("Error updating order status:", error);
        return {
            success: false,
            error: "Failed to update order status",
        };
    }
}

interface DeleteOrderResponse {
    success: boolean;
    error?: string;
}

export async function deleteOrder(id: string): Promise<DeleteOrderResponse> {
    try {
        await prisma.order.delete({
            where: { id },
        });

        revalidatePath("/admin/orders");

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error deleting order:", error);
        return {
            success: false,
            error: "Failed to delete order",
        };
    }
}

