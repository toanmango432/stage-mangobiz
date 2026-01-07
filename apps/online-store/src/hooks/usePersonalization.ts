import { usePersonalizationContext } from '@/contexts/PersonalizationContext';
import { trackInteraction } from '@/lib/ai/personalization';
import { InteractionEvent } from '@/types/personalization';

export function usePersonalization() {
  const { profile, isReturningUser, refreshProfile } = usePersonalizationContext();

  const trackView = (itemId: string) => {
    const event: InteractionEvent = {
      type: 'view',
      itemId,
      timestamp: new Date().toISOString(),
    };
    trackInteraction(event);
    refreshProfile();
  };

  const trackClick = (itemId: string, metadata?: Record<string, any>) => {
    const event: InteractionEvent = {
      type: 'click',
      itemId,
      timestamp: new Date().toISOString(),
      metadata,
    };
    trackInteraction(event);
  };

  const trackAddToCart = (itemId: string) => {
    const event: InteractionEvent = {
      type: 'add_to_cart',
      itemId,
      timestamp: new Date().toISOString(),
    };
    trackInteraction(event);
    refreshProfile();
  };

  const trackSearch = (query: string) => {
    const event: InteractionEvent = {
      type: 'search',
      timestamp: new Date().toISOString(),
      metadata: { query },
    };
    trackInteraction(event);
  };

  const trackBooking = (serviceId: string) => {
    const event: InteractionEvent = {
      type: 'booking',
      itemId: serviceId,
      timestamp: new Date().toISOString(),
    };
    trackInteraction(event);
    refreshProfile();
  };

  return {
    profile,
    isReturningUser,
    trackView,
    trackClick,
    trackAddToCart,
    trackSearch,
    trackBooking,
  };
}
