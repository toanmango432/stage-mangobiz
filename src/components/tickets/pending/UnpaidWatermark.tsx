import { PremiumTypography } from '../../../constants/premiumDesignTokens';

/**
 * UnpaidWatermark Component
 *
 * Displays a subtle "UNPAID" stamp overlay on pending payment tickets.
 * Uses monospace font with reduced opacity for non-intrusive branding.
 */
export function UnpaidWatermark() {
  return (
    <div
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.06] pointer-events-none select-none"
      aria-hidden="true"
    >
      <div
        className="text-[#FF6B6B] font-bold text-3xl tracking-[0.2em] uppercase"
        style={{
          fontFamily: PremiumTypography.fontFamily.mono,
          textShadow: '0 0 1px rgba(255,107,107,0.2)',
        }}
      >
        UNPAID
      </div>
    </div>
  );
}
