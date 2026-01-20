/**
 * PaymentModal Module
 * Barrel export for the PaymentModal component and its types
 */

// Main component - default export for backward compatibility
export { default } from "./PaymentModal";

// Types - re-export for backward compatibility
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
} from "./types";

// Constants
export {
  TIP_PERCENTAGES,
  DEFAULT_TIP_PERCENTAGE,
  STEPS,
  PAYMENT_METHODS,
  SUCCESS_ANIMATION_DELAY,
  PAYMENT_COMPLETION_THRESHOLD,
} from "./constants";

// Hooks
export { usePaymentModal } from "./hooks";
export type { UsePaymentModalProps, UsePaymentModalReturn } from "./hooks";

// Sub-components (for advanced usage)
export {
  StepIndicator,
  TipSection,
  PaymentMethodSelector,
  PaymentSummary,
  PaymentInputs,
  CompletionSection,
  ProcessingOverlay,
  PriceChangeWarning,
} from "./components";
