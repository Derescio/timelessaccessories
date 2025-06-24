import React from "react";
import { db } from "@/lib/db";
import { Resend } from "resend";
import { SENDER_EMAIL, APP_NAME } from "@/lib/constants";
import PurchaseReceiptEmail from "@/email/purchase-receipts";
import ShippingConfirmationEmail from "@/email/shipping-confirmation";

const resend = new Resend(process.env.RESEND_API_KEY as string);

export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
    try {
        console.log(`📧 Starting email process for order: ${orderId}`);

        // Fetch the order details from the database
        const order = await db.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { name: true, email: true } },
                items: {
                    include: {
                        product: { select: { name: true } },
                    },
                },
                payment: true,
            },
        });

        if (!order) {
            console.error(`❌ Order not found: ${orderId}`);
            throw new Error(`Order with ID ${orderId} not found`);
        }

        console.log(`📋 Order found: ${orderId}, Items: ${order.items.length}`);

        // Determine email and name for both authenticated and guest users
        const userEmail = order.user?.email || order.guestEmail;
        const userName = order.user?.name || "Customer";

        console.log(`👤 Recipient: ${userName} <${userEmail}>`);

        if (!userEmail) {
            console.error(`❌ No email found for order ${orderId}`);
            throw new Error(`No email found for order ${orderId}. Cannot send confirmation email.`);
        }

        // Parse shipping address safely
        let shippingAddress;
        try {
            shippingAddress = JSON.parse(order.shippingAddress as string);
            console.log(`📍 Shipping address parsed successfully`);
        } catch (e) {
            console.error(`❌ Failed to parse shipping address for order ${orderId}:`, e);
            // Use fallback empty object
            shippingAddress = {};
        }

        // Format the order data for the email
        const formattedOrder = {
            id: order.id,
            user: {
                name: userName,
                email: userEmail,
            },
            createdAt: order.createdAt,
            totalPrice: Number(order.total),
            taxPrice: Number(order.tax),
            shippingPrice: Number(order.shipping),
            itemsPrice: Number(order.subtotal),
            orderItems: order.items.map((item) => {
                console.log(`📦 Processing item: ${item.name || 'Unknown item'}`);
                return {
                    name: item.name || 'Unknown Product',
                    qty: item.quantity,
                    price: Number(item.price),
                    totalPrice: Number(item.price) * item.quantity,
                    image: item.image || "/placeholder.svg",
                };
            }),
            shippingAddress,
            paymentMethod: order.payment?.provider || "Unknown",
        };

        console.log(`📧 Sending email via Resend...`);
        console.log(`From: ${APP_NAME} <${SENDER_EMAIL}>`);
        console.log(`To: ${userEmail}`);
        console.log(`Subject: Order Confirmation - ${formattedOrder.id}`);

        // Send the email using Resend
        const emailResult = await resend.emails.send({
            from: `${APP_NAME} <${SENDER_EMAIL}>`,
            to: userEmail,
            subject: `Order Confirmation - ${formattedOrder.id}`,
            react: React.createElement(PurchaseReceiptEmail, { order: formattedOrder }),
        });

        console.log(`✅ Email sent successfully for order ${orderId}:`, emailResult);

    } catch (error) {
        console.error(`❌ Failed to send order confirmation email for ${orderId}:`, error);

        // Log more details about the error
        if (error instanceof Error) {
            console.error(`Error message: ${error.message}`);
            console.error(`Error stack: ${error.stack}`);
        }

        // Re-throw the error so webhook can handle it
        throw error;
    }
}

export async function sendShippingConfirmationEmail(orderId: string, trackingNumber?: string): Promise<void> {
    try {
        console.log(`📦 Starting shipping confirmation email process for order: ${orderId}`);

        // Fetch the order details from the database
        const order = await db.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { name: true, email: true } },
                items: {
                    include: {
                        product: { select: { name: true } },
                    },
                },
                payment: true,
            },
        });

        if (!order) {
            console.error(`❌ Order not found: ${orderId}`);
            throw new Error(`Order with ID ${orderId} not found`);
        }

        console.log(`📋 Order found: ${orderId}, Items: ${order.items.length}`);

        // Determine email and name for both authenticated and guest users
        const userEmail = order.user?.email || order.guestEmail;
        const userName = order.user?.name || "Customer";

        console.log(`👤 Recipient: ${userName} <${userEmail}>`);

        if (!userEmail) {
            console.error(`❌ No email found for order ${orderId}`);
            throw new Error(`No email found for order ${orderId}. Cannot send shipping confirmation email.`);
        }

        // Parse shipping address safely
        let shippingAddress;
        try {
            shippingAddress = JSON.parse(order.shippingAddress as string);
            console.log(`📍 Shipping address parsed successfully`);
        } catch (e) {
            console.error(`❌ Failed to parse shipping address for order ${orderId}:`, e);
            // Use fallback empty object
            shippingAddress = {};
        }

        // Format the order data for the email
        const formattedOrder = {
            id: order.id,
            user: {
                name: userName,
                email: userEmail,
            },
            createdAt: order.createdAt,
            shippedDate: new Date(), // Current date as shipped date
            totalPrice: Number(order.total),
            taxPrice: Number(order.tax),
            shippingPrice: Number(order.shipping),
            itemsPrice: Number(order.subtotal),
            orderItems: order.items.map((item) => {
                console.log(`📦 Processing item: ${item.name || 'Unknown item'}`);
                return {
                    name: item.name || 'Unknown Product',
                    qty: item.quantity,
                    price: Number(item.price),
                    totalPrice: Number(item.price) * item.quantity,
                    image: item.image || "/placeholder.svg",
                };
            }),
            shippingAddress,
            trackingNumber: trackingNumber || order.trackingNumber || undefined,
        };

        console.log(`📧 Sending shipping confirmation email via Resend...`);
        console.log(`From: ${APP_NAME} <${SENDER_EMAIL}>`);
        console.log(`To: ${userEmail}`);
        console.log(`Subject: Your Order Has Shipped - ${formattedOrder.id}`);
        console.log(`Tracking Number: ${formattedOrder.trackingNumber || 'Not provided'}`);

        // Send the email using Resend
        const emailResult = await resend.emails.send({
            from: `${APP_NAME} <${SENDER_EMAIL}>`,
            to: userEmail,
            subject: `Your Order Has Shipped - ${formattedOrder.id}`,
            react: React.createElement(ShippingConfirmationEmail, { order: formattedOrder }),
        });

        console.log(`✅ Shipping confirmation email sent successfully for order ${orderId}:`, emailResult);

        // Update the order with tracking number if provided
        if (trackingNumber && trackingNumber !== order.trackingNumber) {
            await db.order.update({
                where: { id: orderId },
                data: {
                    trackingNumber: trackingNumber,
                    // Also update the updatedAt timestamp
                    updatedAt: new Date()
                }
            });
            console.log(`📝 Updated order ${orderId} with tracking number: ${trackingNumber}`);
        }

    } catch (error) {
        console.error(`❌ Failed to send shipping confirmation email for ${orderId}:`, error);

        // Log more details about the error
        if (error instanceof Error) {
            console.error(`Error message: ${error.message}`);
            console.error(`Error stack: ${error.stack}`);
        }

        // Re-throw the error so calling function can handle it
        throw error;
    }
}