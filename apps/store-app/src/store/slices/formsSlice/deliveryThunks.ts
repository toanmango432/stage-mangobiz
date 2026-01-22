/**
 * Form Delivery Thunks
 * Redux async thunks for form delivery operations
 * Part of: Client Module Phase 3 - Forms, Segments, Import/Export
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../../services/supabase/client';
import type { FormDelivery, FormDeliveryMethod, FormDeliveryStatus } from '../../../types/form';

// ==================== INPUT/OUTPUT TYPES ====================

/** Input for sending a form to a client */
export interface SendFormToClientInput {
  clientId: string;
  formTemplateId: string;
  deliveryMethod: FormDeliveryMethod;
  appointmentId?: string;
  storeId: string;
}

/** Response from the send-form Edge Function */
export interface SendFormResponse {
  success: boolean;
  delivery?: {
    id: string;
    token: string;
    formLink: string;
    expiresAt: string;
    deliveryStatus: string;
    messageId?: string;
  };
  error?: string;
}

/** Input for fetching form deliveries */
export interface FetchFormDeliveriesInput {
  storeId: string;
  clientId?: string;
  appointmentId?: string;
  status?: FormDeliveryStatus;
}

/** Input for generating a form PDF */
export interface GenerateFormPdfInput {
  formSubmissionId: string;
  storeId: string;
}

/** Response from the generate-form-pdf Edge Function */
export interface GenerateFormPdfResponse {
  success: boolean;
  pdfUrl?: string;
  fileName?: string;
  error?: string;
}

/** Input for checking form completion status */
export interface CheckFormCompletionInput {
  clientId: string;
  storeId: string;
  formTemplateIds?: string[];
  appointmentId?: string;
}

/** Form completion status result */
export interface FormCompletionResult {
  formTemplateId: string;
  formTemplateName: string;
  completed: boolean;
  submissionId?: string;
  completedAt?: string;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert snake_case delivery record to camelCase FormDelivery
 */
function toFormDelivery(row: Record<string, unknown>): FormDelivery {
  return {
    id: row.id as string,
    storeId: row.store_id as string,
    formTemplateId: row.form_template_id as string,
    clientId: row.client_id as string,
    appointmentId: row.appointment_id as string | undefined,
    formSubmissionId: row.form_submission_id as string | undefined,
    deliveryMethod: row.delivery_method as FormDeliveryMethod,
    token: row.token as string,
    deliveryEmail: row.delivery_email as string | undefined,
    deliveryPhone: row.delivery_phone as string | undefined,
    sentAt: row.sent_at as string,
    openedAt: row.opened_at as string | undefined,
    completedAt: row.completed_at as string | undefined,
    expiresAt: row.expires_at as string,
    deliveryStatus: row.delivery_status as FormDeliveryStatus,
    deliveryError: row.delivery_error as string | undefined,
    messageId: row.message_id as string | undefined,
    reminderSentAt: row.reminder_sent_at as string | undefined,
    reminderCount: (row.reminder_count as number) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ==================== THUNKS ====================

/**
 * Send a form to a client via email or SMS
 * Calls the send-form Edge Function which:
 * 1. Generates a unique token for the form link
 * 2. Creates a form_delivery record
 * 3. Sends the email/SMS with the form link
 */
export const sendFormToClient = createAsyncThunk<
  FormDelivery,
  SendFormToClientInput
>(
  'forms/delivery/sendFormToClient',
  async ({ clientId, formTemplateId, deliveryMethod, appointmentId, storeId }, { rejectWithValue }) => {
    try {
      console.log('[sendFormToClient] Sending form:', {
        clientId,
        formTemplateId,
        deliveryMethod,
        appointmentId,
      });

      // Call the send-form Edge Function
      const { data, error } = await supabase.functions.invoke('send-form', {
        body: {
          clientId,
          formTemplateId,
          deliveryMethod,
          appointmentId,
          storeId,
        },
      });

      if (error) {
        console.error('[sendFormToClient] Edge Function error:', error);
        return rejectWithValue(
          error.message || 'Failed to send form. Please try again.'
        );
      }

      // Validate response
      if (!data || !data.success) {
        const errorMessage = data?.error || 'Form delivery failed. Please try again.';
        console.error('[sendFormToClient] Send failed:', errorMessage);
        return rejectWithValue(errorMessage);
      }

      // Fetch the full delivery record to return
      const { data: deliveryRecord, error: fetchError } = await supabase
        .from('form_deliveries')
        .select('*')
        .eq('id', data.delivery?.id)
        .single();

      if (fetchError || !deliveryRecord) {
        // If we can't fetch, construct from the response
        console.warn('[sendFormToClient] Could not fetch delivery record, using response data');
        return {
          id: data.delivery.id,
          storeId,
          formTemplateId,
          clientId,
          appointmentId,
          deliveryMethod,
          token: data.delivery.token,
          sentAt: new Date().toISOString(),
          expiresAt: data.delivery.expiresAt,
          deliveryStatus: 'sent' as const,
          messageId: data.delivery.messageId,
          reminderCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as FormDelivery;
      }

      console.log('[sendFormToClient] Form sent successfully:', deliveryRecord.id);
      return toFormDelivery(deliveryRecord);
    } catch (err) {
      console.error('[sendFormToClient] Unexpected error:', err);
      return rejectWithValue(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while sending the form.'
      );
    }
  }
);

/**
 * Fetch form deliveries for a store
 * Can filter by clientId, appointmentId, or status
 */
export const fetchFormDeliveries = createAsyncThunk<
  FormDelivery[],
  FetchFormDeliveriesInput
>(
  'forms/delivery/fetchFormDeliveries',
  async ({ storeId, clientId, appointmentId, status }, { rejectWithValue }) => {
    try {
      let query = supabase
        .from('form_deliveries')
        .select('*')
        .eq('store_id', storeId)
        .order('sent_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (appointmentId) {
        query = query.eq('appointment_id', appointmentId);
      }

      if (status) {
        query = query.eq('delivery_status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[fetchFormDeliveries] Query error:', error);
        return rejectWithValue(error.message);
      }

      return (data || []).map(toFormDelivery);
    } catch (err) {
      console.error('[fetchFormDeliveries] Unexpected error:', err);
      return rejectWithValue(
        err instanceof Error
          ? err.message
          : 'Failed to fetch form deliveries.'
      );
    }
  }
);

/**
 * Generate a PDF from a completed form submission
 * Calls the generate-form-pdf Edge Function which:
 * 1. Fetches the form template and submission data
 * 2. Generates a PDF with all responses and signature
 * 3. Uploads the PDF to Supabase Storage
 * 4. Returns the public URL for download
 */
export const generateFormPdf = createAsyncThunk<
  GenerateFormPdfResponse,
  GenerateFormPdfInput
>(
  'forms/delivery/generateFormPdf',
  async ({ formSubmissionId, storeId }, { rejectWithValue }) => {
    try {
      console.log('[generateFormPdf] Generating PDF for submission:', formSubmissionId);

      // Call the generate-form-pdf Edge Function
      const { data, error } = await supabase.functions.invoke('generate-form-pdf', {
        body: {
          formSubmissionId,
          storeId,
        },
      });

      if (error) {
        console.error('[generateFormPdf] Edge Function error:', error);
        return rejectWithValue(
          error.message || 'Failed to generate PDF. Please try again.'
        );
      }

      // Validate response
      if (!data || !data.success) {
        const errorMessage = data?.error || 'PDF generation failed. Please try again.';
        console.error('[generateFormPdf] Generation failed:', errorMessage);
        return rejectWithValue(errorMessage);
      }

      console.log('[generateFormPdf] PDF generated successfully:', data.pdfUrl);
      return data as GenerateFormPdfResponse;
    } catch (err) {
      console.error('[generateFormPdf] Unexpected error:', err);
      return rejectWithValue(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while generating the PDF.'
      );
    }
  }
);

/**
 * Check if a client has completed required forms
 * Used to verify form completion before appointments
 */
export const checkFormCompletion = createAsyncThunk<
  FormCompletionResult[],
  CheckFormCompletionInput
>(
  'forms/delivery/checkFormCompletion',
  async ({ clientId, storeId, formTemplateIds, appointmentId }, { rejectWithValue }) => {
    try {
      // If no specific template IDs provided, get all active templates for the store
      let templateIds = formTemplateIds;
      
      if (!templateIds || templateIds.length === 0) {
        const { data: templates, error: templatesError } = await supabase
          .from('form_templates')
          .select('id, name')
          .eq('store_id', storeId)
          .eq('is_active', true);

        if (templatesError) {
          console.error('[checkFormCompletion] Error fetching templates:', templatesError);
          return rejectWithValue('Failed to fetch form templates.');
        }

        templateIds = (templates || []).map((t) => t.id);
      }

      if (templateIds.length === 0) {
        return [];
      }

      // Fetch all completed submissions for this client and these templates
      let submissionsQuery = supabase
        .from('form_submissions')
        .select('id, form_template_id, completed_at')
        .eq('store_id', storeId)
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .in('form_template_id', templateIds);

      // If appointment-specific, filter by appointment
      if (appointmentId) {
        submissionsQuery = submissionsQuery.eq('appointment_id', appointmentId);
      }

      const { data: submissions, error: submissionsError } = await submissionsQuery;

      if (submissionsError) {
        console.error('[checkFormCompletion] Error fetching submissions:', submissionsError);
        return rejectWithValue('Failed to check form completion status.');
      }

      // Create a map of completed submissions by template ID
      const completionMap = new Map<string, { id: string; completedAt: string }>();
      for (const submission of submissions || []) {
        const existing = completionMap.get(submission.form_template_id);
        // Keep the most recent completion
        if (!existing || submission.completed_at > existing.completedAt) {
          completionMap.set(submission.form_template_id, {
            id: submission.id,
            completedAt: submission.completed_at,
          });
        }
      }

      // Fetch template names
      const { data: templates, error: templateNamesError } = await supabase
        .from('form_templates')
        .select('id, name')
        .in('id', templateIds);

      if (templateNamesError) {
        console.error('[checkFormCompletion] Error fetching template names:', templateNamesError);
        return rejectWithValue('Failed to fetch form template names.');
      }

      const templateNameMap = new Map<string, string>();
      for (const template of templates || []) {
        templateNameMap.set(template.id, template.name);
      }

      // Build result array
      const results: FormCompletionResult[] = templateIds.map((templateId) => {
        const completion = completionMap.get(templateId);
        return {
          formTemplateId: templateId,
          formTemplateName: templateNameMap.get(templateId) || 'Unknown Form',
          completed: !!completion,
          submissionId: completion?.id,
          completedAt: completion?.completedAt,
        };
      });

      return results;
    } catch (err) {
      console.error('[checkFormCompletion] Unexpected error:', err);
      return rejectWithValue(
        err instanceof Error
          ? err.message
          : 'Failed to check form completion status.'
      );
    }
  }
);

/**
 * Resend a form delivery (for expired or failed deliveries)
 * Creates a new delivery record and sends the form again
 */
export const resendFormDelivery = createAsyncThunk<
  FormDelivery,
  { deliveryId: string; storeId: string }
>(
  'forms/delivery/resendFormDelivery',
  async ({ deliveryId, storeId }, { rejectWithValue }) => {
    try {
      // Fetch the original delivery record
      const { data: originalDelivery, error: fetchError } = await supabase
        .from('form_deliveries')
        .select('*')
        .eq('id', deliveryId)
        .eq('store_id', storeId)
        .single();

      if (fetchError || !originalDelivery) {
        console.error('[resendFormDelivery] Original delivery not found:', fetchError);
        return rejectWithValue('Original delivery not found.');
      }

      // Call send-form again with the same parameters
      const { data, error } = await supabase.functions.invoke('send-form', {
        body: {
          clientId: originalDelivery.client_id,
          formTemplateId: originalDelivery.form_template_id,
          deliveryMethod: originalDelivery.delivery_method,
          appointmentId: originalDelivery.appointment_id,
          storeId,
        },
      });

      if (error) {
        console.error('[resendFormDelivery] Edge Function error:', error);
        return rejectWithValue(
          error.message || 'Failed to resend form. Please try again.'
        );
      }

      if (!data || !data.success) {
        const errorMessage = data?.error || 'Form resend failed. Please try again.';
        return rejectWithValue(errorMessage);
      }

      // Fetch the new delivery record
      const { data: newDelivery, error: newFetchError } = await supabase
        .from('form_deliveries')
        .select('*')
        .eq('id', data.delivery?.id)
        .single();

      if (newFetchError || !newDelivery) {
        console.warn('[resendFormDelivery] Could not fetch new delivery record');
        return rejectWithValue('Form resent but could not fetch delivery record.');
      }

      console.log('[resendFormDelivery] Form resent successfully:', newDelivery.id);
      return toFormDelivery(newDelivery);
    } catch (err) {
      console.error('[resendFormDelivery] Unexpected error:', err);
      return rejectWithValue(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while resending the form.'
      );
    }
  }
);
