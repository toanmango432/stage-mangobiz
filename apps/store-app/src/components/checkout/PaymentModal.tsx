/**
 * PaymentModal - Backward Compatible Export
 *
 * This file re-exports from the modularized PaymentModal folder.
 * All imports from './PaymentModal' continue to work unchanged.
 *
 * Module structure:
 * - PaymentModal/PaymentModal.tsx - Main component (~270 lines)
 * - PaymentModal/types.ts - Type definitions
 * - PaymentModal/constants.ts - Configuration constants
 * - PaymentModal/hooks/ - usePaymentModal hook
 * - PaymentModal/components/ - Sub-components
 * - PaymentModal/index.ts - Barrel exports
 */

// Default export - the main PaymentModal component
export { default } from "./PaymentModal/index";

// Named exports - types for backward compatibility
export type {
  PaymentMethod,
  TipDistribution,
  TicketItem,
  PaymentModalProps,
  PaymentCompletionData,
  StaffMember,
  PaymentMethodType,
  PaymentMethodOption,
  Step,
} from "./PaymentModal/types";

// Constants export
export {
  TIP_PERCENTAGES,
  DEFAULT_TIP_PERCENTAGE,
  STEPS,
  PAYMENT_METHODS,
  SUCCESS_ANIMATION_DELAY,
  PAYMENT_COMPLETION_THRESHOLD,
} from "./PaymentModal/constants";

// Hook export
export { usePaymentModal } from "./PaymentModal/hooks";
export type { UsePaymentModalProps, UsePaymentModalReturn } from "./PaymentModal/hooks";

// Sub-components export (for advanced usage)
export {
  StepIndicator,
  TipSection,
  PaymentMethodSelector,
  PaymentSummary,
  PaymentInputs,
  CompletionSection,
  ProcessingOverlay,
  PriceChangeWarning,
} from "./PaymentModal/components";
