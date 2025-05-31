export default function PayPalPaymentSuccessLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // This layout allows guest access to the PayPal payment success page
    // No authentication checks needed here since both guests and authenticated users
    // should be able to see their payment confirmation
    return <>{children}</>;
} 