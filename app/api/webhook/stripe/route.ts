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
    console.log(`🔄 Reducing stock for order: ${orderId}`);
    
    // Get order items
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      select: {
        inventoryId: true,
        quantity: true,
        name: true,
        inventory: {
          select: { sku: true }
        }
      }
    });

    if (orderItems.length === 0) {
      console.warn(`⚠️ No order items found for order: ${orderId}`);
      return { success: false, error: "No order items found" };
    }

    // Reduce stock for each item
    const stockResults = [];
    for (const item of orderItems) {
      console.log(`🔄 About to reduce stock for:`, {
        inventoryId: item.inventoryId,
        sku: item.inventory.sku,
        productName: item.name,
        quantity: item.quantity
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
        console.log(`✅ Successfully reduced ${item.quantity} stock for ${item.inventory.sku}`);
      } else {
        console.error(`❌ Failed to reduce stock for ${item.inventory.sku}:`, result.error);
      }
    }

    const failedReductions = stockResults.filter(r => !r.success);
    
    if (failedReductions.length > 0) {
      console.error(`❌ ${failedReductions.length} stock reductions failed:`, failedReductions);
      return { 
        success: false, 
        error: "Some stock reductions failed",
        failedItems: failedReductions
      };
    }

    console.log(`✅ Successfully reduced stock for all ${orderItems.length} items in order ${orderId}`);
    return { success: true, reducedItems: stockResults.length };

  } catch (error) {
    console.error(`❌ Error reducing stock for order ${orderId}:`, error);
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

  // Handle charge.succeeded event
  if (event.type === 'charge.succeeded') {
    const charge = event.data.object as Stripe.Charge;
    const orderId = charge.metadata?.orderId;

    console.log(`🔄 Processing charge.succeeded for order: ${orderId}`);

    if (!orderId) {
      console.error('❌ Missing orderId in charge metadata');
      return NextResponse.json({ error: 'Missing orderId in charge metadata' }, { status: 400 });
    }

    try {
      // Check if order has already been processed to prevent duplicate processing
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { 
          paymentIntent: true,
          payment: {
            select: { status: true }
          }
        }
      });

      if (existingOrder?.paymentIntent || existingOrder?.payment?.status === 'COMPLETED') {
        console.log(`⚠️ Order ${orderId} already processed via charge.succeeded (paymentIntent: ${existingOrder.paymentIntent}, payment status: ${existingOrder.payment?.status}), skipping duplicate processing`);
        return NextResponse.json({ 
          message: 'Order already processed via charge.succeeded',
          orderId,
          alreadyProcessed: true
        });
      }

      console.log(`📦 Updating order to paid: ${orderId}`);
      await updateOrderToPaid({
        orderId,
        paymentResult: {
          id: charge.id,
          status: 'COMPLETED',
          email_address: charge.billing_details.email || 'unknown@example.com',
          pricePaid: (charge.amount / 100).toFixed(2),
        },
      });
      console.log(`✅ Order updated successfully: ${orderId}`);

      // Reduce actual stock after payment confirmation
      console.log(`📦 Reducing stock for confirmed order: ${orderId}`);
      const stockResult = await reduceOrderStock(orderId);
      if (!stockResult.success) {
        console.error(`❌ Stock reduction failed for order ${orderId}:`, stockResult.error);
        // Log the error but don't fail the webhook - payment was successful
      } else {
        console.log(`✅ Stock reduced successfully for order: ${orderId}`);
      }

      console.log(`📧 Sending order confirmation email for: ${orderId}`);
      await sendOrderConfirmationEmail(orderId);
      console.log(`✅ Email sent successfully for order: ${orderId}`);

      return NextResponse.json({ 
        message: 'Order updated and confirmed via charge.succeeded',
        stockReduction: stockResult.success ? 'completed' : 'failed'
      });
    } catch (error) {
      console.error(`❌ Error processing charge.succeeded for order ${orderId}:`, error);
      
      // Return detailed error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        error: 'Failed to process charge.succeeded', 
        details: errorMessage,
        orderId 
      }, { status: 500 });
    }
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    console.log(`🔄 Processing checkout.session.completed for order: ${orderId}`);

    if (!orderId || session.payment_status !== 'paid') {
      console.log(`⚠️ Incomplete session or missing order ID - Order: ${orderId}, Payment Status: ${session.payment_status}`);
      return NextResponse.json({ message: 'Checkout session incomplete or missing order ID' });
    }

    try {
      // Check if order has already been processed to prevent duplicate processing
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { 
          paymentIntent: true,
          payment: {
            select: { status: true }
          }
        }
      });

      if (existingOrder?.paymentIntent || existingOrder?.payment?.status === 'COMPLETED') {
        console.log(`⚠️ Order ${orderId} already processed via checkout.session.completed (paymentIntent: ${existingOrder.paymentIntent}, payment status: ${existingOrder.payment?.status}), skipping duplicate processing`);
        return NextResponse.json({ 
          message: 'Order already processed via checkout.session.completed',
          orderId,
          alreadyProcessed: true
        });
      }

      console.log(`📦 Updating order to paid: ${orderId}`);
      await updateOrderToPaid({
        orderId,
        paymentResult: {
          id: session.payment_intent as string,
          status: 'COMPLETED',
          email_address: session.customer_email || 'unknown@example.com',
          pricePaid: (session.amount_total! / 100).toFixed(2),
        },
      });
      console.log(`✅ Order updated successfully: ${orderId}`);

      // Reduce actual stock after payment confirmation
      console.log(`📦 Reducing stock for confirmed order: ${orderId}`);
      const stockResult = await reduceOrderStock(orderId);
      if (!stockResult.success) {
        console.error(`❌ Stock reduction failed for order ${orderId}:`, stockResult.error);
        // Log the error but don't fail the webhook - payment was successful
      } else {
        console.log(`✅ Stock reduced successfully for order: ${orderId}`);
      }

      console.log(`📧 Sending order confirmation email for: ${orderId}`);
      await sendOrderConfirmationEmail(orderId);
      console.log(`✅ Email sent successfully for order: ${orderId}`);

      return NextResponse.json({ 
        message: 'Order updated via checkout.session.completed',
        stockReduction: stockResult.success ? 'completed' : 'failed'
      });
    } catch (error) {
      console.error(`❌ Error processing checkout.session.completed for order ${orderId}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        error: 'Failed to process checkout.session.completed', 
        details: errorMessage,
        orderId 
      }, { status: 500 });
    }
  }

  console.log(`ℹ️ Received unhandled event type: ${event.type}`);
  return NextResponse.json({ message: `Unhandled event: ${event.type}` });
}