import React from 'react';
import { formatCurrency } from '@/lib/utils';
import {
    Body,
    Column,
    Container,
    Heading,
    Html,
    Img,
    Preview,
    Row,
    Section,
    Tailwind,
    Text,
} from '@react-email/components';
import Link from 'next/link';




export default function PurchaseReceiptEmail({ order }: { order: any }) {
    const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

    return (
        <Html>
            <Preview>Order Confirmation</Preview>
            <Tailwind>
                <Body className="font-sans bg-white">
                    <Container className="max-w-xl">
                        <Heading>Order Confirmation</Heading>
                        <Section>
                            <Row>
                                <Column>
                                    <Text>Order ID: {order.id}</Text>
                                    <Text>Purchase Date: {dateFormatter.format(order.createdAt)}</Text>
                                    <Text>Total: {formatCurrency(order.totalPrice)}</Text>
                                </Column>
                            </Row>
                        </Section>
                        <Section>
                            {order.orderItems.map((item: any) => (
                                <Row key={item.name}>
                                    <Column>
                                        <Img src={item.image} alt={item.name} width="50" height="50" />
                                    </Column>
                                    <Column>
                                        <Text>{item.name}</Text>
                                        <Text>Quantity: {item.qty}</Text>
                                    </Column>
                                    <Column>
                                        <Text>{formatCurrency(item.totalPrice)}</Text>
                                    </Column>
                                </Row>
                            ))}
                        </Section>
                        <Section>
                            <Text>Shipping Details:</Text>
                            <Text>{order.shippingAddress.fullName}</Text>
                            <Text>{order.shippingAddress.address}</Text>
                            <Text>{order.shippingAddress.city}, {order.shippingAddress.state}</Text>
                            <Text>{order.shippingAddress.country}</Text>
                        </Section>

                        {/* Customer Support Section */}
                        <Section className="mt-8 p-4 bg-gray-50 rounded-lg">
                            <Heading className="text-lg mb-4">Need Help?</Heading>
                            <Text className="mb-2">
                                <strong>Questions about your order?</strong> Our support team is here to help!
                            </Text>
                            <Text className="mb-1">
                                📧 Email: <Link href="mLinkilto:info@shopdw.com" className="text-blue-600">info@shopdw.com</Link>
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
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
