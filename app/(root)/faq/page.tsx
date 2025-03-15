import FAQAccordion from "@/components/faq"

export default function FAQPage() {
    const faqSections = [
        {
            title: "Orders",
            items: [
                {
                    question: "How do I track my order?",
                    answer:
                        "Once your order is shipped, you will receive a confirmation email with a tracking number. You can use this number to track your package on our website or the carrier's website.",
                },
                {
                    question: "What payment methods do you accept?",
                    answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and Apple Pay.",
                },
                {
                    question: "Can I modify or cancel my order?",
                    answer:
                        "Orders can be modified or cancelled within 1 hour of placing them. Please contact our customer service team for assistance.",
                },
            ],
        },
        {
            title: "Shipping",
            items: [
                {
                    question: "What are your shipping options?",
                    answer:
                        "We offer free standard shipping on orders over $50, flat rate shipping for $49, and local pickup for $8.",
                },
                {
                    question: "Do you ship internationally?",
                    answer: "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location.",
                },
                {
                    question: "How long will it take to receive my order?",
                    answer:
                        "Standard shipping typically takes 3-5 business days within the US. International shipping can take 7-14 business days.",
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

