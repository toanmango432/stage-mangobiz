/**
 * PriceResolutionModal module - Modal for reviewing and resolving service price changes.
 *
 * @module PriceResolutionModal
 */

// Main modal component - default export from original file location
// Note: The main PriceResolutionModal.tsx will be moved here in US-009
export { default } from '../PriceResolutionModal';

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
