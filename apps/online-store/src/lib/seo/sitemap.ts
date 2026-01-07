// Sitemap Generator
import type { StoreService, StoreProduct } from '@/types/store';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Get base URL
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://mangostore.com';
}

/**
 * Generate sitemap.xml content
 */
export function generateSitemapXml(urls: SitemapUrl[]): string {
  const header = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  const body = urls.map(url => {
    let urlEntry = `  <url>\n    <loc>${url.loc}</loc>\n`;
    
    if (url.lastmod) {
      urlEntry += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    if (url.changefreq) {
      urlEntry += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }
    if (url.priority !== undefined) {
      urlEntry += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
    }
    
    urlEntry += '  </url>\n';
    return urlEntry;
  }).join('');
  
  const footer = '</urlset>';
  
  return header + body + footer;
}

/**
 * Generate complete sitemap for the website
 */
export function generateSitemap(
  services: StoreService[],
  products: StoreProduct[]
): string {
  const baseUrl = getBaseUrl();
  const today = new Date().toISOString().split('T')[0];
  
  const urls: SitemapUrl[] = [
    // Home
    {
      loc: baseUrl,
      lastmod: today,
      changefreq: 'daily',
      priority: 1.0
    },
    
    // Main pages
    {
      loc: `${baseUrl}/book`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/shop`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/memberships`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/gift-cards`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8
    },
    
    // Info pages
    {
      loc: `${baseUrl}/info/about`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/info/contact`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/info/gallery`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/info/reviews`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/info/faq`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/info/policies`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.5
    },
    
    // Marketing pages
    {
      loc: `${baseUrl}/promotions`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/updates`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.7
    },
    
    // Auth pages
    {
      loc: `${baseUrl}/login`,
      lastmod: today,
      changefreq: 'yearly',
      priority: 0.3
    },
    {
      loc: `${baseUrl}/account`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.5
    },
    
    // Services (individual)
    ...services.map(service => ({
      loc: `${baseUrl}/book?service=${service.id}`,
      lastmod: today,
      changefreq: 'weekly' as const,
      priority: 0.7
    })),
    
    // Products (individual)
    ...products.map(product => ({
      loc: `${baseUrl}/shop/${product.id}`,
      lastmod: today,
      changefreq: 'weekly' as const,
      priority: 0.6
    }))
  ];
  
  return generateSitemapXml(urls);
}

/**
 * Download sitemap as XML file
 */
export function downloadSitemap(
  services: StoreService[],
  products: StoreProduct[],
  filename: string = 'sitemap.xml'
): void {
  const sitemapContent = generateSitemap(services, products);
  const blob = new Blob([sitemapContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(sitemapUrl?: string): string {
  const baseUrl = getBaseUrl();
  const sitemap = sitemapUrl || `${baseUrl}/sitemap.xml`;
  
  return `# Mango Online Store - robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout
Disallow: /cart
Disallow: /account

# Sitemap
Sitemap: ${sitemap}

# Crawl-delay for polite crawling
Crawl-delay: 10
`;
}

/**
 * Download robots.txt file
 */
export function downloadRobotsTxt(filename: string = 'robots.txt'): void {
  const robotsContent = generateRobotsTxt();
  const blob = new Blob([robotsContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

