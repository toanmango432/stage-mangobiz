// Product Schema Generation
import type { StoreProduct } from '@/types/store';

export interface ProductSchemaOptions {
  product: StoreProduct;
  businessName: string;
  url: string;
}

/**
 * Generate Product JSON-LD schema
 */
export function generateProductSchema(options: ProductSchemaOptions) {
  const { product, businessName, url } = options;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}/shop/${product.id}#product`,
    name: product.name,
    description: product.description,
    image: product.images?.[0] || `${url}/placeholder.svg`,
    brand: {
      '@type': 'Brand',
      name: product.brand || businessName
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: businessName
      }
    },
    category: product.category,
    sku: product.id // Use product ID as SKU since StoreProduct has no dedicated SKU
  };
}

/**
 * Generate ItemList schema for products
 */
export function generateProductListSchema(
  products: StoreProduct[],
  businessName: string,
  url: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${url}/shop#productlist`,
    name: `${businessName} Products`,
    description: `Professional beauty products available at ${businessName}`,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        '@id': `${url}/shop/${product.id}`,
        name: product.name,
        image: product.images?.[0],
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'USD',
          availability: product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock'
        }
      }
    }))
  };
}

