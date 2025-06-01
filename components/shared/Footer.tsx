import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

const footerLinks = {
    shop: [

        { title: "Rings", href: "/products?category=cm8g42vkg000420us58yc4vhc" },
        { title: "Bracelets", href: "/products?category=cm8g42vld000620usw2uzntme" },
        { title: "Necklaces", href: "/products?category=cm8g42vis000220uspq6fi4uv" },
        { title: "Jewelry", href: "/products?category=cm8wftyg4000r20yg3d4ph4v0" },
        { title: "Electronics", href: "/products?category=cm8p9azze00172050qfw19hgj" },
    ],
    support: [
        { title: "Contact Us", href: "/contact" },
        { title: "FAQs", href: "/faq" },
        { title: "Shipping", href: "/shipping" },
        { title: "Returns", href: "/returns" },
        { title: "Size Guide", href: "/size-guide" },
    ],
    company: [
        { title: "About Us", href: "/about" },
        { title: "Blog", href: "/blog" },
        { title: "Careers", href: "/careers" },
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
                            <span className="text-xl font-bold">Timeless</span>
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
                    <p>© {new Date().getFullYear()} Timeless. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
} 