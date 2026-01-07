// Service Schema Generation
import type { StoreService } from '@/types/store';

export interface ServiceSchemaOptions {
  service: StoreService;
  businessName: string;
  url: string;
}

/**
 * Generate Service JSON-LD schema
 */
export function generateServiceSchema(options: ServiceSchemaOptions) {
  const { service, businessName, url } = options;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}/services/${service.id}#service`,
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'BeautySalon',
      name: businessName,
      url
    },
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString()
    },
    serviceType: service.category,
    areaServed: {
      '@type': 'City',
      name: businessName
    }
  };
}

/**
 * Generate ItemList schema for multiple services
 */
export function generateServiceListSchema(
  services: StoreService[],
  businessName: string,
  url: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${url}/services#servicelist`,
    name: `${businessName} Services`,
    description: `Professional beauty services offered by ${businessName}`,
    numberOfItems: services.length,
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        '@id': `${url}/services/${service.id}`,
        name: service.name,
        description: service.description,
        offers: {
          '@type': 'Offer',
          price: service.price,
          priceCurrency: 'USD'
        }
      }
    }))
  };
}

