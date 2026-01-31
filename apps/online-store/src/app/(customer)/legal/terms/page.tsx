import type { Metadata } from 'next';
import TermsOfService from '@/views/legal/TermsOfService';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read our terms of service that govern your use of our website and services.',
};

export default function TermsOfServicePage() {
  return <TermsOfService />;
}
