import type { Metadata } from 'next';
import Shop from '@/pages/Shop';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import { siteConfig } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Browse and shop premium beauty and wellness products. Find everything from skincare to hair care at Mango.',
};

export default function ShopPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteConfig.url },
          { name: 'Shop', url: `${siteConfig.url}/shop` },
        ]}
      />
      <Shop />
    </>
  );
}
