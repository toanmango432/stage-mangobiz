import { useQuery } from '@tanstack/react-query';
import { getActivePromotions } from '@/lib/api/promotions';
import { useMarketingSettings } from '@/hooks/useMarketingSettings';
import { PromotionBanner } from './PromotionBanner';
import { shouldShowPromotionBanner } from '@/lib/utils/marketingDisplay';

export const PromotionBannerContainer = () => {
  const { data: settings } = useMarketingSettings();
  const { data: promotions } = useQuery({
    queryKey: ['promotions', 'homepage'],
    queryFn: () => getActivePromotions({ status: 'active', showOnHomepage: true }),
  });

  // Find first visible promotion for banner
  const visiblePromotion = promotions?.find(promo => 
    shouldShowPromotionBanner(settings, promo)
  );

  if (!visiblePromotion) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <PromotionBanner promotion={visiblePromotion} />
    </div>
  );
};
