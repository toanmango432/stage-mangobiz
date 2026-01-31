import type { Metadata } from 'next';
import Accessibility from '@/views/legal/Accessibility';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'Our commitment to accessibility and how we ensure our services are available to everyone.',
};

export default function AccessibilityPage() {
  return <Accessibility />;
}
