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
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}