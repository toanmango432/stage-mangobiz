'use client';

import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { store } from '@/store';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider as BrandThemeProvider } from '@/contexts/ThemeContext';
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
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NextThemesProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              <BrandThemeProvider>
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
              </BrandThemeProvider>
            </NextThemesProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
