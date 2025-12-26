import { NextResponse } from "next/server";
import { updateOrderPaymentStatus } from "@/lib/actions/payment.actions";
import { cleanupCartAfterSuccessfulPayment } from "@/lib/actions/cart.actions";
import { sendOrderConfirmationEmail } from "@/email";
import { reduceActualStock } from "@/lib/actions/inventory.actions";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordPromotionUsage } from '@/lib/actions/promotions-actions';

/**
 * Verify PayPal webhook signature (for production use)
 */
async function verifyPayPalWebhook(headers: Headers, rawBody: string): Promise<boolean> {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.warn('⚠️ PAYPAL_WEBHOOK_ID not configured, skipping verification');
      return true; // Allow for development
    }

    // Get PayPal access token
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_APP_SECRET}`).toString('base64');
    const tokenResponse = await fetch(`${process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Verify webhook signature
    const verificationData = {
      webhook_id: webhookId,
      event_body: rawBody,
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_time: headers.get('paypal-transmission-time'),
      cert_url: headers.get('paypal-cert-url'),
      auth_algo: headers.get('paypal-auth-algo'),
      transmission_sig: headers.get('paypal-transmission-sig'),
    };

    const verifyResponse = await fetch(`${process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(verificationData),
    });

    const verifyResult = await verifyResponse.json();
    return verifyResult.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('❌ PayPal webhook verification failed:', error);
    return false;
  }
}

/**
 * Reduce stock for all items in an order after PayPal payment confirmation
 */
async function reduceOrderStock(orderId: string) {
  try {
    console.log(`🔄 PayPal reduceOrderStock: Starting for order: ${orderId}`);
    
    // Get order items
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      select: {
        id: true,
        inventoryId: true,
        quantity: true,
        name: true,
        inventory: {
          select: { 
            sku: true,
            quantity: true,
            reservedStock: true
          }
        }
      }
    });

    console.log(`📋 PayPal reduceOrderStock: Found ${orderItems.length} order items for order ${orderId}:`, 
      orderItems.map(item => ({
        id: item.id,
        inventoryId: item.inventoryId,
        sku: item.inventory.sku,
        name: item.name,
        orderQuantity: item.quantity,
        currentStock: item.inventory.quantity,
        currentReservedStock: item.inventory.reservedStock
      }))
    );

    if (orderItems.length === 0) {
      console.warn(`⚠️ PayPal reduceOrderStock: No order items found for order: ${orderId}`);
      return { success: false, error: "No order items found" };
    }

    // Reduce stock for each item
    const stockResults = [];
    for (const item of orderItems) {
      console.log(`🔄 PayPal reduceOrderStock: Processing item ${item.name} (${item.inventory.sku}):`, {
        inventoryId: item.inventoryId,
        orderQuantity: item.quantity,
        currentStock: item.inventory.quantity,
        currentReservedStock: item.inventory.reservedStock
      });

      const result = await reduceActualStock(item.inventoryId, item.quantity);
      stockResults.push({
        sku: item.inventory.sku,
        productName: item.name,
        quantity: item.quantity,
        success: result.success,
        error: result.error
      });
      
      if (result.success) {
        console.log(`✅ PayPal reduceOrderStock: Successfully reduced ${item.quantity} stock for ${item.inventory.sku}`);
      } else {
        console.error(`❌ PayPal reduceOrderStock: Failed to reduce stock for ${item.inventory.sku}:`, result.error);
      }
    }

    const failedReductions = stockResults.filter(r => !r.success);
    
    if (failedReductions.length > 0) {
      console.error(`❌ PayPal reduceOrderStock: ${failedReductions.length} stock reductions failed:`, failedReductions);
      return { 
        success: false, 
        error: "Some stock reductions failed",
        failedItems: failedReductions
      };
    }

    console.log(`✅ PayPal reduceOrderStock: Successfully reduced stock for all ${orderItems.length} items in order ${orderId}`);
    return { success: true, reducedItems: stockResults.length };

  } catch (error) {
    console.error(`❌ PayPal reduceOrderStock: Error reducing stock for order ${orderId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function POST(request: Request) {
  // Add comprehensive debugging for production
  const timestamp = new Date().toISOString();
  console.log(`🚀 PAYPAL WEBHOOK [${timestamp}]: Starting POST request processing`);
  console.log(`🌍 PAYPAL WEBHOOK [${timestamp}]: Environment: ${process.env.NODE_ENV}`);

  // Log incoming headers for debugging
  const headers = Object.fromEntries(request.headers.entries());
  console.log(`📋 PAYPAL WEBHOOK [${timestamp}]: Incoming headers:`, {
    'content-type': headers['content-type'],
    'user-agent': headers['user-agent'],
    'paypal-headers': Object.keys(headers).filter(key => key.toLowerCase().includes('paypal'))
  });

  try {
    // Get the raw request body
    const rawBody = await request.text();
    console.log(`📝 PAYPAL WEBHOOK [${timestamp}]: Raw body length: ${rawBody.length}`);
    console.log(`📝 PAYPAL WEBHOOK [${timestamp}]: Raw body preview: ${rawBody.substring(0, 200)}...`);

    const payload = JSON.parse(rawBody);

    console.log(`📊 PAYPAL WEBHOOK [${timestamp}]: Event type: ${payload.event_type}`);
    console.log(`📊 PAYPAL WEBHOOK [${timestamp}]: Event ID: ${payload.id || 'unknown'}`);
    console.log(`📊 PAYPAL WEBHOOK [${timestamp}]: Full payload structure:`, JSON.stringify(payload, null, 2));

    // In production, you should verify the webhook signature here
    const isVerified = await verifyPayPalWebhook(request.headers, rawBody);
    if (!isVerified) {
      console.error(`❌ PAYPAL WEBHOOK [${timestamp}]: Invalid signature`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Process webhook event
    if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      // Extract order ID from custom_id field in the payload
      const customId = payload.resource?.purchase_units?.[0]?.custom_id;

      console.log(`🔄 PAYPAL WEBHOOK [${timestamp}]: Processing PAYMENT.CAPTURE.COMPLETED for order: ${customId}`);
      console.log(`🔄 PAYPAL WEBHOOK [${timestamp}]: Payment details:`, {
        paymentId: payload.resource?.id,
        amount: payload.resource?.amount?.value,
        currency: payload.resource?.amount?.currency_code,
        status: payload.resource?.status,
        purchaseUnits: payload.resource?.purchase_units || []
      });

      if (customId) {
        try {
          // Check if payment was already processed (to avoid double stock reduction)
          const existingPayment = await prisma.payment.findFirst({
            where: { orderId: customId },
            select: { status: true }
          });

          const alreadyProcessed = existingPayment?.status === PaymentStatus.COMPLETED;
          
          if (alreadyProcessed) {
            console.log(`ℹ️ PAYPAL WEBHOOK [${timestamp}]: Payment already processed for order ${customId}, skipping stock reduction to avoid duplicates`);
          }

          // Update order and payment status
          console.log(`📦 PAYPAL WEBHOOK [${timestamp}]: Updating order payment status: ${customId}`);
          const updateResult = await updateOrderPaymentStatus({
            orderId: customId,
            status: PaymentStatus.COMPLETED,
            paymentId: payload.resource.id,
            paymentMethod: "PayPal"
          });

          if (!updateResult.success) {
            console.error(`❌ PAYPAL WEBHOOK [${timestamp}]: Failed to update order payment status:`, updateResult.error);
            return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
          }
          console.log(`✅ PAYPAL WEBHOOK [${timestamp}]: Order payment status updated successfully: ${customId}`);

          // Reduce actual stock after payment confirmation (only if not already processed)
          let stockResult: { success: boolean; error?: string; reducedItems?: number } | null = null;
          if (!alreadyProcessed) {
            console.log(`📦 PAYPAL WEBHOOK [${timestamp}]: About to reduce stock for confirmed order: ${customId}`);
            stockResult = await reduceOrderStock(customId);
          
            console.log(`📊 PAYPAL WEBHOOK [${timestamp}]: Stock reduction result for order ${customId}:`, {
              success: stockResult.success,
              error: stockResult.error,
              reducedItems: stockResult.reducedItems || 0
            });
            
            if (!stockResult.success) {
              console.error(`❌ PAYPAL WEBHOOK [${timestamp}]: Stock reduction failed for order ${customId}:`, stockResult.error);
              // Log the error but don't fail the webhook - payment was successful
            } else {
              console.log(`✅ PAYPAL WEBHOOK [${timestamp}]: Stock reduced successfully for order: ${customId}`);
            }
          } else {
            console.log(`ℹ️ PAYPAL WEBHOOK [${timestamp}]: Skipping stock reduction for order ${customId} (already processed by frontend)`);
          }

          // Clean up cart
          console.log(`🛒 PAYPAL WEBHOOK [${timestamp}]: Cleaning up cart for order: ${customId}`);
          try {
            const cartCleanupResult = await cleanupCartAfterSuccessfulPayment(customId);
            if (cartCleanupResult.success) {
              console.log(`✅ PAYPAL WEBHOOK [${timestamp}]: Cart cleaned up successfully for order: ${customId}`);
            } else {
              console.error(`❌ PAYPAL WEBHOOK [${timestamp}]: Cart cleanup failed for order ${customId}:`, cartCleanupResult.error);
            }
          } catch (cartError) {
            console.error(`❌ PAYPAL WEBHOOK [${timestamp}]: Error cleaning up cart for order ${customId}:`, cartError);
            // Don't fail the webhook for cart cleanup errors
          }

          // Explicitly send confirmation email (same as Stripe flow)
          console.log(`📧 PAYPAL WEBHOOK [${timestamp}]: Sending order confirmation email for: ${customId}`);
          try {
            await sendOrderConfirmationEmail(customId);
            console.log(`✅ PAYPAL WEBHOOK [${timestamp}]: Email sent successfully for order: ${customId}`);
          } catch (emailError) {
            console.error(`❌ PAYPAL WEBHOOK [${timestamp}]: Error sending email for order ${customId}:`, emailError);
            // Don't fail the webhook for email errors
          }

          // Record promotion usage if applicable
          console.log(`🎯 PAYPAL WEBHOOK [${timestamp}]: About to call recordPromotionUsage for order: ${customId}`);
          try {
            await recordPromotionUsage(customId);
            console.log(`✅ PAYPAL WEBHOOK [${timestamp}]: recordPromotionUsage completed for order: ${customId}`);
          } catch (promotionError) {
            console.error(`❌ PAYPAL WEBHOOK [${timestamp}]: Error in recordPromotionUsage for order ${customId}:`, promotionError);
            // Don't fail the webhook for promotion tracking errors
          }

          console.log(`✅ PAYPAL WEBHOOK [${timestamp}]: Successfully completed processing for order: ${customId}`);
          return NextResponse.json({ 
            received: true,
            message: 'PayPal payment processed successfully',
            stockReduction: alreadyProcessed ? 'skipped' : (stockResult?.success ? 'completed' : 'failed'),
            orderId: customId,
            timestamp: timestamp
          });
          
        } catch (error) {
          console.error(`❌ PAYPAL WEBHOOK [${timestamp}]: Error processing payment for order ${customId}:`, error);
          return NextResponse.json({ 
            error: "Payment processing failed",
            details: error instanceof Error ? error.message : 'Unknown error',
            orderId: customId,
            timestamp
          }, { status: 500 });
        }
      } else {
        console.error(`❌ PAYPAL WEBHOOK [${timestamp}]: Missing custom_id in PayPal webhook payload`);
        return NextResponse.json({ error: "Missing order ID in payload" }, { status: 400 });
      }
    }

    // Return success for other event types
    console.log(`ℹ️ PAYPAL WEBHOOK [${timestamp}]: Received unhandled event type: ${payload.event_type} - returning success`);
    return NextResponse.json({ 
      received: true,
      message: `Event ${payload.event_type} received but not processed`,
      timestamp: timestamp
    });

  } catch (error) {
    console.error(`❌ PAYPAL WEBHOOK [${timestamp}]: Webhook processing failed:`, error);
    return NextResponse.json(
      { 
        error: "Webhook processing failed",
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      },
      { status: 500 }
    );
  }
}