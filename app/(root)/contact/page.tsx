import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import ContactForm from '@/components/contact/contact-form'
import { Mail, Phone, MapPin, Clock, Instagram, Facebook, Twitter } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Contact Us | Shop-DW Accessories',
    description: 'Get in touch with us. We\'d love to hear from you and answer any questions you may have.',
}

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
            <div className="container mx-auto px-4">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Contact Us
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        We're here to help and answer any questions you might have.
                        We look forward to hearing from you.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Contact Information */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Contact Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Email</p>
                                        <a
                                            href="mailto:info@shop-dw.com"
                                            className="text-blue-600 hover:underline"
                                        >
                                            info@shop-dw.com
                                        </a>
                                    </div>
                                </div>

                                {/* <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Phone</p>
                                        <a
                                            href="tel:+1234567890"
                                            className="text-blue-600 hover:underline"
                                        >
                                            (123) 456-7890
                                        </a>
                                    </div>
                                </div> */}

                                {/* <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Address</p>
                                        <p className="text-sm text-muted-foreground">
                                            123 Business Street<br />
                                            Toronto, ON M1A 1A1<br />
                                            Canada
                                        </p>
                                    </div>
                                </div> */}

                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Business Hours</p>
                                        <p className="text-sm text-muted-foreground">
                                            9:00 AM - 6:00 PM<br />
                                            <br />

                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Social Media */}
                        {/* <Card>
                            <CardHeader>
                                <CardTitle>Follow Us</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4">
                                    <Link
                                        href="https://instagram.com"
                                        className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-shadow"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Instagram className="h-5 w-5" />
                                    </Link>
                                    <Link
                                        href="https://facebook.com"
                                        className="p-2 bg-blue-600 text-white rounded-full hover:shadow-lg transition-shadow"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Facebook className="h-5 w-5" />
                                    </Link>
                                    <Link
                                        href="https://twitter.com"
                                        className="p-2 bg-sky-500 text-white rounded-full hover:shadow-lg transition-shadow"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Twitter className="h-5 w-5" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card> */}

                        {/* Quick Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="font-medium">Response Time</p>
                                    <p className="text-sm text-muted-foreground">
                                        We typically respond within 24 hours
                                    </p>
                                </div>
                                {/* <Separator />
                                <div>
                                    <p className="font-medium">Order Support</p>
                                    <p className="text-sm text-muted-foreground">
                                        For order-related inquiries, please include your order number
                                    </p>
                                </div> */}
                                <Separator />
                                <div>
                                    <p className="font-medium">Returns & Exchanges</p>
                                    <p className="text-sm text-muted-foreground">
                                        <Link href="/returns" className="text-blue-600 hover:underline">
                                            View our return policy
                                        </Link>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <ContactForm />
                    </div>
                </div>

                {/* FAQ Section */}
                {/* <div className="mt-16 max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">How long does shipping take?</h3>
                                <p className="text-muted-foreground">
                                    Standard shipping typically takes 3-7 business days. Express shipping options are available at checkout.
                                </p>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="font-semibold mb-2">What is your return policy?</h3>
                                <p className="text-muted-foreground">
                                    We offer a 30-day return policy for unused items in original packaging.
                                    <Link href="/returns" className="text-blue-600 hover:underline ml-1">
                                        Learn more
                                    </Link>
                                </p>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="font-semibold mb-2">Do you offer international shipping?</h3>
                                <p className="text-muted-foreground">
                                    Yes, we ship worldwide. Shipping costs and delivery times vary by location.
                                </p>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="font-semibold mb-2">How can I track my order?</h3>
                                <p className="text-muted-foreground">
                                    Once your order ships, you'll receive a tracking number via email.
                                    You can also check your order status in your account dashboard.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div> */}
            </div>
        </div>
    )
}


