// LocalBusiness and Organization Schema Generation
import type { SalonInfo } from '@/types/store';

export interface BusinessSchemaOptions {
  salonInfo: SalonInfo;
  url: string;
  logoUrl?: string;
}

/**
 * Generate LocalBusiness JSON-LD schema
 */
export function generateLocalBusinessSchema(options: BusinessSchemaOptions) {
  const { salonInfo, url, logoUrl } = options;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    '@id': `${url}#business`,
    name: salonInfo.name,
    description: salonInfo.description || `${salonInfo.name} - Professional beauty and wellness services`,
    url,
    logo: logoUrl || `${url}/favicon.ico`,
    image: logoUrl || `${url}/favicon.ico`,
    telephone: salonInfo.phone,
    email: salonInfo.email,
    priceRange: '$$', // Default price range for schema.org
    address: {
      '@type': 'PostalAddress',
      streetAddress: salonInfo.address.street,
      addressLocality: salonInfo.address.city,
      addressRegion: salonInfo.address.state,
      postalCode: salonInfo.address.zip,
      addressCountry: salonInfo.address.country || 'US'
    },
    geo: salonInfo.coordinates ? {
      '@type': 'GeoCoordinates',
      latitude: salonInfo.coordinates.lat,
      longitude: salonInfo.coordinates.lng
    } : undefined,
    openingHoursSpecification: salonInfo.hours ? Object.entries(salonInfo.hours).map(([day, hoursStr]) => {
      // hours format is "HH:MM - HH:MM" or "Closed"
      const [opens, closes] = hoursStr.toLowerCase() === 'closed'
        ? ['', '']
        : hoursStr.split(' - ').map(s => s.trim());
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
        opens: opens || undefined,
        closes: closes || undefined
      };
    }).filter(spec => spec.opens && spec.closes) : undefined,
    sameAs: salonInfo.socialMedia ? [
      salonInfo.socialMedia.instagram,
      salonInfo.socialMedia.facebook,
      salonInfo.socialMedia.twitter
    ].filter(Boolean) : undefined
  };
}

/**
 * Generate Organization JSON-LD schema
 */
export function generateOrganizationSchema(options: BusinessSchemaOptions) {
  const { salonInfo, url, logoUrl } = options;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${url}#organization`,
    name: salonInfo.name,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl || `${url}/favicon.ico`,
      width: 512,
      height: 512
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: salonInfo.phone,
      email: salonInfo.email,
      contactType: 'Customer Service',
      areaServed: salonInfo.address.city,
      availableLanguage: ['en']
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: salonInfo.address.street,
      addressLocality: salonInfo.address.city,
      addressRegion: salonInfo.address.state,
      postalCode: salonInfo.address.zip,
      addressCountry: salonInfo.address.country || 'US'
    }
  };
}

