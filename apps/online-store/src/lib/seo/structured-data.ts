// Structured Data Generator - Main Entry Point
import { generateLocalBusinessSchema, generateOrganizationSchema } from './schemas/business';
import { generateServiceSchema, generateServiceListSchema } from './schemas/service';
import { generateProductSchema, generateProductListSchema } from './schemas/product';
import { 
  generateAggregateRatingSchema, 
  generateReviewSchema, 
  generateReviewsWithRatingSchema 
} from './schemas/review';
import { generateEventSchema, generateEventListSchema } from './schemas/event';

import type { SalonInfo, StoreService, StoreProduct, ReviewUI } from '@/types/store';
import type { Announcement } from '@/types/promotion';

/**
 * Get the base URL
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://mangostore.com'; // Fallback
}

/**
 * Inject JSON-LD script into page head
 */
export function injectStructuredData(schema: Record<string, any> | Record<string, any>[]): void {
  if (typeof document === 'undefined') return;
  
  // Remove existing structured data scripts
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
  existingScripts.forEach(script => script.remove());
  
  // Create new script
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(Array.isArray(schema) ? schema : [schema], null, 2);
  document.head.appendChild(script);
}

/**
 * Generate business page structured data
 */
export function generateBusinessPageSchema(salonInfo: SalonInfo) {
  const url = getBaseUrl();
  
  return [
    generateLocalBusinessSchema({ salonInfo, url }),
    generateOrganizationSchema({ salonInfo, url })
  ];
}

/**
 * Generate service page structured data
 */
export function generateServicePageSchema(
  service: StoreService,
  salonInfo: SalonInfo
) {
  const url = getBaseUrl();
  
  return generateServiceSchema({
    service,
    businessName: salonInfo.name,
    url
  });
}

/**
 * Generate services list page structured data
 */
export function generateServicesPageSchema(
  services: StoreService[],
  salonInfo: SalonInfo
) {
  const url = getBaseUrl();
  
  return [
    generateLocalBusinessSchema({ salonInfo, url }),
    generateServiceListSchema(services, salonInfo.name, url)
  ];
}

/**
 * Generate product page structured data
 */
export function generateProductPageSchema(
  product: StoreProduct,
  salonInfo: SalonInfo
) {
  const url = getBaseUrl();
  
  return generateProductSchema({
    product,
    businessName: salonInfo.name,
    url
  });
}

/**
 * Generate shop page structured data
 */
export function generateShopPageSchema(
  products: StoreProduct[],
  salonInfo: SalonInfo
) {
  const url = getBaseUrl();
  
  return [
    generateLocalBusinessSchema({ salonInfo, url }),
    generateProductListSchema(products, salonInfo.name, url)
  ];
}

/**
 * Generate reviews page structured data
 */
export function generateReviewsPageSchema(
  reviews: ReviewUI[],
  averageRating: number,
  totalReviews: number,
  salonInfo: SalonInfo
) {
  const url = getBaseUrl();
  
  return generateReviewsWithRatingSchema({
    reviews,
    businessName: salonInfo.name,
    url,
    averageRating,
    totalReviews
  });
}

/**
 * Generate home page structured data (comprehensive)
 */
export function generateHomePageSchema(
  salonInfo: SalonInfo,
  reviews?: { reviews: ReviewUI[]; average: number; total: number }
) {
  const url = getBaseUrl();
  const schemas: any[] = [
    generateLocalBusinessSchema({ salonInfo, url }),
    generateOrganizationSchema({ salonInfo, url })
  ];
  
  // Add aggregate rating if reviews available
  if (reviews && reviews.total > 0) {
    schemas.push(generateAggregateRatingSchema({
      reviews: reviews.reviews,
      businessName: salonInfo.name,
      url,
      averageRating: reviews.average,
      totalReviews: reviews.total
    }));
  }
  
  return schemas;
}

/**
 * Generate updates/announcements page structured data
 */
export function generateUpdatesPageSchema(
  announcements: Announcement[],
  salonInfo: SalonInfo
) {
  const url = getBaseUrl();
  const eventList = generateEventListSchema(announcements, salonInfo.name, url);
  
  if (eventList) {
    return [
      generateLocalBusinessSchema({ salonInfo, url }),
      eventList
    ];
  }
  
  return generateLocalBusinessSchema({ salonInfo, url });
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>
) {
  const baseUrl = getBaseUrl();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`
    }))
  };
}

