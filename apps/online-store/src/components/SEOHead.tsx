import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { generateMetaTags } from "@/lib/seo/meta-generator";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string[];
  author?: string;
  noindex?: boolean;
  nofollow?: boolean;
  structuredData?: Record<string, any> | Record<string, any>[];
}

export const SEOHead = ({ 
  title, 
  description, 
  canonical, 
  image = '/src/assets/hero-salon.jpg',
  type = 'website',
  keywords = [],
  author,
  noindex = false,
  nofollow = false,
  structuredData
}: SEOHeadProps) => {
  const metaTags = generateMetaTags({
    title,
    description,
    canonical,
    ogType: type,
    ogImage: image,
    keywords,
    author,
    noindex,
    nofollow
  });

  // Inject structured data if provided
  useEffect(() => {
    if (!structuredData) return;
    
    // Remove existing structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());
    
    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(
      Array.isArray(structuredData) ? structuredData : [structuredData],
      null,
      2
    );
    document.head.appendChild(script);
    
    return () => {
      script.remove();
    };
  }, [structuredData]);

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{metaTags.title}</title>
      <meta name="description" content={metaTags.description} />
      {metaTags.keywords && <meta name="keywords" content={metaTags.keywords} />}
      {metaTags.author && <meta name="author" content={metaTags.author} />}
      <meta name="robots" content={metaTags.robots} />
      <link rel="canonical" href={metaTags.canonical} />
      
      {/* Open Graph */}
      <meta property="og:type" content={metaTags['og:type']} />
      <meta property="og:title" content={metaTags['og:title']} />
      <meta property="og:description" content={metaTags['og:description']} />
      <meta property="og:url" content={metaTags['og:url']} />
      <meta property="og:image" content={metaTags['og:image']} />
      <meta property="og:site_name" content={metaTags['og:site_name']} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={metaTags['twitter:card']} />
      <meta name="twitter:title" content={metaTags['twitter:title']} />
      <meta name="twitter:description" content={metaTags['twitter:description']} />
      <meta name="twitter:image" content={metaTags['twitter:image']} />
      
      {/* Additional */}
      <meta name="theme-color" content={metaTags['theme-color']} />
    </Helmet>
  );
};
