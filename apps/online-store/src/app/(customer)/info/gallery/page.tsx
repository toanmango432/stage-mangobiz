import type { Metadata } from 'next';
import Gallery from '@/views/info/Gallery';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Browse our gallery of work, styles, and transformations from our talented team.',
};

export default function GalleryPage() {
  return <Gallery />;
}
