'use client'
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./MobileNav";
//import Logo from '/public/images/logo/SHOPDDWLogo.png'
import Logo from '@/public/images/logo/SHOPDDWLogo.png'
import Image from "next/image";
// import ModeToggle from "./mode-toggle";
import { useSession, signOut } from "next-auth/react";
import UserButtonClient from "./user-button-client";
import CartCount from "./CartCount";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

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
        title: "Merch Store",
        href: "/shopdw-merch",
    },
    {
        title: "Blog",
        href: "/blog",
    },
    {
        title: "About",
        href: "/about",
    },

];

export function Header() {
    const { data: session } = useSession();
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Handle search functionality
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (debouncedSearch.trim()) {
            router.push(`/products?search=${encodeURIComponent(debouncedSearch.trim())}`);
        } else {
            router.push('/products');
        }
    };

    // Create a function to refresh the session and page when the user is authenticated
    const refreshSession = async () => {
        if (session?.user) {
            router.refresh();
        }
    }

    // useEffect(() => {
    //     refreshSession();
    // }, [session]);


    return (
        <header className="sticky top-0 z-50 w-full bg-zinc-800  ">
            <div className="container flex h-16 items-center justify-between gap-4 px-4">
                <div className="flex items-center space-x-2">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <Image
                            src={Logo}
                            alt="Logo"
                            width={180}
                            height={90}
                            className="h-12 w-auto object-contain max-h-12 rounded-2xl"
                        />
                    </Link>
                    <h1 className="text-white  text-sm md:text-xl font-medium">SHOPDW</h1>
                </div>
                {/* Desktop Navigation */}
                <div className="hidden md:flex md:flex-1 md:justify-center">
                    <NavigationMenu>
                        <NavigationMenuList className="gap-1">
                            {mainNavItems.map((item) => (
                                <NavigationMenuItem key={item.href}>
                                    <Link href={item.href} legacyBehavior passHref>
                                        <NavigationMenuLink className={cn(
                                            navigationMenuTriggerStyle(),
                                            "bg-zinc-700/80 text-zinc-100 hover:bg-zinc-600 hover:text-white font-medium transition-all duration-200 border border-zinc-600/50"
                                        )}>
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
                    {/* Search */}
                    <form onSubmit={handleSearch} className="hidden md:block w-full max-w-sm">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search products..."
                                className="pl-8 w-full md:w-[200px] lg:w-[300px] bg-white/90 border-gray-200 focus:border-gray-400 text-black placeholder:text-gray-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </form>

                    {/* Cart */}
                    <CartCount />

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