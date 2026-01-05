/**
 * Checkout Panel Hooks
 *
 * Extracted from TicketPanel.tsx for better organization and reusability.
 * Each hook handles a specific domain of checkout panel logic.
 */

// Auto-save functionality for existing tickets
export { useTicketAutoSave } from './useTicketAutoSave';

// Payment processing, refunds, and void operations
export { useTicketPayment } from './useTicketPayment';

// Service management (add, remove, update, reassign, packages, products)
export { useTicketServices } from './useTicketServices';

// Dialog state management and handlers
export { useTicketDialogs } from './useTicketDialogs';
