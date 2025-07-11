import { auth } from "@/auth";
import { redirect } from "next/navigation";
import StudioClient from "./studio-client";

export default async function StudioPage() {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        redirect("/sign-in?message=Admin access required");
    }

    return <StudioClient />;
} 