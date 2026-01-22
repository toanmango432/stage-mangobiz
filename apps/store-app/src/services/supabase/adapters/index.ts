/**
 * Supabase Type Adapters Index
 *
 * Export all type adapters for converting between
 * Supabase row types and application types.
 */

// Appointment adapters
export {
  toAppointment,
  toAppointments,
  toAppointmentInsert,
  toAppointmentUpdate,
  fromCreateInput as fromAppointmentCreateInput,
} from './appointmentAdapter';

// Client adapters
export {
  toClient,
  toClients,
  toClientInsert,
  toClientUpdate,
} from './clientAdapter';

// Staff adapters
export {
  toStaff,
  toStaffList,
  toStaffInsert,
  toStaffUpdate,
} from './staffAdapter';

// Service adapters
export {
  toService,
  toServices,
  toServiceInsert,
  toServiceUpdate,
} from './serviceAdapter';

// Ticket adapters
export {
  toTicket,
  toTickets,
  toTicketInsert,
  toTicketUpdate,
} from './ticketAdapter';

// Transaction adapters
export {
  toTransaction,
  toTransactions,
  toTransactionInsert,
  toTransactionUpdate,
} from './transactionAdapter';

// PayRun adapters
export {
  toPayRun,
  toPayRuns,
  toPayRunInsert,
  toPayRunUpdate,
} from './payRunAdapter';

// Gift Card adapters
export {
  toGiftCard,
  toGiftCards,
  toGiftCardInsert,
  toGiftCardUpdate,
  toGiftCardTransaction,
  toGiftCardTransactions,
  toGiftCardTransactionInsert,
  isRowRedeemable,
  getRowStatusDisplay,
} from './giftCardAdapter';

// ============================================
// CATALOG MODULE ADAPTERS
// ============================================

// ServiceCategory adapters
export {
  toServiceCategory,
  toServiceCategories,
  toServiceCategoryInsert,
  toServiceCategoryUpdate,
} from './serviceCategoryAdapter';

// MenuService adapters
export {
  toMenuService,
  toMenuServices,
  toMenuServiceInsert,
  toMenuServiceUpdate,
} from './menuServiceAdapter';

// ServiceVariant adapters
export {
  toServiceVariant,
  toServiceVariants,
  toServiceVariantInsert,
  toServiceVariantUpdate,
} from './serviceVariantAdapter';

// ServicePackage adapters
export {
  toServicePackage,
  toServicePackages,
  toServicePackageInsert,
  toServicePackageUpdate,
} from './servicePackageAdapter';
