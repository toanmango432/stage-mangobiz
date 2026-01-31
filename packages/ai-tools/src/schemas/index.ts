/**
 * @mango/ai-tools - Schema Index
 *
 * Re-exports all tool schemas for convenient importing.
 * Import from '@mango/ai-tools/schemas' to access all schemas.
 */

// Client tool schemas and definitions
export {
  // Schemas
  searchClientsSchema,
  getClientSchema,
  getClientHistorySchema,
  createClientSchema,
  updateClientSchema,
  addClientNoteSchema,
  clientSchemas,
  // Tool definitions
  searchClientsTool,
  getClientTool,
  getClientHistoryTool,
  createClientTool,
  updateClientTool,
  addClientNoteTool,
  clientTools,
  // Input types
  type SearchClientsInput,
  type GetClientInput,
  type GetClientHistoryInput,
  type CreateClientInput,
  type UpdateClientInput,
  type AddClientNoteInput,
} from './clients';

// Appointment tool schemas and definitions
export {
  // Schemas
  searchAppointmentsSchema,
  getAppointmentSchema,
  checkAvailabilitySchema,
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  appointmentSchemas,
  // Tool definitions
  searchAppointmentsTool,
  getAppointmentTool,
  checkAvailabilityTool,
  bookAppointmentTool,
  rescheduleAppointmentTool,
  cancelAppointmentTool,
  appointmentTools,
  // Input types
  type SearchAppointmentsInput,
  type GetAppointmentInput,
  type CheckAvailabilityInput,
  type BookAppointmentInput,
  type RescheduleAppointmentInput,
  type CancelAppointmentInput,
} from './appointments';

// Service tool schemas and definitions
export {
  // Schemas
  searchServicesSchema,
  getServiceSchema,
  getServicesByStaffSchema,
  getPopularServicesSchema,
  getServicePricingSchema,
  serviceSchemas,
  // Tool definitions
  searchServicesTool,
  getServiceTool,
  getServicesByStaffTool,
  getPopularServicesTool,
  getServicePricingTool,
  serviceTools,
  // Input types
  type SearchServicesInput,
  type GetServiceInput,
  type GetServicesByStaffInput,
  type GetPopularServicesInput,
  type GetServicePricingInput,
} from './services';

// Ticket tool schemas and definitions
export {
  // Schemas
  getOpenTicketsSchema,
  getTicketSchema,
  createTicketSchema,
  addTicketItemSchema,
  applyDiscountSchema,
  closeTicketSchema,
  voidTicketSchema,
  removeTicketItemSchema,
  ticketSchemas,
  // Tool definitions
  getOpenTicketsTool,
  getTicketTool,
  createTicketTool,
  addTicketItemTool,
  applyDiscountTool,
  closeTicketTool,
  voidTicketTool,
  removeTicketItemTool,
  ticketTools,
  // Input types
  type GetOpenTicketsInput,
  type GetTicketInput,
  type CreateTicketInput,
  type AddTicketItemInput,
  type ApplyDiscountInput,
  type CloseTicketInput,
  type VoidTicketInput,
  type RemoveTicketItemInput,
} from './tickets';

// Staff tool schemas and definitions
export {
  // Schemas
  searchStaffSchema,
  getStaffSchema,
  getStaffScheduleSchema,
  getStaffAvailabilitySchema,
  getOnDutyStaffSchema,
  getStaffPerformanceSchema,
  staffSchemas,
  // Tool definitions
  searchStaffTool,
  getStaffTool,
  getStaffScheduleTool,
  getStaffAvailabilityTool,
  getOnDutyStaffTool,
  getStaffPerformanceTool,
  staffTools,
  // Input types
  type SearchStaffInput,
  type GetStaffInput,
  type GetStaffScheduleInput,
  type GetStaffAvailabilityInput,
  type GetOnDutyStaffInput,
  type GetStaffPerformanceInput,
} from './staff';

// Analytics tool schemas and definitions
export {
  // Schemas
  getDashboardMetricsSchema,
  getSalesReportSchema,
  getClientRetentionSchema,
  getServicePopularitySchema,
  getPeakHoursSchema,
  analyticsSchemas,
  // Tool definitions
  getDashboardMetricsTool,
  getSalesReportTool,
  getClientRetentionTool,
  getServicePopularityTool,
  getPeakHoursTool,
  analyticsTools,
  // Input types
  type GetDashboardMetricsInput,
  type GetSalesReportInput,
  type GetClientRetentionInput,
  type GetServicePopularityInput,
  type GetPeakHoursInput,
} from './analytics';

// System tool schemas and definitions
export {
  // Schemas
  getStoreInfoSchema,
  getCurrentTimeSchema,
  getBusinessHoursSchema,
  isStoreOpenSchema,
  getSystemStatusSchema,
  logAIActionSchema,
  systemSchemas,
  // Tool definitions
  getStoreInfoTool,
  getCurrentTimeTool,
  getBusinessHoursTool,
  isStoreOpenTool,
  getSystemStatusTool,
  logAIActionTool,
  systemTools,
  // Input types
  type GetStoreInfoInput,
  type GetCurrentTimeInput,
  type GetBusinessHoursInput,
  type IsStoreOpenInput,
  type GetSystemStatusInput,
  type LogAIActionInput,
} from './system';

/**
 * All schema objects grouped by category
 */
export const allSchemas = {
  clients: {
    searchClients: searchClientsSchema,
    getClient: getClientSchema,
    getClientHistory: getClientHistorySchema,
    createClient: createClientSchema,
    updateClient: updateClientSchema,
    addClientNote: addClientNoteSchema,
  },
  appointments: {
    searchAppointments: searchAppointmentsSchema,
    getAppointment: getAppointmentSchema,
    checkAvailability: checkAvailabilitySchema,
    bookAppointment: bookAppointmentSchema,
    rescheduleAppointment: rescheduleAppointmentSchema,
    cancelAppointment: cancelAppointmentSchema,
  },
  services: {
    searchServices: searchServicesSchema,
    getService: getServiceSchema,
    getServicesByStaff: getServicesByStaffSchema,
    getPopularServices: getPopularServicesSchema,
    getServicePricing: getServicePricingSchema,
  },
  tickets: {
    getOpenTickets: getOpenTicketsSchema,
    getTicket: getTicketSchema,
    createTicket: createTicketSchema,
    addTicketItem: addTicketItemSchema,
    applyDiscount: applyDiscountSchema,
    closeTicket: closeTicketSchema,
    voidTicket: voidTicketSchema,
    removeTicketItem: removeTicketItemSchema,
  },
  staff: {
    searchStaff: searchStaffSchema,
    getStaff: getStaffSchema,
    getStaffSchedule: getStaffScheduleSchema,
    getStaffAvailability: getStaffAvailabilitySchema,
    getOnDutyStaff: getOnDutyStaffSchema,
    getStaffPerformance: getStaffPerformanceSchema,
  },
  analytics: {
    getDashboardMetrics: getDashboardMetricsSchema,
    getSalesReport: getSalesReportSchema,
    getClientRetention: getClientRetentionSchema,
    getServicePopularity: getServicePopularitySchema,
    getPeakHours: getPeakHoursSchema,
  },
  system: {
    getStoreInfo: getStoreInfoSchema,
    getCurrentTime: getCurrentTimeSchema,
    getBusinessHours: getBusinessHoursSchema,
    isStoreOpen: isStoreOpenSchema,
    getSystemStatus: getSystemStatusSchema,
    logAIAction: logAIActionSchema,
  },
};

// Import for allSchemas
import { searchClientsSchema, getClientSchema, getClientHistorySchema, createClientSchema, updateClientSchema, addClientNoteSchema } from './clients';
import { searchAppointmentsSchema, getAppointmentSchema, checkAvailabilitySchema, bookAppointmentSchema, rescheduleAppointmentSchema, cancelAppointmentSchema } from './appointments';
import { searchServicesSchema, getServiceSchema, getServicesByStaffSchema, getPopularServicesSchema, getServicePricingSchema } from './services';
import { getOpenTicketsSchema, getTicketSchema, createTicketSchema, addTicketItemSchema, applyDiscountSchema, closeTicketSchema, voidTicketSchema, removeTicketItemSchema } from './tickets';
import { searchStaffSchema, getStaffSchema, getStaffScheduleSchema, getStaffAvailabilitySchema, getOnDutyStaffSchema, getStaffPerformanceSchema } from './staff';
import { getDashboardMetricsSchema, getSalesReportSchema, getClientRetentionSchema, getServicePopularitySchema, getPeakHoursSchema } from './analytics';
import { getStoreInfoSchema, getCurrentTimeSchema, getBusinessHoursSchema, isStoreOpenSchema, getSystemStatusSchema, logAIActionSchema } from './system';
