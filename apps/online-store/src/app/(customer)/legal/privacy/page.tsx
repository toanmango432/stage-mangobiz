import type { Metadata } from 'next';
import PrivacyPolicy from '@/views/legal/PrivacyPolicy';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import { siteConfig } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Our privacy policy explains how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteConfig.url },
          { name: 'Privacy Policy', url: `${siteConfig.url}/legal/privacy` },
        ]}
      />
      <PrivacyPolicy />
    </>
  );
}
