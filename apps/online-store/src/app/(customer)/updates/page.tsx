import type { Metadata } from 'next';
import Updates from '@/views/Updates';

export const metadata: Metadata = {
  title: 'Updates',
  description: 'Stay up to date with the latest news, announcements, and updates from Mango.',
};

export default function UpdatesPage() {
  return <Updates />;
}
