import { PortableText as SanityPortableText } from 'next-sanity'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'

const components = {
    types: {
        image: ({ value }: any) => (
            <div className="my-8">
                <Image
                    src={urlFor(value).width(800).height(600).url()}
                    alt={value.alt || 'Blog image'}
                    width={800}
                    height={600}
                    className="rounded-lg shadow-md"
                />
                {value.alt && (
                    <p className="text-sm text-gray-600 mt-2 text-center italic">
                        {value.alt}
                    </p>
                )}
            </div>
        ),
    },
    marks: {
        link: ({ children, value }: any) => {
            const rel = !value.href.startsWith('/') ? 'noreferrer noopener' : undefined
            return (
                <a
                    href={value.href}
                    rel={rel}
                    className="text-blue-600 hover:text-blue-800 underline"
                >
                    {children}
                </a>
            )
        },
    },
    block: {
        h1: ({ children }: any) => (
            <h1 className="text-4xl font-bold mb-6 text-gray-900">{children}</h1>
        ),
        h2: ({ children }: any) => (
            <h2 className="text-3xl font-bold mb-4 text-gray-900">{children}</h2>
        ),
        h3: ({ children }: any) => (
            <h3 className="text-2xl font-bold mb-3 text-gray-900">{children}</h3>
        ),
        h4: ({ children }: any) => (
            <h4 className="text-xl font-bold mb-2 text-gray-900">{children}</h4>
        ),
        normal: ({ children }: any) => (
            <p className="mb-6 text-gray-700 leading-relaxed">{children}</p>
        ),
        blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic my-6 text-gray-600">
                {children}
            </blockquote>
        ),
    },
    list: {
        bullet: ({ children }: any) => (
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
                {children}
            </ul>
        ),
        number: ({ children }: any) => (
            <ol className="list-decimal list-inside mb-6 text-gray-700 space-y-2">
                {children}
            </ol>
        ),
    },
    listItem: {
        bullet: ({ children }: any) => <li className="mb-2">{children}</li>,
        number: ({ children }: any) => <li className="mb-2">{children}</li>,
    },
}

interface PortableTextProps {
    value: any[]
    className?: string
}

export default function PortableText({ value, className = '' }: PortableTextProps) {
    return (
        <div className={`prose prose-lg max-w-none ${className}`}>
            <SanityPortableText value={value} components={components} />
        </div>
    )
} 