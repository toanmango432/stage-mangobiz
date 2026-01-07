import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getActivePromotions, 
  getPromotionById, 
  validatePromotion,
  applyPromotion,
  getSuggestedPromotions
} from '@/lib/api/promotions';
import { PromotionFilters } from '@/types/promotion';

/**
 * Hook to fetch active promotions with optional filters
 */
export function usePromotions(filters?: PromotionFilters) {
  return useQuery({
    queryKey: ['promotions', 'active', filters],
    queryFn: () => getActivePromotions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch a single promotion by ID
 */
export function usePromotion(id: string) {
  return useQuery({
    queryKey: ['promotions', id],
    queryFn: () => getPromotionById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to validate a promotion code
 */
export function useValidatePromotion() {
  return useMutation({
    mutationFn: ({
      code,
      cartTotal,
      cartItems,
      isFirstTime,
    }: {
      code: string;
      cartTotal: number;
      cartItems?: Array<{ type: string; id?: string }>;
      isFirstTime?: boolean;
    }) => validatePromotion(code, cartTotal, cartItems, isFirstTime),
  });
}

/**
 * Hook to apply a promotion to the cart
 */
export function useApplyPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      code,
      cartId,
      cartTotal,
    }: {
      code: string;
      cartId: string;
      cartTotal: number;
    }) => applyPromotion(code, cartId, cartTotal),
    onSuccess: () => {
      // Invalidate cart-related queries
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

/**
 * Hook to get suggested promotions based on cart
 */
export function useSuggestedPromotions(
  cartTotal: number,
  cartItems?: Array<{ type: string; id?: string }>
) {
  return useQuery({
    queryKey: ['promotions', 'suggested', cartTotal, cartItems],
    queryFn: () => getSuggestedPromotions(cartTotal, cartItems),
    enabled: cartTotal > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get banner promotions for homepage
 */
export function useBannerPromotions() {
  return usePromotions({ 
    status: 'active', 
    showBanner: true,
    showOnHomepage: true 
  });
}

/**
 * Hook to get cart promotions
 */
export function useCartPromotions() {
  return usePromotions({ 
    status: 'active', 
    showOnCart: true 
  });
}
