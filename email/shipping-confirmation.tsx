import React from 'react';
import { formatCurrency } from '@/lib/utils';
import {
    Body,
    Column,
    Container,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Tailwind,
    Text,
} from '@react-email/components';

interface ShippingConfirmationEmailProps {
    order: {
        id: string;
        user: {
            name: string;
            email: string;
        };
        createdAt: Date;
        totalPrice: number;
        orderItems: Array<{
            name: string;
            qty: number;
            price: number;
            totalPrice: number;
            image?: string;
        }>;
        shippingAddress: {
            fullName?: string;
            address?: string;
            city?: string;
            state?: string;
            country?: string;
            zipCode?: string;
        };
        trackingNumber?: string;
        shippedDate?: Date;
    };
}

export default function ShippingConfirmationEmail({ order }: ShippingConfirmationEmailProps) {
    const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

    return (
        <Html>
            <Preview>Your order has shipped! 📦</Preview>
            <Tailwind>
                <Body className="font-sans bg-white">
                    <Container className="max-w-xl">
                        {/* Header */}
                        <Section className="text-center mb-8">
                            <Heading className="text-2xl font-bold text-green-600 mb-2">
                                🚚 Your Order Has Shipped!
                            </Heading>
                            <Text className="text-lg text-gray-700">
                                Hi {order.user.name}, great news! Your order is on its way.
                            </Text>
                        </Section>

                        {/* Order Summary */}
                        <Section className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <Row>
                                <Column>
                                    <Text className="font-semibold">Order ID:</Text>
                                    <Text className="text-gray-700">{order.id}</Text>
                                </Column>
                                <Column>
                                    <Text className="font-semibold">Order Date:</Text>
                                    <Text className="text-gray-700">{dateFormatter.format(order.createdAt)}</Text>
                                </Column>
                            </Row>
                            <Row className="mt-2">
                                <Column>
                                    <Text className="font-semibold">Shipped Date:</Text>
                                    <Text className="text-gray-700">
                                        {order.shippedDate ? dateFormatter.format(order.shippedDate) : dateFormatter.format(new Date())}
                                    </Text>
                                </Column>
                                <Column>
                                    <Text className="font-semibold">Total:</Text>
                                    <Text className="text-gray-700">{formatCurrency(order.totalPrice)}</Text>
                                </Column>
                            </Row>
                        </Section>

                        {/* Tracking Information */}
                        {order.trackingNumber && (
                            <Section className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <Heading className="text-lg font-bold text-blue-800 mb-3">
                                    📍 Track Your Package
                                </Heading>
                                <Text className="font-semibold text-blue-700">Tracking Number:</Text>
                                <Text className="text-xl font-mono bg-white p-2 rounded border text-center">
                                    {order.trackingNumber}
                                </Text>
                                <div className="text-center mt-4">
                                    <Link
                                        href={`https://www.canadapost-postescanada.ca/track-reperage/en#/details/${order.trackingNumber}`}
                                        className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        🔍 Track Your Package
                                    </Link>
                                </div>
                                <Text className="text-sm text-blue-600 mt-3 text-center">
                                    Click the button above to track your package on Canada Post's website, or use the tracking number with your shipping carrier.
                                </Text>
                                <Text className="text-xs text-gray-500 mt-2 text-center">
                                    Direct link: <Link
                                        href={`https://www.canadapost-postescanada.ca/track-reperage/en#/details/${order.trackingNumber}`}
                                        className="text-blue-600 underline"
                                    >
                                        https://www.canadapost-postescanada.ca/track-reperage/en#/details/{order.trackingNumber}
                                    </Link>
                                </Text>
                            </Section>
                        )}

                        {/* Order Items */}
                        <Section className="mb-6">
                            <Heading className="text-lg font-bold mb-4">Items Shipped:</Heading>
                            {order.orderItems.map((item, index) => (
                                <Row key={index} className="mb-4 pb-4 border-b border-gray-200">
                                    <Column className="w-16">
                                        {item.image && (
                                            <Img
                                                src={item.image}
                                                alt={item.name}
                                                width="50"
                                                height="50"
                                                className="rounded"
                                            />
                                        )}
                                    </Column>
                                    <Column className="pl-4">
                                        <Text className="font-medium">{item.name}</Text>
                                        <Text className="text-gray-600">Quantity: {item.qty}</Text>
                                    </Column>
                                    <Column className="text-right">
                                        <Text className="font-medium">{formatCurrency(item.totalPrice)}</Text>
                                    </Column>
                                </Row>
                            ))}
                        </Section>

                        {/* Shipping Address */}
                        <Section className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <Heading className="text-lg font-bold mb-3">Shipping Address:</Heading>
                            <Text>{order.shippingAddress.fullName}</Text>
                            <Text>{order.shippingAddress.address}</Text>
                            <Text>
                                {order.shippingAddress.city}
                                {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                                {order.shippingAddress.zipCode && ` ${order.shippingAddress.zipCode}`}
                            </Text>
                            <Text>{order.shippingAddress.country}</Text>
                        </Section>

                        {/* Delivery Information */}
                        <Section className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <Heading className="text-lg font-bold text-yellow-800 mb-2">
                                ⏰ Estimated Delivery
                            </Heading>
                            <Text className="text-yellow-700">
                                Your package should arrive within 3-7 business days from the ship date.
                                Delivery times may vary based on your location and shipping method.
                            </Text>
                        </Section>

                        {/* Customer Support Section */}
                        <Section className="mt-8 p-4 bg-gray-50 rounded-lg">
                            <Heading className="text-lg mb-4">Need Help?</Heading>
                            <Text className="mb-2">
                                <strong>Questions about your shipment?</strong> Our support team is here to help!
                            </Text>
                            <Text className="mb-1">
                                📧 Email: <Link href="mailto:info@shopdw.com" className="text-blue-600">info@shopdw.com</Link>
                            </Text>
                            <Text className="mb-1">
                                🌐 Visit: <Link href="https://www.shop-dw.com/contact" className="text-blue-600">shop-dw.com/contact</Link>
                            </Text>
                            <Text className="mb-1">
                                📞 Phone: (555) 123-4567
                            </Text>
                            <Text className="text-sm text-gray-600 mt-4">
                                Please do not reply to this email - we won't receive your message. Use the contact methods above instead.
                            </Text>
                        </Section>

                        {/* Footer */}
                        <Section className="text-center mt-6 pt-4 border-t border-gray-200">
                            <Text className="text-sm text-gray-500">
                                Thank you for shopping with us! We hope you love your purchase.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
} 