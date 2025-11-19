/**
 * Design System - Spacing Tokens
 * Consistent spacing system for Book module
 */

export const BOOK_SPACING = {
  // Base spacing scale (4px base unit)
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
} as const;

/**
 * Semantic Spacing
 * Named spacing for specific use cases
 */
export const SEMANTIC_SPACING = {
  // Grid & Layout
  gutter: BOOK_SPACING[6],           // 24px - Standard grid gutter
  gutterSm: BOOK_SPACING[4],         // 16px - Compact grid gutter
  gutterLg: BOOK_SPACING[8],         // 32px - Spacious grid gutter

  // Card Padding
  cardPadding: BOOK_SPACING[6],      // 24px - Card internal padding
  cardPaddingSm: BOOK_SPACING[4],    // 16px - Compact card padding
  cardPaddingLg: BOOK_SPACING[8],    // 32px - Spacious card padding

  // Section Spacing
  sectionGap: BOOK_SPACING[8],       // 32px - Between major sections
  sectionGapSm: BOOK_SPACING[6],     // 24px - Compact section gap
  sectionGapLg: BOOK_SPACING[12],    // 48px - Spacious section gap

  // Modal/Dialog
  modalPadding: BOOK_SPACING[8],     // 32px - Modal internal padding
  modalPaddingSm: BOOK_SPACING[6],   // 24px - Mobile modal padding
  modalGap: BOOK_SPACING[6],         // 24px - Between modal sections

  // Form Elements
  inputPadding: BOOK_SPACING[3],     // 12px - Input internal padding
  inputGap: BOOK_SPACING[4],         // 16px - Between form fields
  labelGap: BOOK_SPACING[2],         // 8px - Label to input gap

  // Button Padding
  buttonPaddingSm: `${BOOK_SPACING[2]} ${BOOK_SPACING[3]}`,    // 8px 12px
  buttonPaddingMd: `${BOOK_SPACING[2.5]} ${BOOK_SPACING[4]}`,  // 10px 16px
  buttonPaddingLg: `${BOOK_SPACING[3]} ${BOOK_SPACING[6]}`,    // 12px 24px

  // Icon Sizing
  iconSm: BOOK_SPACING[4],           // 16px
  iconMd: BOOK_SPACING[5],           // 20px
  iconLg: BOOK_SPACING[6],           // 24px
  iconXl: BOOK_SPACING[8],           // 32px

  // Avatar Sizing
  avatarXs: BOOK_SPACING[6],         // 24px
  avatarSm: BOOK_SPACING[8],         // 32px
  avatarMd: BOOK_SPACING[10],        // 40px
  avatarLg: BOOK_SPACING[12],        // 48px
  avatarXl: BOOK_SPACING[16],        // 64px

  // Badge/Chip Padding
  badgePadding: `${BOOK_SPACING[1]} ${BOOK_SPACING[2]}`,      // 4px 8px
  badgePaddingSm: `${BOOK_SPACING[0.5]} ${BOOK_SPACING[1.5]}`, // 2px 6px

  // List Item Padding
  listItemPadding: `${BOOK_SPACING[3]} ${BOOK_SPACING[4]}`,   // 12px 16px
  listItemGap: BOOK_SPACING[2],      // 8px

  // Calendar Specific
  timeSlotHeight: BOOK_SPACING[16],  // 64px - Height per hour slot
  timeSlotHeightCompact: BOOK_SPACING[10],  // 40px
  timeSlotHeightSpacious: BOOK_SPACING[20], // 80px
  staffColumnWidth: BOOK_SPACING[64], // 256px
  staffColumnWidthCompact: BOOK_SPACING[48], // 192px

  // Touch Targets (Accessibility)
  touchTargetMin: BOOK_SPACING[11],  // 44px - Minimum touch target
  touchTargetComfortable: BOOK_SPACING[12], // 48px
} as const;

/**
 * Responsive Spacing Breakpoints
 */
export const RESPONSIVE_SPACING = {
  mobile: {
    gutter: BOOK_SPACING[4],         // 16px
    cardPadding: BOOK_SPACING[4],    // 16px
    sectionGap: BOOK_SPACING[6],     // 24px
  },
  tablet: {
    gutter: BOOK_SPACING[6],         // 24px
    cardPadding: BOOK_SPACING[6],    // 24px
    sectionGap: BOOK_SPACING[8],     // 32px
  },
  desktop: {
    gutter: BOOK_SPACING[8],         // 32px
    cardPadding: BOOK_SPACING[8],    // 32px
    sectionGap: BOOK_SPACING[12],    // 48px
  },
} as const;

/**
 * Helper function to get responsive spacing
 */
export function getResponsiveSpacing(
  breakpoint: 'mobile' | 'tablet' | 'desktop',
  type: keyof typeof RESPONSIVE_SPACING.mobile
): string {
  return RESPONSIVE_SPACING[breakpoint][type];
}

// Export types
export type SpacingKey = keyof typeof BOOK_SPACING;
export type SemanticSpacingKey = keyof typeof SEMANTIC_SPACING;
