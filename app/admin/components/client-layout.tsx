"use client";

import { useState, useEffect } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { usePathname } from "next/navigation";

export function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on route change in mobile
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    return (
        <div className="relative min-h-screen">
            <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
                    {children}
                </main>
            </div>
        </div>
    );
} 