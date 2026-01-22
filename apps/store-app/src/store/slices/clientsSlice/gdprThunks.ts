/**
 * GDPR Thunks
 * Redux async thunks for GDPR/CCPA compliance operations
 * Phase 2: Data export, deletion, and consent management
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../../services/supabase/client';
import type {
  ClientDataRequest,
  DataRetentionLog,
  DataRequestType,
  DataRequestStatus,
  DataRetentionAction,
} from '../../../types';

// ==================== INPUT/OUTPUT TYPES ====================

/** Input for creating a data request */
export interface CreateDataRequestInput {
  clientId: string;
  storeId: string;
  requestType: DataRequestType;
  notes?: string;
}

/** Input for updating a data request status */
export interface UpdateDataRequestStatusInput {
  requestId: string;
  status: DataRequestStatus;
  processedBy?: string;
  exportUrl?: string;
  notes?: string;
}

/** Input for logging a data retention action */
export interface LogDataRetentionInput {
  clientId?: string;
  storeId: string;
  action: DataRetentionAction;
  fieldsAffected?: string[];
  performedBy?: string;
  performedByName?: string;
}

/** Input for fetching data requests */
export interface FetchDataRequestsInput {
  storeId: string;
  status?: DataRequestStatus;
  clientId?: string;
}

/** Input for exporting client data */
export interface ExportClientDataInput {
  clientId: string;
  storeId: string;
  performedBy?: string;
  performedByName?: string;
  requestId?: string;
}

/** Response from the export-client-data Edge Function */
export interface ExportClientDataResponse {
  success: boolean;
  error?: string;
  data: {
    exportedAt: string;
    exportVersion: string;
    client: Record<string, unknown>;
    appointments: Record<string, unknown>[];
    tickets: Record<string, unknown>[];
    transactions: Record<string, unknown>[];
  };
  downloadUrl: string;
  summary: {
    appointmentCount: number;
    ticketCount: number;
    transactionCount: number;
  };
  timestamp: string;
}

/** Input for processing data deletion */
export interface ProcessDataDeletionInput {
  clientId: string;
  storeId: string;
  performedBy: string;
  performedByName?: string;
  requestId?: string;
  /** Required confirmation flag - must be true to proceed with irreversible deletion */
  confirmed: boolean;
}

/** Response from the process-data-deletion Edge Function */
export interface ProcessDataDeletionResponse {
  success: boolean;
  message: string;
  anonymizedFields: string[];
  clearedFields: string[];
  preservedData: string[];
  timestamp: string;
}

// ==================== THUNKS ====================

/**
 * Create a data request (export/delete/access)
 * Creates a new entry in client_data_requests table
 */
export const createDataRequest = createAsyncThunk<
  ClientDataRequest,
  CreateDataRequestInput
>(
  'clients/gdpr/createDataRequest',
  async ({ clientId, storeId, requestType, notes }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('client_data_requests')
        .insert({
          client_id: clientId,
          store_id: storeId,
          request_type: requestType,
          status: 'pending',
          requested_at: new Date().toISOString(),
          notes,
        })
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      // Convert from snake_case to camelCase
      return {
        id: data.id,
        clientId: data.client_id,
        storeId: data.store_id,
        requestType: data.request_type,
        status: data.status,
        requestedAt: data.requested_at,
        processedAt: data.processed_at,
        processedBy: data.processed_by,
        notes: data.notes,
        exportUrl: data.export_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as ClientDataRequest;
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to create data request'
      );
    }
  }
);

/**
 * Fetch data requests for a store
 * Optionally filter by status or clientId
 */
export const fetchDataRequests = createAsyncThunk<
  ClientDataRequest[],
  FetchDataRequestsInput
>(
  'clients/gdpr/fetchDataRequests',
  async ({ storeId, status, clientId }, { rejectWithValue }) => {
    try {
      let query = supabase
        .from('client_data_requests')
        .select('*')
        .eq('store_id', storeId)
        .order('requested_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) {
        return rejectWithValue(error.message);
      }

      // Convert from snake_case to camelCase
      return (data || []).map((row) => ({
        id: row.id,
        clientId: row.client_id,
        storeId: row.store_id,
        requestType: row.request_type,
        status: row.status,
        requestedAt: row.requested_at,
        processedAt: row.processed_at,
        processedBy: row.processed_by,
        notes: row.notes,
        exportUrl: row.export_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) as ClientDataRequest[];
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to fetch data requests'
      );
    }
  }
);

/**
 * Update data request status
 * Used when processing or completing a request
 */
export const updateDataRequestStatus = createAsyncThunk<
  ClientDataRequest,
  UpdateDataRequestStatusInput
>(
  'clients/gdpr/updateDataRequestStatus',
  async ({ requestId, status, processedBy, exportUrl, notes }, { rejectWithValue }) => {
    try {
      const updateData: Record<string, unknown> = {
        status,
      };

      // Set processed_at when moving to processing or completed
      if (status === 'processing' || status === 'completed') {
        updateData.processed_at = new Date().toISOString();
      }

      if (processedBy) {
        updateData.processed_by = processedBy;
      }

      if (exportUrl) {
        updateData.export_url = exportUrl;
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('client_data_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      // Convert from snake_case to camelCase
      return {
        id: data.id,
        clientId: data.client_id,
        storeId: data.store_id,
        requestType: data.request_type,
        status: data.status,
        requestedAt: data.requested_at,
        processedAt: data.processed_at,
        processedBy: data.processed_by,
        notes: data.notes,
        exportUrl: data.export_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as ClientDataRequest;
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to update data request status'
      );
    }
  }
);

/**
 * Log a data retention action
 * Creates an immutable audit log entry for GDPR compliance
 */
export const logDataRetention = createAsyncThunk<
  DataRetentionLog,
  LogDataRetentionInput
>(
  'clients/gdpr/logDataRetention',
  async (
    { clientId, storeId, action, fieldsAffected, performedBy, performedByName },
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await supabase
        .from('data_retention_logs')
        .insert({
          client_id: clientId,
          store_id: storeId,
          action,
          fields_affected: fieldsAffected,
          performed_by: performedBy,
          performed_by_name: performedByName,
          performed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      // Convert from snake_case to camelCase
      return {
        id: data.id,
        clientId: data.client_id,
        storeId: data.store_id,
        action: data.action,
        fieldsAffected: data.fields_affected,
        performedBy: data.performed_by,
        performedByName: data.performed_by_name,
        performedAt: data.performed_at,
        createdAt: data.created_at,
      } as DataRetentionLog;
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to log data retention action'
      );
    }
  }
);

/**
 * Fetch data retention logs for audit purposes
 * Used for GDPR compliance auditing
 */
export const fetchDataRetentionLogs = createAsyncThunk<
  DataRetentionLog[],
  { storeId: string; clientId?: string; limit?: number }
>(
  'clients/gdpr/fetchDataRetentionLogs',
  async ({ storeId, clientId, limit = 100 }, { rejectWithValue }) => {
    try {
      let query = supabase
        .from('data_retention_logs')
        .select('*')
        .eq('store_id', storeId)
        .order('performed_at', { ascending: false })
        .limit(limit);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) {
        return rejectWithValue(error.message);
      }

      // Convert from snake_case to camelCase
      return (data || []).map((row) => ({
        id: row.id,
        clientId: row.client_id,
        storeId: row.store_id,
        action: row.action,
        fieldsAffected: row.fields_affected,
        performedBy: row.performed_by,
        performedByName: row.performed_by_name,
        performedAt: row.performed_at,
        createdAt: row.created_at,
      })) as DataRetentionLog[];
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to fetch data retention logs'
      );
    }
  }
);

/**
 * Export client data for GDPR/CCPA data portability requests
 * Calls the export-client-data Edge Function to generate a JSON export
 * Returns a download URL for the exported data
 */
export const exportClientData = createAsyncThunk<
  ExportClientDataResponse,
  ExportClientDataInput
>(
  'clients/gdpr/exportClientData',
  async (
    { clientId, storeId, performedBy, performedByName, requestId },
    { rejectWithValue }
  ) => {
    try {
      // Call the export-client-data Edge Function
      const { data, error } = await supabase.functions.invoke('export-client-data', {
        body: {
          clientId,
          storeId,
          performedBy,
          performedByName,
          requestId,
        },
      });

      if (error) {
        console.error('[exportClientData] Edge Function error:', error);
        return rejectWithValue(
          error.message || 'Failed to export client data. Please try again.'
        );
      }

      // Validate response structure
      if (!data || !data.success) {
        const errorMessage = data?.error || 'Export failed. No data returned from server.';
        console.error('[exportClientData] Export failed:', errorMessage);
        return rejectWithValue(errorMessage);
      }

      // Validate download URL is present
      if (!data.downloadUrl) {
        console.error('[exportClientData] No download URL in response');
        return rejectWithValue('Export completed but no download link was generated.');
      }

      console.log('[exportClientData] Export successful:', {
        clientId,
        appointmentCount: data.summary?.appointmentCount,
        ticketCount: data.summary?.ticketCount,
        transactionCount: data.summary?.transactionCount,
      });

      return data as ExportClientDataResponse;
    } catch (err) {
      console.error('[exportClientData] Unexpected error:', err);
      return rejectWithValue(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while exporting client data. Please try again.'
      );
    }
  }
);

/**
 * Process data deletion for GDPR/CCPA right to be forgotten requests
 * Calls the process-data-deletion Edge Function to anonymize client PII
 *
 * IMPORTANT: This action is IRREVERSIBLE. The confirmed flag must be true.
 *
 * Returns the clientId on success so the reducer can remove from state.
 */
export const processDataDeletion = createAsyncThunk<
  { clientId: string; response: ProcessDataDeletionResponse },
  ProcessDataDeletionInput
>(
  'clients/gdpr/processDataDeletion',
  async (
    { clientId, storeId, performedBy, performedByName, requestId, confirmed },
    { rejectWithValue }
  ) => {
    // Safety check: require explicit confirmation
    if (!confirmed) {
      return rejectWithValue(
        'Data deletion requires explicit confirmation. Please confirm this irreversible action.'
      );
    }

    // Validate required fields
    if (!performedBy) {
      return rejectWithValue(
        'Staff member performing the deletion must be identified for audit purposes.'
      );
    }

    try {
      console.log('[processDataDeletion] Starting deletion for client:', clientId);

      // Call the process-data-deletion Edge Function
      const { data, error } = await supabase.functions.invoke('process-data-deletion', {
        body: {
          clientId,
          storeId,
          performedBy,
          performedByName,
          requestId,
        },
      });

      if (error) {
        console.error('[processDataDeletion] Edge Function error:', error);
        return rejectWithValue(
          error.message || 'Failed to process data deletion. Please try again.'
        );
      }

      // Validate response structure
      if (!data || !data.success) {
        const errorMessage = data?.error || 'Data deletion failed. Please try again.';
        console.error('[processDataDeletion] Deletion failed:', errorMessage);
        return rejectWithValue(errorMessage);
      }

      console.log('[processDataDeletion] Deletion successful:', {
        clientId,
        anonymizedFields: data.anonymizedFields?.length,
        clearedFields: data.clearedFields?.length,
        preservedData: data.preservedData?.length,
      });

      // Return clientId so the reducer can remove from state
      return {
        clientId,
        response: data as ProcessDataDeletionResponse,
      };
    } catch (err) {
      console.error('[processDataDeletion] Unexpected error:', err);
      return rejectWithValue(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while processing data deletion. Please try again.'
      );
    }
  }
);
