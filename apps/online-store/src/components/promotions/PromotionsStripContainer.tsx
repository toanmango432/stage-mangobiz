import { useQuery } from '@tanstack/react-query';
import { getActivePromotions } from '@/lib/api/promotions';
import { useMarketingSettings } from '@/hooks/useMarketingSettings';
import { PromotionsStrip } from './PromotionsStrip';
import { filterPromotionsForStrip, shouldShowPromotionsStrip } from '@/lib/utils/marketingDisplay';

export const PromotionsStripContainer = () => {
  const { data: settings } = useMarketingSettings();
  const { data: promotions } = useQuery({
    queryKey: ['promotions', 'homepage'],
    queryFn: () => getActivePromotions({ status: 'active', showOnHomepage: true }),
  });

  if (!shouldShowPromotionsStrip(settings)) return null;

  const visiblePromotions = filterPromotionsForStrip(promotions, settings);

  if (visiblePromotions.length === 0) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      <PromotionsStrip promotions={visiblePromotions} />
    </div>
  );
};
