export interface LocalBusinessInfo {
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export const localBusinessSchema = (info: LocalBusinessInfo) => ({
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  "name": info.name,
  "description": info.description,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": info.address.street,
    "addressLocality": info.address.city,
    "addressRegion": info.address.state,
    "postalCode": info.address.zip,
    "addressCountry": info.address.country
  },
  "telephone": info.contact.phone,
  "email": info.contact.email,
  ...(info.coordinates && {
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": info.coordinates.lat,
      "longitude": info.coordinates.lng
    }
  })
});

export const faqSchema = (items: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": items.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer
    }
  }))
});

export const aggregateRatingSchema = (rating: { avg: number; count: number }, businessName: string) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": businessName,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": rating.avg,
    "reviewCount": rating.count,
    "bestRating": 5,
    "worstRating": 1
  }
});

export const collectionPageSchema = (data: { name: string; url: string; description?: string }) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": data.name,
  "url": data.url,
  ...(data.description && { "description": data.description })
});

export const injectSchema = (schema: object) => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
  return () => {
    document.head.removeChild(script);
  };
};
