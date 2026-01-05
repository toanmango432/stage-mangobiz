import { cn } from '@/lib/utils';
import { Gift } from 'lucide-react';
import type { GiftCard } from '@/data/mockGiftCards';

interface GiftCardGridProps {
  giftCards: GiftCard[];
  onSelectGiftCard: (giftCard: GiftCard) => void;
  className?: string;
}

export function GiftCardGrid({ giftCards, onSelectGiftCard, className }: GiftCardGridProps) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4', className)}>
      {giftCards.map((giftCard) => (
        <button
          key={giftCard.id}
          onClick={() => onSelectGiftCard(giftCard)}
          className={cn(
            'group relative rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02] overflow-hidden',
            giftCard.gradient
          )}
        >
          {/* Decorative pattern */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
              <circle cx="80" cy="20" r="40" />
              <circle cx="100" cy="50" r="30" />
            </svg>
          </div>

          {/* Gift Icon */}
          <div className="relative w-10 h-10 rounded-full bg-white/30 flex items-center justify-center mb-4">
            <Gift className="w-5 h-5 text-white" />
          </div>

          {/* Card Name */}
          <h3 className="relative font-medium text-white text-sm mb-1 opacity-90">
            Gift Card
          </h3>

          {/* Value */}
          <p className="relative text-3xl font-bold text-white">
            ${giftCard.value}
          </p>

          {/* Design Label */}
          <p className="relative text-xs text-white/70 mt-2 capitalize">
            {giftCard.design} Edition
          </p>
        </button>
      ))}
    </div>
  );
}

export default GiftCardGrid;
