/**
 * Paper Ticket Components
 * Unified design system for all ticket cards
 */

export { BasePaperTicket } from './BasePaperTicket';
export type { TicketState, ViewMode } from './BasePaperTicket';

export {
  StateIndicator,
  PriorityBadge,
  CompletionStamp,
  WaitTimeIndicator,
  ProgressIndicator,
} from './StateIndicators';

export {
  paperColors,
  paperShadows,
  paperGradients,
  paperAnimations,
  perforationConfig,
  notchConfig,
  stateBorderStyles,
  getViewModeStyles,
  getHoverStyles,
  paperKeyframes,
} from './PaperTicketStyles';