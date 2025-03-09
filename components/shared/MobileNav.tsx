"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileNavProps {
    items: {
        title: string;
        href: string;
    }[];
}

export function MobileNav({ items }: MobileNavProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[300px] pr-0">
                <SheetHeader className="px-4">
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10">
                    <div className="flex flex-col space-y-2 px-4">
                        {items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="block py-2 text-base font-medium transition-colors hover:text-primary"
                            >
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
} 