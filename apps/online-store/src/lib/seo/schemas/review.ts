// Review and AggregateRating Schema Generation
import type { ReviewUI } from '@/types/store';

export interface ReviewSchemaOptions {
  reviews: ReviewUI[];
  businessName: string;
  url: string;
  averageRating: number;
  totalReviews: number;
}

/**
 * Generate AggregateRating JSON-LD schema
 */
export function generateAggregateRatingSchema(options: ReviewSchemaOptions) {
  const { businessName, url, averageRating, totalReviews } = options;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    '@id': `${url}#aggregaterating`,
    ratingValue: averageRating.toFixed(1),
    bestRating: 5,
    worstRating: 1,
    ratingCount: totalReviews,
    itemReviewed: {
      '@type': 'BeautySalon',
      name: businessName,
      url
    }
  };
}

/**
 * Generate individual Review JSON-LD schemas
 */
export function generateReviewSchema(
  review: ReviewUI,
  businessName: string,
  url: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    '@id': `${url}/reviews/${review.id}#review`,
    itemReviewed: {
      '@type': 'BeautySalon',
      name: businessName
    },
    author: {
      '@type': 'Person',
      name: review.clientName
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1
    },
    reviewBody: review.comment,
    datePublished: review.dateISO
  };
}

/**
 * Generate reviews collection with aggregate rating
 */
export function generateReviewsWithRatingSchema(options: ReviewSchemaOptions) {
  const { reviews, businessName, url, averageRating, totalReviews } = options;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    '@id': `${url}#business-with-reviews`,
    name: businessName,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: averageRating.toFixed(1),
      bestRating: 5,
      worstRating: 1,
      ratingCount: totalReviews
    },
    review: reviews.slice(0, 10).map(review => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.clientName
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating
      },
      reviewBody: review.comment,
      datePublished: review.dateISO
    }))
  };
}

