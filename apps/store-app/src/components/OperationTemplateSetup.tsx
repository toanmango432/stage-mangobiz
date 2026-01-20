/**
 * OperationTemplateSetup - Re-export for backward compatibility
 *
 * This file maintains backward compatibility for existing imports.
 * The actual component is now located in the OperationTemplateSetup/ folder.
 *
 * @example
 * // Both import styles work:
 * import { OperationTemplateSetup } from './OperationTemplateSetup';
 * import { OperationTemplateSetup } from './OperationTemplateSetup/OperationTemplateSetup';
 */

// Re-export main component
export { OperationTemplateSetup } from './OperationTemplateSetup/OperationTemplateSetup';

// Re-export types for consumers
export type {
  OperationTemplateSetupProps,
  QuickAnswers,
  TemplateDetails,
} from './OperationTemplateSetup/types';
