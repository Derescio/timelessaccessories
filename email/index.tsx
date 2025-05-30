import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { SENDER_EMAIL, APP_NAME } from "@/lib/constants";
import PurchaseReceiptEmail from "@/email/purchase-receipts";

const resend = new Resend(process.env.RESEND_API_KEY as string);

export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
    // Fetch the order details from the database
    const order = await prisma.order.findUnique({
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
        throw new Error(`Order with ID ${orderId} not found`);
    }

    // Determine email and name for both authenticated and guest users
    const userEmail = order.user?.email || order.guestEmail;
    const userName = order.user?.name || "Customer";

    if (!userEmail) {
        throw new Error(`No email found for order ${orderId}. Cannot send confirmation email.`);
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
        orderItems: order.items.map((item) => ({
            name: item.name,
            qty: item.quantity,
            price: Number(item.price),
            totalPrice: Number(item.price) * item.quantity,
            image: item.image || "/placeholder.svg",
        })),
        shippingAddress: JSON.parse(order.shippingAddress as string),
        paymentMethod: order.payment?.provider || "Unknown",
    };

    // Send the email using Resend
    await resend.emails.send({
        from: `${APP_NAME} <${SENDER_EMAIL}>`,
        to: userEmail,
        subject: `Order Confirmation - ${formattedOrder.id}`,
        react: <PurchaseReceiptEmail order={formattedOrder} />,
    });
}