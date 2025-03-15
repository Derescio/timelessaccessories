"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"

interface FAQItem {
    question: string
    answer: string
}

interface FAQSectionProps {
    title: string
    items: FAQItem[]
}

export default function FAQAccordion({ sections }: { sections: FAQSectionProps[] }) {
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

    const toggleItem = (sectionTitle: string, questionIndex: number) => {
        const key = `${sectionTitle}-${questionIndex}`
        setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-light text-center mb-12">FREQUENTLY ASKED QUESTIONS</h1>

            {sections.map((section) => (
                <div key={section.title} className="mb-8">
                    <h2 className="text-2xl font-light mb-6">{section.title}</h2>

                    <div className="space-y-4">
                        {section.items.map((item, index) => {
                            const isOpen = openItems[`${section.title}-${index}`]

                            return (
                                <div key={index} className="border rounded-lg">
                                    <button
                                        className="w-full flex items-center justify-between p-4 text-left"
                                        onClick={() => toggleItem(section.title, index)}
                                    >
                                        <span className="font-light">{item.question}</span>
                                        {isOpen ? <Minus size={20} className="text-primary" /> : <Plus size={20} />}
                                    </button>

                                    {isOpen && <div className="px-4 pb-4 text-gray-600">{item.answer}</div>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}

