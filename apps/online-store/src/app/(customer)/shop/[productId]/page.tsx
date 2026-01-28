import type { Metadata } from 'next';
import { getProducts } from '@/lib/api/store';
import ProductDetail from '@/pages/ProductDetail';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import { siteConfig } from '@/lib/metadata';

interface ProductPageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;

  try {
    const products = await getProducts();
    const product = products.find((p) => p.id === productId);

    if (product) {
      return {
        title: product.name,
        description:
          product.description || `Shop ${product.name} at Mango.`,
        openGraph: {
          title: product.name,
          description:
            product.description || `Shop ${product.name} at Mango.`,
          ...(product.images?.[0] && {
            images: [{ url: product.images[0] }],
          }),
        },
      };
    }
  } catch {
    // Fallback to default metadata on fetch failure
  }

  return {
    title: 'Product',
    description: 'View product details at Mango.',
  };
}

export default function ProductDetailPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteConfig.url },
          { name: 'Shop', url: `${siteConfig.url}/shop` },
          { name: 'Product', url: `${siteConfig.url}/shop` },
        ]}
      />
      <ProductDetail />
    </>
  );
}
