import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Terms of Service - Shop-DW',
    description: 'Terms of Service for Shop-DW - Legal terms and conditions for using our e-commerce platform.',
}

const TermsOfService = () => {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Terms of Service</h1>

            <div className="prose prose-lg max-w-none">
                <p className="text-gray-600 mb-6">
                    <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
                </p>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Agreement to Terms</h2>
                        <p className="text-gray-700 mb-4">
                            Welcome to ShopDW ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our website,
                            mobile application, and related services (collectively, the "Service") operated by ShopDW.
                        </p>
                        <p className="text-gray-700 mb-4">
                            By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms,
                            then you may not access the Service.
                        </p>
                        <p className="text-gray-700">
                            We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page.
                            Your continued use of the Service after any modifications indicates your acceptance of the new Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Account Registration</h2>
                        <p className="text-gray-700 mb-3">When you create an account with us, you must provide information that is accurate, complete, and current at all times.</p>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">2.1 Account Responsibilities</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>You are responsible for safeguarding your account credentials</li>
                            <li>You must not share your account with others</li>
                            <li>You must notify us immediately of any unauthorized use of your account</li>
                            <li>You are responsible for all activities that occur under your account</li>
                            <li>You must be at least 18 years old to create an account</li>
                        </ul>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">2.2 Account Termination</h3>
                        <p className="text-gray-700 mb-4">
                            We reserve the right to suspend or terminate your account at any time for violations of these Terms or for any other reason
                            at our sole discretion. You may also delete your account at any time through your account settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. Products and Services</h2>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">3.1 Product Information</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>We strive to provide accurate product descriptions, images, and pricing</li>
                            <li>Colors and appearance may vary due to monitor settings and lighting</li>
                            <li>We reserve the right to correct any errors in product information</li>
                            <li>Product availability is subject to change without notice</li>
                            <li>We do not guarantee that products will be available when you place an order</li>
                        </ul>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">3.2 Pricing and Availability</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>All prices are displayed in USD unless otherwise specified</li>
                            <li>Prices are subject to change without notice</li>
                            <li>We reserve the right to limit quantities available for purchase</li>
                            <li>Special offers and promotions may have additional terms and conditions</li>
                            <li>We may discontinue products at any time without notice</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Orders and Payments</h2>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">4.1 Order Process</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>An order is not confirmed until you receive an order confirmation email</li>
                            <li>We reserve the right to refuse or cancel any order for any reason</li>
                            <li>All orders are subject to product availability</li>
                            <li>You will receive email notifications about your order status</li>
                            <li>Order modifications or cancellations must be requested immediately</li>
                        </ul>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">4.2 Payment Terms</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>Payment is due at the time of order placement</li>
                            <li>We accept major credit cards, PayPal, and other payment methods as displayed</li>
                            <li>All payments are processed securely through our payment partners</li>
                            <li>You authorize us to charge your payment method for the total amount</li>
                            <li>You are responsible for any fees charged by your payment provider</li>
                        </ul>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">4.3 Taxes and Fees</h3>
                        <p className="text-gray-700 mb-4">
                            You are responsible for all applicable taxes, duties, and fees. Tax amounts will be calculated and displayed
                            at checkout based on your shipping address and local tax rates.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Shipping and Delivery</h2>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">5.1 Shipping Policy</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>Shipping costs and delivery times are displayed at checkout</li>
                            <li>Delivery times are estimates and not guaranteed</li>
                            <li>We are not responsible for delays caused by shipping carriers</li>
                            <li>Risk of loss transfers to you upon delivery to the carrier</li>
                            <li>You must provide accurate shipping information</li>
                        </ul>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">5.2 International Shipping</h3>
                        <p className="text-gray-700 mb-4">
                            International orders may be subject to customs duties, taxes, and fees imposed by the destination country.
                            These charges are the responsibility of the recipient and are not included in our shipping costs.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Returns and Refunds Policy</h2>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">6.1 No Returns or Refunds</h3>
                        <p className="text-gray-700 mb-4">
                            <strong>All sales are final.</strong> We do not accept returns or provide refunds for any products purchased through our Service.
                            This policy applies to all items regardless of condition, size, or reason for dissatisfaction.
                        </p>
                        <p className="text-gray-700 mb-4">
                            Due to our business model and the absence of a return processing facility, we are unable to accept returned merchandise.
                            We encourage you to carefully review product descriptions, sizes, and specifications before making a purchase.
                        </p>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">6.2 Incorrect Items Policy</h3>
                        <p className="text-gray-700 mb-4">
                            <strong>Exception for Shipping Errors:</strong> If we send you an incorrect item due to our fulfillment error,
                            we will send you the correct item at no additional cost once the error has been verified.
                        </p>

                        <h4 className="text-lg font-medium mb-3 text-gray-800">6.2.1 Verification Process</h4>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>Contact us immediately upon receiving an incorrect item</li>
                            <li>Provide your order number and details of the discrepancy</li>
                            <li>Submit clear photos of the item received and packaging</li>
                            <li>Our team will verify the shipping error within 1-2 business days</li>
                            <li>Once verified, we will expedite the correct item to you at no charge</li>
                        </ul>

                        <h4 className="text-lg font-medium mb-3 text-gray-800">6.2.2 Important Notes</h4>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>You may keep the incorrect item - no return is required</li>
                            <li>This policy only applies to verified fulfillment errors on our part</li>
                            <li>Customer ordering mistakes (wrong size, color, etc.) are not covered</li>
                            <li>Claims must be made within 7 days of delivery</li>
                            <li>We reserve the right to investigate and verify all claims</li>
                        </ul>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">6.3 Damaged Items</h3>
                        <p className="text-gray-700 mb-4">
                            If you receive a damaged item, please contact us immediately with photos of the damage.
                            We will work with you to resolve the issue, which may include sending a replacement item
                            depending on the nature and extent of the damage.
                        </p>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">6.4 Order Cancellation</h3>
                        <p className="text-gray-700 mb-4">
                            Orders may be cancelled only if they have not yet been processed for shipment.
                            Once an order has been processed and shipped, it cannot be cancelled and this no-return policy applies.
                        </p>
                        <p className="text-gray-700">
                            To request order cancellation, contact us immediately after placing your order.
                            We cannot guarantee cancellation if the order has already entered our fulfillment process.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. User Content and Reviews</h2>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">7.1 User-Generated Content</h3>
                        <p className="text-gray-700 mb-3">You may submit reviews, comments, and other content. By submitting content, you:</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>Grant us a non-exclusive, worldwide, royalty-free license to use your content</li>
                            <li>Represent that the content is original and does not infringe on third-party rights</li>
                            <li>Agree that the content does not contain illegal or harmful material</li>
                            <li>Understand that we may moderate, edit, or remove content at our discretion</li>
                        </ul>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">7.2 Prohibited Content</h3>
                        <p className="text-gray-700 mb-3">You may not submit content that is:</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>Defamatory, abusive, or harassing</li>
                            <li>Fraudulent or misleading</li>
                            <li>Violates intellectual property rights</li>
                            <li>Contains viruses or malicious code</li>
                            <li>Promotes illegal activities</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Intellectual Property</h2>
                        <p className="text-gray-700 mb-4">
                            All content on our Service, including text, graphics, logos, images, and software, is the property of
                            TimelessAccessories or its licensors and is protected by copyright, trademark, and other intellectual property laws.
                        </p>
                        <p className="text-gray-700 mb-4">
                            You may not reproduce, distribute, modify, or create derivative works from our content without our express written permission.
                        </p>
                        <p className="text-gray-700">
                            If you believe your intellectual property rights have been violated, please contact us with details of the alleged infringement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Prohibited Uses</h2>
                        <p className="text-gray-700 mb-3">You may not use our Service to:</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>Violate any applicable laws or regulations</li>
                            <li>Impersonate another person or entity</li>
                            <li>Transmit viruses or malicious code</li>
                            <li>Engage in unauthorized data collection or scraping</li>
                            <li>Interfere with or disrupt the Service or servers</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Use the Service for commercial purposes without authorization</li>
                            <li>Engage in fraudulent or deceptive practices</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Disclaimer of Warranties</h2>
                        <p className="text-gray-700 mb-4">
                            Our Service is provided on an "as is" and "as available" basis. We make no warranties, express or implied,
                            including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
                        </p>
                        <p className="text-gray-700 mb-4">
                            We do not warrant that the Service will be uninterrupted, error-free, or completely secure. You use the Service at your own risk.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Limitation of Liability</h2>
                        <p className="text-gray-700 mb-4">
                            In no event shall TimelessAccessories, its officers, directors, employees, or agents be liable for any indirect,
                            incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data,
                            use, goodwill, or other intangible losses.
                        </p>
                        <p className="text-gray-700 mb-4">
                            Our total liability to you for all damages shall not exceed the amount you paid for the products or services
                            that gave rise to the claim, or $100, whichever is greater.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. Indemnification</h2>
                        <p className="text-gray-700 mb-4">
                            You agree to indemnify, defend, and hold harmless TimelessAccessories and its affiliates, officers, directors,
                            employees, and agents from and against any and all claims, damages, obligations, losses, liabilities, costs,
                            and expenses arising from:
                        </p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>Your use of the Service</li>
                            <li>Your violation of these Terms</li>
                            <li>Your violation of any third-party rights</li>
                            <li>Any content you submit or transmit</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">13. Privacy Policy</h2>
                        <p className="text-gray-700 mb-4">
                            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service,
                            to understand our practices regarding the collection and use of your personal information.
                        </p>
                        <p className="text-gray-700">
                            <Link href="/privacy" className="text-blue-600 hover:underline">View our Privacy Policy</Link>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">14. Governing Law and Jurisdiction</h2>
                        <p className="text-gray-700 mb-4">
                            These Terms shall be governed by and construed in accordance with the laws of [Your State/Country],
                            without regard to its conflict of law provisions.
                        </p>
                        <p className="text-gray-700">
                            Any disputes arising under these Terms shall be resolved in the courts of [Your Jurisdiction],
                            and you consent to the personal jurisdiction of such courts.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">15. Dispute Resolution</h2>
                        <p className="text-gray-700 mb-4">
                            We encourage you to contact us first to resolve any disputes. If we cannot resolve a dispute through
                            direct communication, you agree to attempt to resolve the dispute through mediation before pursuing litigation.
                        </p>
                        <p className="text-gray-700">
                            For disputes involving claims of $10,000 or less, you may choose to resolve the dispute through binding arbitration.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">16. Force Majeure</h2>
                        <p className="text-gray-700">
                            We shall not be liable for any failure or delay in performance under these Terms which is due to fire, flood,
                            earthquake, pandemic, government action, war, terrorism, or other causes beyond our reasonable control.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">17. Severability</h2>
                        <p className="text-gray-700">
                            If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions
                            shall continue in full force and effect.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">18. Entire Agreement</h2>
                        <p className="text-gray-700">
                            These Terms constitute the entire agreement between you and TimelessAccessories regarding your use of the Service
                            and supersede all prior and contemporaneous agreements and understandings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">19. Contact Information</h2>
                        <p className="text-gray-700 mb-3">
                            If you have any questions about these Terms of Service, please contact us:
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700 mb-2"><strong>Email:</strong> info@shop-dw.com</p>
                            <p className="text-gray-700 mb-2"><strong>Subject Line:</strong> Terms of Service Inquiry</p>
                            <p className="text-gray-700">
                                <strong>Contact Form:</strong> You can also reach us through our <Link href="/contact" className="text-blue-600 hover:underline">contact page</Link>
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">20. Acknowledgment</h2>
                        <p className="text-gray-700">
                            By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default TermsOfService