/**
 * GiftCardGrid - Displays gift card denominations for sale at checkout
 *
 * Uses real denomination data from useCatalog hook (IndexedDB)
 * Supports custom amounts if enabled in gift card settings
 *
 * Simplified: Custom amount now handled in modal, not inline
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Gift, Plus } from 'lucide-react';
import type { GiftCardDenomination, GiftCardSettings } from '@/types/catalog';
import { SellGiftCardModal, type GiftCardSaleData } from './modals/SellGiftCardModal';

interface GiftCardGridProps {
  denominations: GiftCardDenomination[];
  settings?: GiftCardSettings | null;
  onAddGiftCard: (giftCardData: GiftCardSaleData) => void;
  className?: string;
}

const GRADIENT_COLORS = [
  'bg-gradient-to-br from-emerald-400 to-emerald-600',
  'bg-gradient-to-br from-blue-400 to-blue-600',
  'bg-gradient-to-br from-purple-400 to-purple-600',
  'bg-gradient-to-br from-amber-400 to-amber-600',
  'bg-gradient-to-br from-rose-400 to-rose-600',
  'bg-gradient-to-br from-brand-400 to-brand-600',
  'bg-gradient-to-br from-cyan-400 to-cyan-600',
  'bg-gradient-to-br from-pink-400 to-pink-600',
];

function getGradientForIndex(index: number): string {
  return GRADIENT_COLORS[index % GRADIENT_COLORS.length];
}

export function GiftCardGrid({
  denominations,
  settings,
  onAddGiftCard,
  className,
}: GiftCardGridProps) {
  const [selectedDenomination, setSelectedDenomination] = useState<GiftCardDenomination | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomAmountMode, setIsCustomAmountMode] = useState(false);

  // Filter to only show active denominations
  const activeDenominations = denominations
    .filter(d => d.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const handleDenominationClick = (denomination: GiftCardDenomination) => {
    setSelectedDenomination(denomination);
    setIsCustomAmountMode(false);
    setIsModalOpen(true);
  };

  const handleCustomAmountClick = () => {
    setSelectedDenomination(null);
    setIsCustomAmountMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDenomination(null);
    setIsCustomAmountMode(false);
  };

  const handleAddToTicket = (giftCardData: GiftCardSaleData) => {
    onAddGiftCard(giftCardData);
  };

  const allowCustomAmount = settings?.allowCustomAmount ?? true;
  const minAmount = settings?.minAmount ?? 5;
  const maxAmount = settings?.maxAmount ?? 500;

  return (
    <>
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4', className)}>
        {/* Preset Denominations */}
        {activeDenominations.map((denomination, index) => (
          <button
            key={denomination.id}
            onClick={() => handleDenominationClick(denomination)}
            className={cn(
              'group relative rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02] overflow-hidden',
              getGradientForIndex(index)
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

            {/* Card Label */}
            <h3 className="relative font-medium text-white text-sm mb-1 opacity-90">
              {denomination.label || 'Gift Card'}
            </h3>

            {/* Value */}
            <p className="relative text-3xl font-bold text-white">
              ${denomination.amount}
            </p>
          </button>
        ))}

        {/* Custom Amount Card - Opens modal directly */}
        {allowCustomAmount && (
          <button
            onClick={handleCustomAmountClick}
            className="group relative rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-md hover:scale-[1.02] bg-gray-100 border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50"
          >
            {/* Plus Icon */}
            <div className="relative w-10 h-10 rounded-full bg-gray-200 group-hover:bg-brand-100 flex items-center justify-center mb-4 transition-colors">
              <Plus className="w-5 h-5 text-gray-500 group-hover:text-brand-600 transition-colors" />
            </div>

            {/* Label */}
            <h3 className="relative font-medium text-gray-600 group-hover:text-brand-700 text-sm mb-1 transition-colors">
              Custom Amount
            </h3>

            {/* Value hint */}
            <p className="relative text-xl font-bold text-gray-400 group-hover:text-brand-500 transition-colors">
              ${minAmount} - ${maxAmount}
            </p>
          </button>
        )}

        {/* Empty State */}
        {activeDenominations.length === 0 && !allowCustomAmount && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No Gift Cards Available</p>
            <p className="text-sm mt-1">Configure denominations in Menu Settings</p>
          </div>
        )}
      </div>

      {/* Sell Gift Card Modal */}
      <SellGiftCardModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        denomination={selectedDenomination}
        isCustomAmount={isCustomAmountMode}
        minAmount={minAmount}
        maxAmount={maxAmount}
        onAddToTicket={handleAddToTicket}
      />
    </>
  );
}

export default GiftCardGrid;
