"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShoppingBag,
    Tags,
    Users,
    ShoppingCart,
    Home
} from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const navItems = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard
    },
    {
        title: "Categories",
        href: "/admin/categories",
        icon: Tags
    },
    {
        title: "Products",
        href: "/admin/products",
        icon: ShoppingBag
    },
    {
        title: "Users",
        href: "/admin/users",
        icon: Users
    },
    {
        title: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart
    },
    {
        title: "Home",
        href: "/",
        icon: Home
    }
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed top-14 left-0 z-50 h-[calc(100vh-3.5rem)] w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:top-0 md:h-screen md:translate-x-0 md:static",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="space-y-4 py-4">
                    <div className="px-3 py-2">
                        <h2 className="mb-2 px-4 text-lg font-semibold">Admin Panel</h2>
                        <div className="space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    className={cn(
                                        "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                        pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
                                        item.title === "Home" ? "mt-4 text-muted-foreground hover:text-primary" : ""
                                    )}
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    <span>{item.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 