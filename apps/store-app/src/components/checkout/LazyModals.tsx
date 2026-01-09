/**
 * LazyModals - Lazy-loaded modal components for checkout
 * 
 * This file provides lazy-loaded versions of heavy modal components
 * to reduce initial bundle size and improve load performance.
 */

import { lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load PaymentModal (heavy component with payment processing logic)
// PaymentModal uses default export
export const LazyPaymentModal = lazy(() => import('./PaymentModal'));

// Lazy load CheckoutModal (uses named export, so we wrap it)
export const LazyCheckoutModal = lazy(() => 
  import('./CheckoutModal').then(m => ({ default: m.CheckoutModal }))
);

// Loading fallback component for modals
interface ModalLoadingFallbackProps {
  size?: 'sm' | 'md' | 'lg';
}

export function ModalLoadingFallback({ size = 'md' }: ModalLoadingFallbackProps) {
  const sizeClasses = {
    sm: 'w-64 h-48',
    md: 'w-96 h-64',
    lg: 'w-[600px] h-96',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`${sizeClasses[size]} bg-white rounded-xl flex flex-col items-center justify-center gap-4`}>
        <Loader2 className="w-8 h-8 text-[#1a5f4a] animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
