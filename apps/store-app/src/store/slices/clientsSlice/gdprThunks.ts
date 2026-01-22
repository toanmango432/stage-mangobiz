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
