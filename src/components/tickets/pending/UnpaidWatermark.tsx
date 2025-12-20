import { PremiumTypography } from '@/constants/premiumDesignTokens';

/**
 * UnpaidWatermark Component
 *
 * Displays a subtle "UNPAID" stamp overlay on pending payment tickets.
 * Uses monospace font with reduced opacity for non-intrusive branding.
 */
export function UnpaidWatermark() {
  return (
    <div
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 opacity-[0.15] pointer-events-none select-none"
      aria-hidden="true"
    >
      <div
        className="text-[#B8860B] font-black text-5xl tracking-[0.25em] uppercase"
        style={{
          fontFamily: PremiumTypography.fontFamily.mono,
          textShadow: '0 0 2px rgba(184, 134, 11, 0.3), 0 1px 3px rgba(184, 134, 11, 0.2)',
          WebkitTextStroke: '0.5px rgba(184, 134, 11, 0.3)',
        }}
      >
        UNPAID
      </div>
    </div>
  );
}
