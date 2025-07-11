import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Privacy Policy - TimelessAccessories',
    description: 'Privacy Policy for TimelessAccessories - Learn how we collect, use, and protect your personal information.',
}

const PrivacyPage = () => {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Privacy Policy</h1>

            <div className="prose prose-lg max-w-none">
                <p className="text-gray-600 mb-6">
                    <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
                </p>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Introduction</h2>
                        <p className="text-gray-700 mb-4">
                            Welcome to ShopDW. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy explains how we collect, use, and safeguard your information when you visit our website
                            and use our services.
                        </p>
                        <p className="text-gray-700">
                            This policy applies to all information collected through our website, mobile applications, and related services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Information We Collect</h2>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">2.1 Personal Information</h3>
                        <p className="text-gray-700 mb-3">We collect the following types of personal information:</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li><strong>Account Information:</strong> Name, email address, password, phone number</li>
                            <li><strong>Profile Information:</strong> Profile picture, preferences, wishlist items</li>
                            <li><strong>Billing Information:</strong> Billing address, payment method details</li>
                            <li><strong>Shipping Information:</strong> Shipping addresses, delivery preferences</li>
                            <li><strong>Communication:</strong> Messages, reviews, ratings, customer support inquiries</li>
                        </ul>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">2.2 Order and Transaction Data</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>Purchase history and order details</li>
                            <li>Cart contents and saved items</li>
                            <li>Payment information (processed securely through Stripe and PayPal)</li>
                            <li>Shipping and delivery information</li>
                            <li>Returns and refund requests</li>
                        </ul>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">2.3 Technical Information</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>IP address and location data</li>
                            <li>Browser type and version</li>
                            <li>Device information and operating system</li>
                            <li>Cookies and tracking technologies</li>
                            <li>Website usage and navigation patterns</li>
                        </ul>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">2.4 Third-Party Authentication</h3>
                        <p className="text-gray-700">
                            When you sign in using third-party services (Google, GitHub), we receive basic profile information
                            as permitted by those services and your privacy settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. How We Use Your Information</h2>
                        <p className="text-gray-700 mb-3">We use your information for the following purposes:</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li><strong>Order Processing:</strong> Processing payments, fulfilling orders, and managing deliveries</li>
                            <li><strong>Account Management:</strong> Creating and managing your account, authentication, and security</li>
                            <li><strong>Customer Service:</strong> Responding to inquiries, providing support, and resolving issues</li>
                            <li><strong>Personalization:</strong> Customizing your shopping experience and product recommendations</li>
                            <li><strong>Communications:</strong> Sending order confirmations, shipping notifications, and promotional emails</li>
                            <li><strong>Analytics:</strong> Understanding usage patterns and improving our services</li>
                            <li><strong>Legal Compliance:</strong> Complying with legal obligations and protecting our rights</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Information Sharing and Disclosure</h2>
                        <p className="text-gray-700 mb-3">We may share your information in the following circumstances:</p>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">4.1 Service Providers</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li><strong>Payment Processing:</strong> Stripe and PayPal for secure payment processing</li>
                            <li><strong>Email Services:</strong> Resend for transactional and marketing emails</li>
                            <li><strong>Shipping Partners:</strong> Logistics companies for order fulfillment</li>
                            <li><strong>Analytics Providers:</strong> For website performance and user behavior analysis</li>
                            <li><strong>Cloud Services:</strong> Hosting and database providers for data storage</li>
                        </ul>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">4.2 Legal Requirements</h3>
                        <p className="text-gray-700 mb-4">
                            We may disclose your information if required by law, court order, or government regulation,
                            or to protect our rights, property, or safety.
                        </p>

                        <h3 className="text-xl font-medium mb-3 text-gray-800">4.3 Business Transfers</h3>
                        <p className="text-gray-700">
                            In the event of a merger, acquisition, or sale of assets, your information may be transferred
                            to the new entity, subject to the same privacy protections.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Data Security</h2>
                        <p className="text-gray-700 mb-3">We implement appropriate security measures to protect your information:</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>Encryption of sensitive data in transit and at rest</li>
                            <li>Secure authentication and authorization systems</li>
                            <li>Regular security audits and vulnerability assessments</li>
                            <li>Limited access to personal data on a need-to-know basis</li>
                            <li>Secure payment processing through certified providers</li>
                        </ul>
                        <p className="text-gray-700">
                            However, no method of transmission over the internet or electronic storage is 100% secure.
                            We cannot guarantee absolute security of your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Your Privacy Rights</h2>
                        <p className="text-gray-700 mb-3">You have the following rights regarding your personal information:</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Rectification:</strong> Correct inaccurate or incomplete information</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                            <li><strong>Restriction:</strong> Limit how we process your data</li>
                            <li><strong>Objection:</strong> Object to processing for direct marketing purposes</li>
                            <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
                        </ul>
                        <p className="text-gray-700">
                            To exercise these rights, please contact us using the information provided in the "Contact Us" section.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Cookies and Tracking Technologies</h2>
                        <p className="text-gray-700 mb-3">We use cookies and similar technologies to:</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>Remember your preferences and settings</li>
                            <li>Maintain your shopping cart contents</li>
                            <li>Analyze website usage and performance</li>
                            <li>Provide personalized content and recommendations</li>
                            <li>Enable social media features</li>
                        </ul>
                        <p className="text-gray-700">
                            You can control cookie preferences through your browser settings, but this may affect
                            the functionality of our website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Data Retention</h2>
                        <p className="text-gray-700 mb-3">We retain your personal information for as long as necessary to:</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>Provide our services and maintain your account</li>
                            <li>Comply with legal obligations</li>
                            <li>Resolve disputes and enforce agreements</li>
                            <li>Maintain business records for tax and audit purposes</li>
                        </ul>
                        <p className="text-gray-700">
                            When no longer needed, we will securely delete or anonymize your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. International Data Transfers</h2>
                        <p className="text-gray-700">
                            Your information may be transferred to and processed in countries other than your own.
                            We ensure appropriate safeguards are in place to protect your data in accordance with
                            this privacy policy and applicable laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Children's Privacy</h2>
                        <p className="text-gray-700">
                            Our services are not intended for children under 13 years of age. We do not knowingly
                            collect personal information from children under 13. If you believe we have inadvertently
                            collected such information, please contact us to have it removed.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Marketing Communications</h2>
                        <p className="text-gray-700 mb-3">
                            We may send you marketing communications about our products and services. You can:
                        </p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700">
                            <li>Opt out of marketing emails by clicking the unsubscribe link</li>
                            <li>Adjust your communication preferences in your account settings</li>
                            <li>Contact us to update your preferences</li>
                        </ul>
                        <p className="text-gray-700">
                            Note that you cannot opt out of transactional emails related to your orders and account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. Changes to This Privacy Policy</h2>
                        <p className="text-gray-700">
                            We may update this privacy policy from time to time. We will notify you of any material
                            changes by posting the new policy on our website and updating the "Effective Date" at the
                            top of this page. Your continued use of our services after any changes constitutes acceptance
                            of the updated policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">13. Contact Us</h2>
                        <p className="text-gray-700 mb-3">
                            If you have any questions about this privacy policy or our privacy practices, please contact us:
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700 mb-2"><strong>Email:</strong> info@shop-dw.com</p>

                            <p className="text-gray-700">
                                <strong>Contact Form:</strong> You can also reach us through our <Link href="/contact" className="text-blue-600 hover:underline">contact page</Link>
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default PrivacyPage
