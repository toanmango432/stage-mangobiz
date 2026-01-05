/**
 * Mango Design System - Main Export
 *
 * Import design tokens from here:
 *
 * @example
 * // Main tokens
 * import { brand, colors, typography } from '@/design-system';
 * import MangoDesignSystem from '@/design-system';
 *
 * // Module-specific tokens
 * import { bookTokens } from '@/design-system/modules/book';
 * import { frontDeskTokens } from '@/design-system/modules/frontdesk';
 * import { ticketPanelTokens } from '@/design-system/modules/ticketPanel';
 */

// Main design tokens
export {
  default,
  brand,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  calendar,
  components,
  cssVariables,
  tailwindTheme,
} from './tokens';

// Module adapters (for module-specific tokens)
export * from './modules';
