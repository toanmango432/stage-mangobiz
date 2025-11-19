import { PremiumColors, PremiumTypography } from '../../../constants/premiumDesignTokens';

interface PriceBreakdownProps {
  subtotal: number;
  tax: number;
  tip: number;
}

/**
 * PriceBreakdown Component
 *
 * Displays itemized pricing with subtotal, tax, tip, and total.
 * Uses monospace font for amounts and consistent typography.
 */
export function PriceBreakdown({ subtotal, tax, tip }: PriceBreakdownProps) {
  const total = subtotal + tax + tip;

  return (
    <div className="px-4 py-3 space-y-1">
      <PriceRow label="Subtotal" amount={subtotal} />
      <PriceRow label="Tax" amount={tax} />
      <PriceRow label="Tip" amount={tip} />

      {/* Total Row */}
      <div
        className="flex justify-between pt-2 mt-2 border-t"
        style={{ borderColor: PremiumColors.borders.light }}
      >
        <span
          className="font-semibold"
          style={{
            fontSize: '14px',
            color: PremiumColors.text.primary,
          }}
        >
          Total:
        </span>
        <span
          className="font-bold"
          style={{
            fontSize: '14px',
            color: PremiumColors.text.primary,
            fontFamily: PremiumTypography.fontFamily.mono,
          }}
        >
          ${total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/**
 * PriceRow Component
 *
 * Individual price line item with label and amount.
 */
function PriceRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between text-xs">
      <span style={{ color: PremiumColors.text.secondary }}>{label}:</span>
      <span
        style={{
          color: PremiumColors.text.primary,
          fontWeight: 500,
          fontFamily: PremiumTypography.fontFamily.mono,
        }}
      >
        ${amount.toFixed(2)}
      </span>
    </div>
  );
}
