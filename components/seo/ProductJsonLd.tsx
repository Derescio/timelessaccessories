/**
 * Product JSON-LD component for structured data
 * Implements Schema.org Product with Offer and AggregateRating
 */

import { getAbsoluteImageUrl } from '@/lib/utils/seo';

interface ProductOffer {
    price: number;
    priceCurrency?: string;
    availability?: string;
    url?: string;
    sku?: string;
    itemCondition?: string;
}

interface ProductReview {
    author?: string;
    datePublished?: string;
    reviewBody?: string;
    reviewRating?: {
        ratingValue: number;
        bestRating?: number;
    };
}

interface ProductJsonLdProps {
    name: string;
    description: string;
    image: string | string[];
    url: string;
    sku?: string;
    brand?: string;
    category?: string;
    offers: ProductOffer | ProductOffer[];
    aggregateRating?: {
        ratingValue: number;
        reviewCount: number;
        bestRating?: number;
        worstRating?: number;
    };
    reviews?: ProductReview[];
}

export default function ProductJsonLd({
    name,
    description,
    image,
    url,
    sku,
    brand = 'Shop-DW',
    category,
    offers,
    aggregateRating,
    reviews,
}: ProductJsonLdProps) {
    const productSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        description,
        url,
    };

    // Handle images - ensure absolute URLs
    if (image) {
        const imageArray = Array.isArray(image) ? image : [image];
        productSchema.image = imageArray.map(img => getAbsoluteImageUrl(img));
    }

    if (sku) {
        productSchema.sku = sku;
    }

    if (brand) {
        productSchema.brand = {
            '@type': 'Brand',
            name: brand,
        };
    }

    if (category) {
        productSchema.category = category;
    }

    // Handle offers - support single or multiple offers
    const offersArray = Array.isArray(offers) ? offers : [offers];
    const mappedOffers = offersArray.map(offer => ({
        '@type': 'Offer',
        price: offer.price.toFixed(2),
        priceCurrency: offer.priceCurrency || 'CAD',
        availability: offer.availability || (offer.price > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'),
        url: offer.url || url,
        ...(offer.sku && { sku: offer.sku }),
        itemCondition: offer.itemCondition || 'https://schema.org/NewCondition',
    }));

    // If only one offer, use it directly instead of array
    productSchema.offers = mappedOffers.length === 1 ? mappedOffers[0] : mappedOffers;

    // Add aggregate rating if available
    if (aggregateRating && aggregateRating.reviewCount > 0) {
        productSchema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: aggregateRating.ratingValue,
            reviewCount: aggregateRating.reviewCount,
            bestRating: aggregateRating.bestRating || 5,
            worstRating: aggregateRating.worstRating || 1,
        };
    }

    // Add individual reviews if available
    if (reviews && reviews.length > 0) {
        productSchema.review = reviews.map(review => ({
            '@type': 'Review',
            ...(review.author && {
                author: {
                    '@type': 'Person',
                    name: review.author,
                },
            }),
            ...(review.datePublished && { datePublished: review.datePublished }),
            ...(review.reviewBody && { reviewBody: review.reviewBody }),
            ...(review.reviewRating && {
                reviewRating: {
                    '@type': 'Rating',
                    ratingValue: review.reviewRating.ratingValue,
                    bestRating: review.reviewRating.bestRating || 5,
                },
            }),
        }));
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
    );
}

