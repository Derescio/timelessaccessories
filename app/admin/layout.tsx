import { ClientLayout } from "./components/client-layout";
import { auth } from "@/auth"; // Your auth configuration
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        redirect("/sign-in?message=Admin access required");
    }

    // You can perform any server-side checks here
    if (session.user.role !== "ADMIN") {
        redirect("/");
    }

    return <ClientLayout>{children}</ClientLayout>;
} 