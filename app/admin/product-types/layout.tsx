import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin | Product Types",
    description: "Manage product types",
};

export default function ProductTypesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
} 