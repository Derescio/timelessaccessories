"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { OrderStatus, PaymentStatus } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

interface ShippingAddress {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode?: string
  country: string
}

interface ShippingMethod {
  method: string
  cost: number
}

interface PaymentInfo {
  method: string
  status: PaymentStatus | string
  providerId?: string
}

export interface OrderData {
  cartId: string
  shippingAddress: ShippingAddress
  shipping: ShippingMethod
  payment?: PaymentInfo
  subtotal: number
  tax: number
  total: number
  status?: OrderStatus | string
}

export async function createOrder(data: OrderData) {
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
        notes: `Shipping Method: ${data.shipping.method}, Payment Method: ${data.payment?.method || 'unknown'}`,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            price: item.inventory.retailPrice,
            name: item.product.name,
            image: Array.isArray(item.inventory.images) && item.inventory.images.length > 0 
              ? item.inventory.images[0] 
              : null,
          })),
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
      await db.payment.create({
        data: {
          orderId: order.id,
          amount: new Decimal(data.total),
          status: paymentStatusValue,
          provider: data.payment.method || "unknown",
          paymentId: data.payment.providerId || null,
        }
      })
    }

    // Clear the cart after successful order creation
    await db.cart.delete({
      where: { id: data.cartId }
    })
    
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