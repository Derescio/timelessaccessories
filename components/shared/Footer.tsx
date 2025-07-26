import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

const footerLinks = {
    shop: [

        { title: "Rings", href: "/products?category=cm8g42vkg000420us58yc4vhc" },
        { title: "Bracelets", href: "/products?category=cm8g42vld000620usw2uzntme" },
        { title: "Necklaces", href: "/products?category=cm8g42vis000220uspq6fi4uv" },
        { title: "Earrings", href: "/products?category=cmdi1i5m2000120ioqxw07q4r" },
        { title: "T-Shirts", href: "/amazon-merch" },
    ],
    support: [
        { title: "Contact Us", href: "/contact" },
        { title: "FAQs", href: "/faq" },


    ],
    company: [
        { title: "About Us", href: "/about" },
        { title: "Blog", href: "/blog" },
        { title: "Privacy Policy", href: "/privacy" },
        { title: "Terms of Service", href: "/terms" },
    ],
};

export function Footer() {
    return (
        <footer className="bg-zinc-800 py-12 text-white border-t-4 border-orange-400">
            <div className="container px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand and Social */}
                    <div className="space-y-4">
                        <Link href="/" className="inline-block">
                            <span className="text-xl font-bold">Shop-DW</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Elevate your style with timeless pieces that blend elegance with modern design.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-muted-foreground hover:text-foreground">
                                <Facebook className="h-5 w-5" />
                                <span className="sr-only">Facebook</span>
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground">
                                <Instagram className="h-5 w-5" />
                                <span className="sr-only">Instagram</span>
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground">
                                <Twitter className="h-5 w-5" />
                                <span className="sr-only">Twitter</span>
                            </a>
                        </div>
                    </div>

                    {/* Shop Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Shop</h3>
                        <ul className="space-y-2">
                            {footerLinks.shop.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground"
                                    >
                                        {link.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Support</h3>
                        <ul className="space-y-2">
                            {footerLinks.support.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground"
                                    >
                                        {link.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Company</h3>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground"
                                    >
                                        {link.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} Shop-DW. All rights reserved. <span className="text-blue-500"> | Powered by</span>  <Link href="https://www.opsedsolutions.com" className="text-blue-500 hover:underline">OPSED SOLUTIONS</Link></p>
                </div>
            </div>
        </footer>
    );
} 