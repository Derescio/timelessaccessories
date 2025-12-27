/**
 * Organization JSON-LD component for structured data
 * Implements Schema.org Organization
 */

interface OrganizationJsonLdProps {
    name?: string;
    url?: string;
    logo?: string;
    contactPoint?: {
        telephone?: string;
        contactType?: string;
        email?: string;
    };
    sameAs?: string[]; // Social media profiles
}

export default function OrganizationJsonLd({
    name = 'Shop-DW',
    url = 'https://www.shop-dw.com',
    logo,
    contactPoint,
    sameAs = [],
}: OrganizationJsonLdProps) {
    const organizationSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
    };

    if (logo) {
        organizationSchema.logo = logo;
    }

    if (contactPoint) {
        organizationSchema.contactPoint = {
            '@type': 'ContactPoint',
            ...contactPoint,
        };
    }

    if (sameAs.length > 0) {
        organizationSchema.sameAs = sameAs;
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
    );
}

