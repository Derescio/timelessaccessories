/**
 * WebSite JSON-LD component with SearchAction
 * Implements Schema.org WebSite with potentialAction for Google site search
 */

interface WebSiteJsonLdProps {
    name?: string;
    url?: string;
    searchActionUrl?: string;
}

export default function WebSiteJsonLd({
    name = 'Shop-DW',
    url = 'https://www.shop-dw.com',
    searchActionUrl = 'https://www.shop-dw.com/products?search={search_term_string}',
}: WebSiteJsonLdProps) {
    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name,
        url,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: searchActionUrl,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
    );
}

