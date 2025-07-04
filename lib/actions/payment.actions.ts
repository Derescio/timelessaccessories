/**
 * Payment Actions Module
 * 
 * Known Bugs and Fixes:
 * 1. Type Safety Issues (2024-03-XX)
 *    - Bug: Using 'any' type in PaymentDataWithResult interface
 *    - Fix: Replaced 'any' with Record<string, unknown> for better type safety
 * 
 * 2. Unused Interface (2024-03-XX)
 *    - Bug: PaymentRequest interface was defined but never used
 *    - Fix: Removed unused PaymentRequest interface
 * 
 * 3. Function Parameters (2024-03-XX)
 *    - Bug: processPayment function had unused parameter
 *    - Fix: Removed unused paymentData parameter from processPayment function
 */

"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { PaymentStatus, OrderStatus } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import { PaymentResult } from "@/types/payment"

interface PaymentResultData {
  orderId: string
  paymentId: string
  paymentProvider: string
  amount: number
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | string
  details?: string
}

interface PaymentDataBase {
  orderId: string
  paymentId: string
  provider: string
  amount: Decimal
  status: PaymentStatus
}

interface PaymentDataWithResult extends PaymentDataBase {
  paymentResult: Record<string, unknown>
}

export async function savePaymentResult(data: PaymentResultData) {
  try {
    const { orderId, paymentId, paymentProvider, amount, status, details } = data
    
    // Map the input status to PaymentStatus enum
    const paymentStatusMap: Record<string, PaymentStatus> = {
      "PENDING": PaymentStatus.PENDING,
      "COMPLETED": PaymentStatus.COMPLETED,
      "FAILED": PaymentStatus.FAILED, 
      "REFUNDED": PaymentStatus.REFUNDED,
      "pending": PaymentStatus.PENDING,
      "completed": PaymentStatus.COMPLETED,
      "failed": PaymentStatus.FAILED, 
      "refunded": PaymentStatus.REFUNDED
    }
    
    // Create the base payment data object
    const basePaymentData: PaymentDataBase = {
      orderId,
      paymentId,
      provider: paymentProvider,
      amount: new Decimal(amount),
      status: paymentStatusMap[status] || PaymentStatus.PENDING,
    }
    
    // Save payment result to database with or without paymentResult
    const payment = await db.payment.upsert({
      where: { orderId },
      update: details 
        ? { 
            paymentId,
            provider: paymentProvider,
            amount: new Decimal(amount),
            status: paymentStatusMap[status] || PaymentStatus.PENDING,
            paymentResult: JSON.parse(details)
          }
        : {
            paymentId,
            provider: paymentProvider,
            amount: new Decimal(amount),
            status: paymentStatusMap[status] || PaymentStatus.PENDING,
          },
      create: details 
        ? { 
            ...basePaymentData,
            paymentResult: JSON.parse(details)
          } as PaymentDataWithResult
        : basePaymentData
    })
    
    // Update the order status based on payment status
    if (status === "completed" || status === "COMPLETED") {
      await db.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PROCESSING },
      })
    } else if (status === "failed" || status === "FAILED") {
      await db.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      })
    }
    
    // Revalidate relevant paths
    revalidatePath("/user/account/orders")
    revalidatePath(`/user/account/orders/${orderId}`)
    revalidatePath("/order-success")
    
    return { success: true, payment }
  } catch (error) {
    console.error("Error saving payment result:", error)
    return { success: false, error: "Failed to save payment result" }
  }
}

export async function processPayment(): Promise<PaymentResult> {
    try {
        // Process payment logic here
        // This is a placeholder implementation
        return {
            success: true,
            message: 'Payment processed successfully',
            data: {
                id: 'payment_123',
                status: 'completed',
                providerId: 'provider_123'
            }
        };
    } catch (error) {
        console.error('Error processing payment:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to process payment'
        };
    }
}

/**
 * Update order payment status
 */
export const updateOrderPaymentStatus = async ({
  orderId,
  status,
  paymentId,
  paymentMethod
}: {
  orderId: string;
  status: PaymentStatus;
  paymentId?: string;
  paymentMethod: string;
}) => {
  try {
    // Update order status
    await db.order.update({
      where: { id: orderId },
      data: { 
        status: status === PaymentStatus.COMPLETED ? OrderStatus.PROCESSING : OrderStatus.PENDING 
      }
    });
    
    // Update or create payment record
    await db.payment.upsert({
      where: { orderId },
      update: {
        status,
        paymentId: paymentId || undefined,
        provider: paymentMethod,
        updatedAt: new Date(),
      },
      create: {
        orderId,
        status,
        paymentId: paymentId || undefined,
        provider: paymentMethod,
        amount: new Decimal(0), // We'll get the actual amount from the order
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    // NOTE: Email sending is now handled explicitly in webhooks to avoid duplicates
    // and ensure proper error handling
    console.log(`✅ Payment status updated for order: ${orderId} - Email will be sent by webhook`);

    revalidatePath(`/order-success?orderId=${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return { success: false, error: error };
  }
}; 