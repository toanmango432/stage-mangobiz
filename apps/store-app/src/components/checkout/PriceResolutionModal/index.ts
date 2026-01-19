/**
 * PriceResolutionModal module - Modal for reviewing and resolving service price changes.
 *
 * @module PriceResolutionModal
 */

// Main modal component
export { default } from './PriceResolutionModal';
export type { PriceResolutionModalProps } from './PriceResolutionModal';

// Sub-components
export { ServiceResolutionRow } from './ServiceResolutionRow';
export { PriceResolutionSummary } from './PriceResolutionSummary';

// Types
export type {
  ResolutionOption,
  ServiceResolutionState,
  ServiceResolutionRowProps,
} from './ServiceResolutionRow';

export type {
  PriceResolutionSummaryData,
  PriceResolutionSummaryProps,
} from './PriceResolutionSummary';
