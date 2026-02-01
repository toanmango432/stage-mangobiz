/**
 * Validation Utilities
 *
 * Provides validation functions for foreign keys and data relationships
 * to ensure data integrity before creating/updating entities.
 * Also includes input validation helpers for forms.
 */

// DataService interface for dependency injection
// This allows the validation functions to work without a direct import
interface DataServiceInterface {
  clients: { getById: (id: string) => Promise<unknown> };
  staff: { getById: (id: string) => Promise<unknown> };
  services: { getById: (id: string) => Promise<unknown> };
  appointments: { getById: (id: string) => Promise<unknown> };
  tickets: { getById: (id: string) => Promise<unknown> };
}

// Module-level dataService instance (set via setDataService)
let dataService: DataServiceInterface | null = null;

/**
 * Set the dataService instance for foreign key validation.
 * Must be called before using validateForeignKey functions.
 */
export function setDataService(service: DataServiceInterface): void {
  dataService = service;
}

// =============================================================================
// Input Validation & Formatting Helpers
// =============================================================================

/**
 * Validate a name field and return an error message if invalid
 */
export function getNameError(value: string, fieldLabel: string = 'Name'): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${fieldLabel} is required`;
  }
  if (trimmed.length < 2) {
    return `${fieldLabel} must be at least 2 characters`;
  }
  if (trimmed.length > 50) {
    return `${fieldLabel} must be less than 50 characters`;
  }
  // Only allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return `${fieldLabel} can only contain letters, spaces, hyphens, and apostrophes`;
  }
  return null;
}

/**
 * Validate a phone number and return an error message if invalid
 */
export function getPhoneError(value: string): string | null {
  const cleaned = value.replace(/\D/g, '');
  if (!cleaned) {
    return 'Phone number is required';
  }
  if (cleaned.length < 10) {
    return 'Phone number must be at least 10 digits';
  }
  if (cleaned.length > 15) {
    return 'Phone number is too long';
  }
  return null;
}

/**
 * Validate an email and return an error message if invalid
 */
export function getEmailError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null; // Email is often optional
  }
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address';
  }
  return null;
}

/**
 * Check if an email is valid (boolean version)
 */
export function isValidEmail(value: string): boolean {
  if (!value || !value.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
}

/**
 * Check if a phone number is valid (boolean version)
 */
export function isValidPhoneNumber(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Format name input - allows only letters, spaces, hyphens, apostrophes
 */
export function formatNameInput(value: string): string {
  // Remove any characters that aren't letters, spaces, hyphens, or apostrophes
  return value.replace(/[^a-zA-Z\s'-]/g, '');
}

/**
 * Capitalize a name properly (first letter uppercase, rest lowercase)
 */
export function capitalizeName(value: string): string {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// =============================================================================
// Foreign Key Validation
// =============================================================================

export type EntityType = 'client' | 'staff' | 'service' | 'appointment' | 'ticket';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a foreign key entity exists
 * Note: Requires setDataService() to be called first
 */
export async function validateForeignKey(
  entityType: EntityType,
  id: string | null | undefined
): Promise<ValidationResult> {
  // Allow null/undefined for optional foreign keys
  if (!id) {
    return { valid: true };
  }

  // Check if dataService is configured
  if (!dataService) {
    return {
      valid: false,
      error: 'dataService not configured. Call setDataService() first.',
    };
  }

  try {
    let exists = false;

    switch (entityType) {
      case 'client':
        const client = await dataService.clients.getById(id);
        exists = !!client;
        break;

      case 'staff':
        const staff = await dataService.staff.getById(id);
        exists = !!staff;
        break;

      case 'service':
        const service = await dataService.services.getById(id);
        exists = !!service;
        break;

      case 'appointment':
        const appointment = await dataService.appointments.getById(id);
        exists = !!appointment;
        break;

      case 'ticket':
        const ticket = await dataService.tickets.getById(id);
        exists = !!ticket;
        break;

      default:
        return {
          valid: false,
          error: `Unknown entity type: ${entityType}`,
        };
    }

    if (!exists) {
      return {
        valid: false,
        error: `${entityType} with id "${id}" does not exist`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Error validating ${entityType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate multiple foreign keys at once
 */
export async function validateForeignKeys(
  validations: Array<{ type: EntityType; id: string | null | undefined; fieldName?: string }>
): Promise<ValidationResult> {
  for (const validation of validations) {
    const result = await validateForeignKey(validation.type, validation.id);
    if (!result.valid) {
      return {
        valid: false,
        error: validation.fieldName
          ? `${validation.fieldName}: ${result.error}`
          : result.error,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate ticket creation input
 */
export async function validateTicketInput(input: {
  clientId?: string | null;
  appointmentId?: string | null;
  services?: Array<{ serviceId: string; staffId: string }>;
}): Promise<ValidationResult> {
  const validations: Array<{ type: EntityType; id: string | null | undefined; fieldName?: string }> = [];

  // Validate client
  if (input.clientId) {
    validations.push({ type: 'client', id: input.clientId, fieldName: 'clientId' });
  }

  // Validate appointment
  if (input.appointmentId) {
    validations.push({ type: 'appointment', id: input.appointmentId, fieldName: 'appointmentId' });
  }

  // Validate services and staff
  if (input.services) {
    for (const service of input.services) {
      validations.push({ type: 'service', id: service.serviceId, fieldName: 'serviceId' });
      validations.push({ type: 'staff', id: service.staffId, fieldName: 'staffId' });
    }
  }

  return await validateForeignKeys(validations);
}

/**
 * Validate appointment creation input
 */
export async function validateAppointmentInput(input: {
  clientId: string;
  staffId: string;
  services?: Array<{ serviceId: string; staffId: string }>;
}): Promise<ValidationResult> {
  const validations: Array<{ type: EntityType; id: string | null | undefined; fieldName?: string }> = [
    { type: 'client', id: input.clientId, fieldName: 'clientId' },
    { type: 'staff', id: input.staffId, fieldName: 'staffId' },
  ];

  // Validate services and their assigned staff
  if (input.services) {
    for (const service of input.services) {
      validations.push({ type: 'service', id: service.serviceId, fieldName: 'serviceId' });
      validations.push({ type: 'staff', id: service.staffId, fieldName: 'staffId' });
    }
  }

  return await validateForeignKeys(validations);
}

/**
 * Validate transaction creation input
 */
export async function validateTransactionInput(input: {
  ticketId: string;
  clientId?: string | null;
}): Promise<ValidationResult> {
  const validations: Array<{ type: EntityType; id: string | null | undefined; fieldName?: string }> = [
    { type: 'ticket', id: input.ticketId, fieldName: 'ticketId' },
  ];

  // Validate client if provided
  if (input.clientId) {
    validations.push({ type: 'client', id: input.clientId, fieldName: 'clientId' });
  }

  return await validateForeignKeys(validations);
}
