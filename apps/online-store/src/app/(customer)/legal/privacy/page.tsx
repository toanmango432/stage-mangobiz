import type { Metadata } from 'next';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Our privacy policy explains how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicy />;
}
