'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { PersonalizationProvider } from '@/contexts/PersonalizationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { RealtimeProvider } from '@/providers/RealtimeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <WishlistProvider>
              <CartProvider>
                <PersonalizationProvider>
                  <NotificationProvider>
                    <RealtimeProvider>
                      <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        <OfflineIndicator />
                        {children}
                      </TooltipProvider>
                    </RealtimeProvider>
                  </NotificationProvider>
                </PersonalizationProvider>
              </CartProvider>
            </WishlistProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
