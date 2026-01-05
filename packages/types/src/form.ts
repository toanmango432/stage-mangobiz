/**
 * Form System Types
 * PRD Reference: 2.3.4 Consultation Forms
 */

import type { SyncStatus } from './common';

// ==================== SECTION TYPES ====================

/** Form section types per PRD */
export type FormSectionType =
  | 'client_details'    // Pre-filled from profile
  | 'text_input'        // Single or multi-line text
  | 'single_choice'     // Radio buttons
  | 'multi_choice'      // Checkboxes
  | 'date_picker'       // Date selection
  | 'number_input'      // Numeric value
  | 'file_upload'       // Document/image upload
  | 'consent_checkbox'  // Agreement checkbox
  | 'signature'         // E-signature capture
  | 'info_text';        // Display-only text (markdown)

/** Configuration for client_details section */
export interface ClientDetailsConfig {
  fields: ('name' | 'email' | 'phone' | 'address' | 'birthday')[];
}

/** Configuration for text_input section */
export interface TextInputConfig {
  placeholder?: string;
  multiline?: boolean;
  minLength?: number;
  maxLength?: number;
}

/** Configuration for single/multi choice sections */
export interface ChoiceConfig {
  options: string[];
  allowOther?: boolean;
  minSelections?: number;  // For multi_choice
  maxSelections?: number;  // For multi_choice
}

/** Configuration for date_picker section */
export interface DatePickerConfig {
  minDate?: 'today' | 'past_only' | 'future_only' | string;
  maxDate?: string;
  format?: 'date' | 'datetime';
}

/** Configuration for number_input section */
export interface NumberInputConfig {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/** Configuration for file_upload section */
export interface FileUploadConfig {
  acceptedTypes: ('jpg' | 'png' | 'pdf' | 'doc')[];
  maxSizeMB?: number;
  maxFiles?: number;
}

/** Configuration for consent_checkbox section */
export interface ConsentConfig {
  consentText: string;
  linkText?: string;
  linkUrl?: string;
}

/** Configuration for info_text section */
export interface InfoTextConfig {
  content: string;  // Markdown supported
  variant?: 'default' | 'warning' | 'info';
}

/** Union type for section configuration */
export type FormSectionConfig =
  | ClientDetailsConfig
  | TextInputConfig
  | ChoiceConfig
  | DatePickerConfig
  | NumberInputConfig
  | FileUploadConfig
  | ConsentConfig
  | InfoTextConfig
  | Record<string, unknown>;

// ==================== FORM SECTION ====================

/** Form section definition */
export interface FormSection {
  id: string;
  type: FormSectionType;
  label: string;
  description?: string;
  required: boolean;
  config: FormSectionConfig;
  order: number;
  conditionalOn?: {
    sectionId: string;
    value: string | string[] | boolean;
  };
}

// ==================== FORM TEMPLATE ====================

/** Form send mode */
export type FormSendMode = 'automatic' | 'manual';

/** Form frequency for automatic forms */
export type FormFrequency = 'every_time' | 'once';

/** Form template definition */
export interface FormTemplate {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  category?: 'health' | 'consent' | 'consultation' | 'feedback' | 'custom';
  sendMode: FormSendMode;
  frequency?: FormFrequency;
  linkedServiceIds?: string[];
  requiresSignature: boolean;
  sendBeforeHours?: number;  // Hours before appointment to send
  reminderEnabled?: boolean;
  reminderIntervalHours?: number;
  expirationHours?: number;  // Default 24 hours
  sections: FormSection[];
  isActive: boolean;
  isBuiltIn?: boolean;  // Pre-built templates
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

// ==================== FORM RESPONSE ====================

/** Form response status */
export type FormResponseStatus = 'pending' | 'in_progress' | 'completed' | 'expired';

/** Form response (client submission) */
export interface FormResponse {
  id: string;
  formTemplateId: string;
  templateName?: string;
  clientId: string;
  appointmentId?: string;
  responses: Record<string, FormFieldValue>;
  signatureImage?: string;
  signatureType?: 'draw' | 'type';
  signatureTypedName?: string;
  status: FormResponseStatus;
  sentAt: string;
  sentVia?: 'email' | 'sms' | 'in_app';
  startedAt?: string;
  completedAt?: string;
  completedBy: 'client' | string;  // 'client' or staff ID
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

/** Possible field values */
export type FormFieldValue =
  | string
  | number
  | boolean
  | string[]
  | Date
  | null;

// ==================== FORM BUILDER STATE ====================

/** Builder mode */
export type BuilderMode = 'edit' | 'preview';

/** Drag and drop item */
export interface DragItem {
  id: string;
  type: 'section';
  index: number;
}

/** Form builder state */
export interface FormBuilderState {
  template: Partial<FormTemplate>;
  selectedSectionId: string | null;
  mode: BuilderMode;
  isDirty: boolean;
  errors: Record<string, string>;
}

// ==================== FORM COMPLETION STATE ====================

/** Form completion state */
export interface FormCompletionState {
  formId: string;
  templateId: string;
  currentStep: number;
  totalSteps: number;
  responses: Record<string, FormFieldValue>;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
  isComplete: boolean;
}

// ==================== SIGNATURE ====================

/** Signature data */
export interface SignatureData {
  type: 'draw' | 'type';
  dataUrl?: string;  // Base64 PNG for draw
  typedName?: string;
  timestamp: string;
  ipAddress?: string;
}

// ==================== TEMPLATE LIBRARY ====================

/** Pre-built template category */
export type TemplateCategory =
  | 'health_safety'
  | 'consent_waiver'
  | 'consultation'
  | 'custom';

/** Template library item */
export interface TemplateLibraryItem {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  previewImage?: string;
  template: Omit<FormTemplate, 'id' | 'storeId' | 'createdAt' | 'updatedAt' | 'syncStatus'>;
}
