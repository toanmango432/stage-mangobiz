import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMarketingSettings,
  updateMarketingSettings,
  updatePromotionPlacement,
  updateAnnouncementPlacement,
} from '@/lib/api/marketing-settings';
import type {
  MarketingDisplaySettingsPatch,
  PromoPlacementUpdate,
  AnnouncementPlacementUpdate,
} from '@/types/marketing-settings';

/**
 * Hook to fetch marketing display settings
 */
export function useMarketingSettings() {
  return useQuery({
    queryKey: ['marketing-settings'],
    queryFn: getMarketingSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update marketing display settings
 */
export function useUpdateMarketingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: MarketingDisplaySettingsPatch) => updateMarketingSettings(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-settings'] });
    },
  });
}

/**
 * Hook to update promotion placement
 */
export function useUpdatePromotionPlacement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ promotionId, update }: { promotionId: string; update: PromoPlacementUpdate }) =>
      updatePromotionPlacement(promotionId, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-settings'] });
    },
  });
}

/**
 * Hook to update announcement placement
 */
export function useUpdateAnnouncementPlacement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ announcementId, update }: { announcementId: string; update: AnnouncementPlacementUpdate }) =>
      updateAnnouncementPlacement(announcementId, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-settings'] });
    },
  });
}
