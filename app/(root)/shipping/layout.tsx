import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ShippingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Redirect if not authenticated
    if (!session) {
        redirect("/sign-in?callbackUrl=/shipping");
    }

    // If authenticated, render the children
    return <>{children}</>;
} 