"use client";

import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";

interface MobileNavProps {
    items: {
        title: string;
        href: string;
    }[];
}

export function MobileNav({ items }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const debouncedSearch = useDebounce(searchQuery, 300);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (debouncedSearch.trim()) {
            router.push(`/products?search=${encodeURIComponent(debouncedSearch.trim())}`);
            setIsOpen(false); // Close mobile menu after search
        } else {
            router.push('/products');
            setIsOpen(false);
        }
    };

    const handleLinkClick = () => {
        setIsOpen(false); // Close mobile menu when navigating
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:text-black hover:bg-gray-100">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[350px] pr-0 bg-white">
                <SheetHeader className="px-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-semibold text-gray-900">Shop-DW</SheetTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="h-6 w-6 text-gray-500 hover:text-gray-700"
                        >
                            {/* <X className="h-4 w-4" /> */}
                        </Button>
                    </div>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-8rem)]">
                    <div className="px-6 py-4 space-y-6">
                        {/* Mobile Search */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Search</h3>
                            <form onSubmit={handleSearch}>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="search"
                                        placeholder="Search products..."
                                        className="pl-10 bg-gray-50 border-gray-200 focus:border-gray-400 focus:bg-white text-black placeholder:text-gray-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Navigation Links */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Navigation</h3>
                            <div className="space-y-1">
                                {items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={handleLinkClick}
                                        className="block px-4 py-3 text-base font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 hover:text-black rounded-lg transition-colors duration-200"
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
} 