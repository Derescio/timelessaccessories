'use client'
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { ShoppingCart, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./MobileNav";
import Logo from '../../public/images/Logo.png'
import Image from "next/image";
import ModeToggle from "./mode-toggle";
import { useSession, signOut } from "next-auth/react";
import UserButtonClient from "./user-button-client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const mainNavItems = [
    {
        title: "Home",
        href: "/",
    },
    {
        title: "Shop",
        href: "/products",
    },
    {
        title: "Blog",
        href: "/blog",
    },
    {
        title: "About",
        href: "/about",
    },
    {
        title: "Sale",
        href: "/sale",
    },
];

export function Header() {
    const { data: session } = useSession();
    const router = useRouter()
    // Create a function to refresh the session and page when the user is authenticated


    const refreshSession = async () => {

        if (session?.user) {
            router.refresh();
        }
    }

    useEffect(() => {
        refreshSession();
    }, [session]);


    return (
        <header className="sticky top-0 z-50 w-full mt-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between gap-4 px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <Image src={Logo} alt="Logo" width={300} height={500} />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex md:flex-1 md:justify-center">
                    <NavigationMenu>
                        <NavigationMenuList>
                            {mainNavItems.map((item) => (
                                <NavigationMenuItem key={item.href}>
                                    <Link href={item.href} legacyBehavior passHref>
                                        <NavigationMenuLink className={cn(navigationMenuTriggerStyle())}>
                                            {item.title}
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Search, Cart, and Profile */}
                <div className="flex items-center gap-4">
                    {/* <ModeToggle /> */}
                    {/* Search */}
                    <form className="hidden md:block w-full max-w-sm">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search products..."
                                className="pl-8 w-full md:w-[200px] lg:w-[300px]"
                            />
                        </div>
                    </form>

                    {/* Cart */}
                    <Button variant="ghost" size="icon" className="relative" asChild>
                        <Link href="/cart">
                            <ShoppingCart className="h-5 w-5" />
                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[11px] font-medium text-primary-foreground flex items-center justify-center">
                                0
                            </span>
                        </Link>
                    </Button>

                    {/* Profile */}
                    <UserButtonClient
                        session={session}
                        signOutAction={() => signOut()}
                    />

                    {/* Mobile Navigation */}
                    <div className="md:hidden">
                        <MobileNav items={mainNavItems} />
                    </div>
                </div>
            </div>
        </header>
    );
}