export default function StripePaymentSuccessLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // This layout allows guest access to the payment success page
    // No authentication checks needed here since both guests and authenticated users
    // should be able to see their payment confirmation
    return <>{children}</>;
} 