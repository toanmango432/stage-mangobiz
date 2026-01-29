import type { Metadata } from 'next';
import FAQ from '@/views/info/FAQ';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Find answers to frequently asked questions about our services, policies, and booking.',
};

export default function FAQPage() {
  return <FAQ />;
}
