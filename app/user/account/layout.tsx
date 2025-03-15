"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
// import { auth } from "@/auth"

const navigation = [
    { name: "DASHBOARD", href: "/user/account" },
    { name: "ORDERS", href: "/user/account/orders" },
    { name: "ADDRESSES", href: "/user/account/address" },
    { name: "ACCOUNT DETAILS", href: "/user/account/acct-details" },
    { name: "WISHLIST", href: "/user/account/wishlist" },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    // const logout = await auth()

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="md:col-span-1">
                        <nav className="space-y-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "block px-3 py-2 text-sm font-normal transition-colors",
                                        pathname === item.href
                                            ? "text-primary border-l-2 border-primary"
                                            : "text-gray-600 hover:text-primary",
                                    )}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <button
                                onClick={() => { }}
                                className="block w-full text-left px-3 py-2 text-sm font-normal text-gray-600 hover:text-primary transition-colors"
                            >
                                LOGOUT
                            </button>
                            <Link href="/" className="text-primary hover:underline">
                                <Button className="mt-4">Go Back Home</Button>
                            </Link>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="md:col-span-3">{children}</main>
                </div>
            </div>
        </div>
    )
}

