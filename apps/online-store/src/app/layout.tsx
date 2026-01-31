import './globals.css';
import { Providers } from '@/components/Providers';
import { sharedMetadata, sharedViewport } from '@/lib/metadata';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = sharedMetadata;

export const viewport: Viewport = sharedViewport;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
