import FAQAccordion from "@/components/faq"

export default function FAQPage() {
    const faqSections = [
        {
            title: "Orders",
            items: [
                {
                    question: "How do I track my order?",
                    answer:
                        "Once your order is Shipped, you will receive a confirmation email with a tracking number. You can use this number to track your package on the carrier's website.",
                },
                {
                    question: "What payment methods do you accept?",
                    answer: "We accept all major credit cards via Stripe, we also accept PayPal.",
                },
                {
                    question: "Can I modify or cancel my order?",
                    answer:
                        "Unfortunately, we do not offer the ability to modify or cancel orders once they have been placed. Please consult our terms and conditions for more information.",
                },
            ],
        },
        {
            title: "Shipping",
            items: [
                {
                    question: "What are your shipping options?",
                    answer:
                        "We offer standard shipping with Canada Post, this allows us to ship to most countries worldwide. Shipping costs and delivery times vary by location.",
                },
                {
                    question: "Do you ship internationally?",
                    answer: "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location.",
                },
                {
                    question: "How long will it take to receive my order?",
                    answer:
                        "Standard shipping typically takes 3-5 business days within the Canada. International shipping can take 7-14 business days.",
                },
            ],
        },
    ]

    return (
        <div className="container mx-auto px-4 py-16">
            <FAQAccordion sections={faqSections} />
        </div>
    )
}

