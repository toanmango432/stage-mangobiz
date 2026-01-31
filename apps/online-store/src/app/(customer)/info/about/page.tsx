import type { Metadata } from 'next';
import About from '@/views/info/About';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import { siteConfig } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our story, mission, and the team behind our salon and spa.',
};

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteConfig.url },
          { name: 'About Us', url: `${siteConfig.url}/info/about` },
        ]}
      />
      <About />
    </>
  );
}
