/**
 * Article JSON-LD component for blog posts
 * Implements Schema.org Article
 */

interface ArticleJsonLdProps {
    headline: string;
    description?: string;
    image?: string | string[];
    datePublished: string; // ISO 8601 format
    dateModified?: string; // ISO 8601 format
    author: {
        name: string;
        url?: string;
    };
    publisher?: {
        name: string;
        logo?: string;
    };
    url: string;
    mainEntityOfPage?: string;
}

export default function ArticleJsonLd({
    headline,
    description,
    image,
    datePublished,
    dateModified,
    author,
    publisher = {
        name: 'Shop-DW',
        logo: 'https://www.shop-dw.com/logo.png', // Update with actual logo URL
    },
    url,
    mainEntityOfPage,
}: ArticleJsonLdProps) {
    const articleSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline,
        url,
        datePublished,
    };

    if (description) {
        articleSchema.description = description;
    }

    if (image) {
        articleSchema.image = Array.isArray(image) ? image : [image];
    }

    if (dateModified) {
        articleSchema.dateModified = dateModified;
    } else {
        articleSchema.dateModified = datePublished;
    }

    articleSchema.author = {
        '@type': 'Person',
        name: author.name,
        ...(author.url && { url: author.url }),
    };

    articleSchema.publisher = {
        '@type': 'Organization',
        name: publisher.name,
        ...(publisher.logo && {
            logo: {
                '@type': 'ImageObject',
                url: publisher.logo,
            },
        }),
    };

    if (mainEntityOfPage) {
        articleSchema.mainEntityOfPage = {
            '@type': 'WebPage',
            '@id': mainEntityOfPage,
        };
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
    );
}

