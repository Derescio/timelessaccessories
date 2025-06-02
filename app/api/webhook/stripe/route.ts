import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order.actions';
import { sendOrderConfirmationEmail } from '@/email';
import { reduceActualStock } from '@/lib/actions/inventory.actions';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});

/**
 * Reduce stock for all items in an order after payment confirmation
 */
async function reduceOrderStock(orderId: string) {
  try {
    console.log(`🔄 reduceOrderStock: Starting for order: ${orderId}`);
    
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

    console.log(`📋 reduceOrderStock: Found ${orderItems.length} order items for order ${orderId}:`, 
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
      console.warn(`⚠️ reduceOrderStock: No order items found for order: ${orderId}`);
      return { success: false, error: "No order items found" };
    }

    // Reduce stock for each item
    const stockResults = [];
    for (const item of orderItems) {
      console.log(`🔄 reduceOrderStock: Processing item ${item.name} (${item.inventory.sku}):`, {
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
        console.log(`✅ reduceOrderStock: Successfully reduced ${item.quantity} stock for ${item.inventory.sku}`);
      } else {
        console.error(`❌ reduceOrderStock: Failed to reduce stock for ${item.inventory.sku}:`, result.error);
      }
    }

    const failedReductions = stockResults.filter(r => !r.success);
    
    if (failedReductions.length > 0) {
      console.error(`❌ reduceOrderStock: ${failedReductions.length} stock reductions failed:`, failedReductions);
      return { 
        success: false, 
        error: "Some stock reductions failed",
        failedItems: failedReductions
      };
    }

    console.log(`✅ reduceOrderStock: Successfully reduced stock for all ${orderItems.length} items in order ${orderId}`);
    return { success: true, reducedItems: stockResults.length };

  } catch (error) {
    console.error(`❌ reduceOrderStock: Error reducing stock for order ${orderId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const webhookSecret =
    process.env.NODE_ENV === 'development'
      ? 'whsec_test_12345678901234567890123456789012' // replace with your test secret
      : process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    // In development, allow test signatures for manual webhook testing
    if (process.env.NODE_ENV === 'development' && signature.includes('test_signature_for_local_development')) {
      console.log('🧪 Using test signature for local development');
      event = JSON.parse(rawBody);
      console.log(`✅ Received test Stripe event: ${event.type}`);
    } else {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret!);
      console.log(`✅ Received Stripe event: ${event.type}`);
    }
  } catch (err: any) {
    console.error('❌ Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  // Handle checkout.session.completed event (standard for Stripe Checkout)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    console.log(`🔄 WEBHOOK: Processing checkout.session.completed for order: ${orderId}`);
    console.log(`🔄 WEBHOOK: Session details:`, {
      id: session.id,
      paymentStatus: session.payment_status,
      paymentIntent: session.payment_intent,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total
    });

    if (!orderId || session.payment_status !== 'paid') {
      console.log(`⚠️ WEBHOOK: Incomplete session or missing order ID - Order: ${orderId}, Payment Status: ${session.payment_status}`);
      return NextResponse.json({ message: 'Checkout session incomplete or missing order ID' });
    }

    try {
      console.log(`📦 WEBHOOK: Updating order to paid: ${orderId}`);
      await updateOrderToPaid({
        orderId,
        paymentResult: {
          id: session.payment_intent as string,
          status: 'COMPLETED',
          email_address: session.customer_email || 'unknown@example.com',
          pricePaid: (session.amount_total! / 100).toFixed(2),
        },
      });
      console.log(`✅ WEBHOOK: Order updated successfully: ${orderId}`);

      // Reduce actual stock after payment confirmation
      console.log(`📦 WEBHOOK: About to reduce stock for confirmed order: ${orderId}`);
      const stockResult = await reduceOrderStock(orderId);
      
      console.log(`📊 WEBHOOK: Stock reduction result for order ${orderId}:`, {
        success: stockResult.success,
        error: stockResult.error,
        reducedItems: stockResult.reducedItems || 0
      });
      
      if (!stockResult.success) {
        console.error(`❌ WEBHOOK: Stock reduction failed for order ${orderId}:`, stockResult.error);
        // Log the error but don't fail the webhook - payment was successful
      } else {
        console.log(`✅ WEBHOOK: Stock reduced successfully for order: ${orderId}`);
      }

      console.log(`📧 WEBHOOK: Sending order confirmation email for: ${orderId}`);
      await sendOrderConfirmationEmail(orderId);
      console.log(`✅ WEBHOOK: Email sent successfully for order: ${orderId}`);

      return NextResponse.json({ 
        message: 'Order updated via checkout.session.completed',
        stockReduction: stockResult.success ? 'completed' : 'failed',
        orderId: orderId
      });
    } catch (error) {
      console.error(`❌ WEBHOOK: Error processing checkout.session.completed for order ${orderId}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        error: 'Failed to process checkout.session.completed', 
        details: errorMessage,
        orderId 
      }, { status: 500 });
    }
  }

  // Return success for unhandled events (including charge.succeeded) to prevent webhook failures
  console.log(`ℹ️ Received unhandled event type: ${event.type} - returning success to prevent webhook failure`);
  return NextResponse.json({ message: `Event ${event.type} received but not processed` });
}