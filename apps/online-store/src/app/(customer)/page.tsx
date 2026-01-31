import type { Metadata } from 'next';
import Index from '@/views/Index';
import { LocalBusinessJsonLd } from '@/components/JsonLd';
import { siteConfig } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Book appointments, shop products, and manage your beauty and wellness experience with Mango.',
};

export default function HomePage() {
  return (
    <>
      <LocalBusinessJsonLd
        name={siteConfig.name}
        description={siteConfig.description}
        url={siteConfig.url}
      />
      <Index />
    </>
  );
}
