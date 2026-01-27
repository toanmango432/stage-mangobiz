import type { Metadata } from 'next';
import About from '@/pages/info/About';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our story, mission, and the team behind our salon and spa.',
};

export default function AboutPage() {
  return <About />;
}
