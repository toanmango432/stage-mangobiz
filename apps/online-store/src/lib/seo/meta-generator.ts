// Meta Tags Generator for SEO
export interface MetaTagsOptions {
  title: string;
  description: string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  keywords?: string[];
  author?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

/**
 * Optimize description for SEO (max 160 characters)
 */
export function optimizeDescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) {
    return description;
  }
  
  // Truncate at last complete word
  const truncated = description.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Generate optimized title (max 60 characters)
 */
export function optimizeTitle(title: string, siteName?: string, maxLength: number = 60): string {
  const suffix = siteName ? ` | ${siteName}` : '';
  const fullTitle = title + suffix;
  
  if (fullTitle.length <= maxLength) {
    return fullTitle;
  }
  
  // If too long, try without site name
  if (title.length <= maxLength) {
    return title;
  }
  
  // Truncate title
  return title.substring(0, maxLength - 3) + '...';
}

/**
 * Get canonical URL
 */
export function getCanonicalUrl(path?: string): string {
  if (typeof window === 'undefined') {
    return 'https://mangostore.com' + (path || '');
  }
  
  const base = window.location.origin;
  const pathname = path || window.location.pathname;
  
  // Remove trailing slash except for homepage
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  
  return base + cleanPath;
}

/**
 * Generate Open Graph image URL
 */
export function getOgImageUrl(imagePath?: string): string {
  if (!imagePath) {
    // Default OG image
    return getCanonicalUrl('/placeholder.svg');
  }
  
  // If already absolute URL
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Make relative path absolute
  return getCanonicalUrl(imagePath);
}

/**
 * Generate complete meta tags object
 */
export function generateMetaTags(options: MetaTagsOptions) {
  const {
    title,
    description,
    canonical,
    ogType = 'website',
    ogImage,
    keywords = [],
    author,
    noindex = false,
    nofollow = false
  } = options;
  
  const optimizedTitle = optimizeTitle(title);
  const optimizedDescription = optimizeDescription(description);
  const canonicalUrl = canonical || getCanonicalUrl();
  const ogImageUrl = getOgImageUrl(ogImage);
  
  // Build robots meta
  const robotsDirectives: string[] = [];
  if (noindex) robotsDirectives.push('noindex');
  if (nofollow) robotsDirectives.push('nofollow');
  if (robotsDirectives.length === 0) {
    robotsDirectives.push('index', 'follow');
  }
  
  return {
    // Basic Meta
    title: optimizedTitle,
    description: optimizedDescription,
    keywords: keywords.join(', '),
    author,
    canonical: canonicalUrl,
    robots: robotsDirectives.join(', '),
    
    // Open Graph
    'og:title': optimizedTitle,
    'og:description': optimizedDescription,
    'og:type': ogType,
    'og:url': canonicalUrl,
    'og:image': ogImageUrl,
    'og:site_name': 'Mango Online Store',
    
    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': optimizedTitle,
    'twitter:description': optimizedDescription,
    'twitter:image': ogImageUrl,
    
    // Additional
    'theme-color': '#8b5cf6',
    'viewport': 'width=device-width, initial-scale=1.0'
  };
}

/**
 * Generate meta tags for different page types
 */
export const pageMetaTemplates = {
  home: (salonName: string, description: string) => generateMetaTags({
    title: `${salonName} - Professional Beauty & Wellness Services`,
    description: optimizeDescription(description || `Book appointments, shop products, and explore services at ${salonName}`),
    ogType: 'website'
  }),
  
  services: (salonName: string) => generateMetaTags({
    title: `Services - ${salonName}`,
    description: `Explore our professional beauty and wellness services. Book your appointment today at ${salonName}.`,
    ogType: 'website'
  }),
  
  service: (serviceName: string, description: string, salonName: string) => generateMetaTags({
    title: `${serviceName} - ${salonName}`,
    description: optimizeDescription(description),
    ogType: 'article'
  }),
  
  shop: (salonName: string) => generateMetaTags({
    title: `Shop Products - ${salonName}`,
    description: `Shop professional beauty and wellness products from ${salonName}. Quality products for your beauty routine.`,
    ogType: 'website'
  }),
  
  product: (productName: string, description: string, price: number, salonName: string) => generateMetaTags({
    title: `${productName} - ${salonName}`,
    description: optimizeDescription(`${description} - $${price.toFixed(2)}`),
    ogType: 'product'
  }),
  
  booking: (salonName: string) => generateMetaTags({
    title: `Book Appointment - ${salonName}`,
    description: `Schedule your appointment online. Choose from our range of professional beauty services.`,
    ogType: 'website'
  }),
  
  reviews: (salonName: string, avgRating: number, totalReviews: number) => generateMetaTags({
    title: `Reviews - ${salonName}`,
    description: `Read ${totalReviews} verified reviews. ${salonName} has a ${avgRating.toFixed(1)}★ average rating.`,
    ogType: 'website'
  }),
  
  about: (salonName: string, description: string) => generateMetaTags({
    title: `About Us - ${salonName}`,
    description: optimizeDescription(description),
    ogType: 'website'
  }),
  
  contact: (salonName: string) => generateMetaTags({
    title: `Contact - ${salonName}`,
    description: `Get in touch with ${salonName}. Visit us, call us, or send us a message.`,
    ogType: 'website'
  })
};

