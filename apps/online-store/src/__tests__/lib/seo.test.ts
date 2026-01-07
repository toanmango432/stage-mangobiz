import { describe, it, expect } from 'vitest';
import { 
  optimizeDescription, 
  optimizeTitle,
  getCanonicalUrl,
  generateMetaTags 
} from '@/lib/seo/meta-generator';
import { generateSitemap, generateRobotsTxt } from '@/lib/seo/sitemap';

describe('SEO Meta Generator', () => {
  describe('optimizeDescription', () => {
    it('should return description as-is if under limit', () => {
      const desc = 'This is a short description';
      expect(optimizeDescription(desc, 160)).toBe(desc);
    });

    it('should truncate long descriptions', () => {
      const longDesc = 'a'.repeat(200);
      const optimized = optimizeDescription(longDesc, 160);
      expect(optimized.length).toBeLessThanOrEqual(163); // 160 + '...'
      expect(optimized).toContain('...');
    });

    it('should truncate at word boundary', () => {
      const desc = 'This is a very long description that exceeds the maximum length and should be truncated at a word boundary for better readability';
      const optimized = optimizeDescription(desc, 50);
      expect(optimized).not.toContain(' a'); // Should not end mid-word
      expect(optimized).toContain('...');
    });
  });

  describe('optimizeTitle', () => {
    it('should add site name if under limit', () => {
      const title = 'Page Title';
      const optimized = optimizeTitle(title, 'Mango Store', 60);
      expect(optimized).toBe('Page Title | Mango Store');
    });

    it('should omit site name if would exceed limit', () => {
      const longTitle = 'a'.repeat(55);
      const optimized = optimizeTitle(longTitle, 'Mango Store', 60);
      expect(optimized).not.toContain('Mango Store');
    });

    it('should truncate title if too long', () => {
      const longTitle = 'a'.repeat(70);
      const optimized = optimizeTitle(longTitle, 'Mango', 60);
      expect(optimized.length).toBeLessThanOrEqual(60);
    });
  });

  describe('getCanonicalUrl', () => {
    it('should return full URL with path', () => {
      const url = getCanonicalUrl('/about');
      expect(url).toBe('http://localhost:8080/about');
    });

    it('should remove trailing slash except for homepage', () => {
      const url1 = getCanonicalUrl('/about/');
      expect(url1).toBe('http://localhost:8080/about');
      
      const url2 = getCanonicalUrl('/');
      expect(url2).toBe('http://localhost:8080/');
    });
  });

  describe('generateMetaTags', () => {
    it('should generate complete meta tags object', () => {
      const tags = generateMetaTags({
        title: 'Test Page',
        description: 'Test description',
        canonical: '/test'
      });

      expect(tags).toHaveProperty('title');
      expect(tags).toHaveProperty('description');
      expect(tags).toHaveProperty('canonical');
      expect(tags).toHaveProperty('og:title');
      expect(tags).toHaveProperty('twitter:card');
      expect(tags.robots).toBe('index, follow');
    });

    it('should handle noindex and nofollow', () => {
      const tags = generateMetaTags({
        title: 'Test',
        description: 'Test',
        noindex: true,
        nofollow: true
      });

      expect(tags.robots).toBe('noindex, nofollow');
    });

    it('should include keywords if provided', () => {
      const tags = generateMetaTags({
        title: 'Test',
        description: 'Test',
        keywords: ['beauty', 'salon', 'spa']
      });

      expect(tags.keywords).toBe('beauty, salon, spa');
    });
  });
});

describe('Sitemap Generator', () => {
  const mockServices = [
    { id: 'haircut', name: 'Haircut', price: 50 },
    { id: 'manicure', name: 'Manicure', price: 30 }
  ] as any;

  const mockProducts = [
    { id: 'shampoo', name: 'Shampoo', price: 20 },
    { id: 'conditioner', name: 'Conditioner', price: 25 }
  ] as any;

  it('should generate valid XML sitemap', () => {
    const sitemap = generateSitemap(mockServices, mockProducts);
    
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain('<urlset');
    expect(sitemap).toContain('</urlset>');
    expect(sitemap).toContain('<url>');
    expect(sitemap).toContain('<loc>');
  });

  it('should include all main pages', () => {
    const sitemap = generateSitemap(mockServices, mockProducts);
    
    expect(sitemap).toContain('/book');
    expect(sitemap).toContain('/shop');
    expect(sitemap).toContain('/info/about');
    expect(sitemap).toContain('/info/contact');
  });

  it('should include service and product URLs', () => {
    const sitemap = generateSitemap(mockServices, mockProducts);
    
    expect(sitemap).toContain('service=haircut');
    expect(sitemap).toContain('/shop/shampoo');
  });

  it('should include priority and changefreq', () => {
    const sitemap = generateSitemap(mockServices, mockProducts);
    
    expect(sitemap).toContain('<priority>');
    expect(sitemap).toContain('<changefreq>');
  });
});

describe('Robots.txt Generator', () => {
  it('should generate valid robots.txt', () => {
    const robots = generateRobotsTxt();
    
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Sitemap:');
  });

  it('should disallow private pages', () => {
    const robots = generateRobotsTxt();
    
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Disallow: /account');
    expect(robots).toContain('Disallow: /cart');
  });
});

