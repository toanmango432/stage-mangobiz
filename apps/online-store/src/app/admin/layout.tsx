'use client';

import { ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * Admin root layout - authentication is handled by middleware (middleware.ts).
 *
 * Middleware redirects unauthenticated users to /login before this layout renders,
 * eliminating the flash of loading state that occurred with ProtectedRoute.
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
