import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../../services/supabase/client';
import type { ReviewSettings, SendReviewRequestInput } from '../../../types/review';
import type { ReviewRequest } from '../../../types/client';

// ==================== REVIEW SETTINGS ====================

/**
 * Fetch review settings for the current store.
 */
export const fetchReviewSettings = createAsyncThunk(
  'reviews/fetchSettings',
  async (storeId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('review_settings')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found - return default settings
          return null;
        }
        throw error;
      }

      // Map database fields to ReviewSettings type
      const settings: ReviewSettings = {
        autoRequestReviews: data.enabled,
        requestDelayHours: data.delay_hours,
        sendReminders: data.reminder_days !== null,
        reminderIntervalDays: data.reminder_days || 3,
        maxReminders: 2, // Not in DB, using default
        requireApproval: false, // Not in DB, using default
        npsEnabled: false, // Not in DB, using default
        npsSurveyFrequency: 90, // Not in DB, using default
        syncGoogle: false, // Not in DB, using default
        syncYelp: false, // Not in DB, using default
        syncFacebook: false, // Not in DB, using default
        lowRatingAlertThreshold: 3, // Not in DB, using default
      };

      return settings;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch review settings'
      );
    }
  }
);

/**
 * Update review settings for the current store.
 */
export const updateReviewSettings = createAsyncThunk(
  'reviews/updateSettings',
  async (
    { storeId, settings }: { storeId: string; settings: Partial<ReviewSettings> },
    { rejectWithValue }
  ) => {
    try {
      // Map ReviewSettings to database fields
      const dbSettings = {
        store_id: storeId,
        enabled: settings.autoRequestReviews ?? true,
        delay_hours: settings.requestDelayHours ?? 24,
        reminder_days: settings.sendReminders ? settings.reminderIntervalDays ?? 3 : null,
        platforms: {}, // Empty for now, will be populated by ReviewAutomationSettings component
      };

      const { data, error } = await supabase
        .from('review_settings')
        .upsert(dbSettings, { onConflict: 'store_id' })
        .select()
        .single();

      if (error) throw error;

      // Map back to ReviewSettings type
      const updatedSettings: ReviewSettings = {
        autoRequestReviews: data.enabled,
        requestDelayHours: data.delay_hours,
        sendReminders: data.reminder_days !== null,
        reminderIntervalDays: data.reminder_days || 3,
        maxReminders: 2,
        requireApproval: false,
        npsEnabled: false,
        npsSurveyFrequency: 90,
        syncGoogle: false,
        syncYelp: false,
        syncFacebook: false,
        lowRatingAlertThreshold: 3,
      };

      return updatedSettings;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update review settings'
      );
    }
  }
);

// ==================== REVIEW REQUESTS ====================

/**
 * Send a manual review request to a client.
 */
export const sendReviewRequest = createAsyncThunk(
  'reviews/sendRequest',
  async (input: SendReviewRequestInput, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-review-request', {
        body: {
          client_id: input.clientId,
          appointment_id: input.appointmentId,
          staff_id: input.staffId,
          sent_via: input.sendVia,
        },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to send review request'
      );
    }
  }
);

/**
 * Fetch all review requests for a store.
 */
export const fetchReviewRequests = createAsyncThunk(
  'reviews/fetchRequests',
  async (storeId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('review_requests')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map database fields to ReviewRequest type
      const requests: ReviewRequest[] = (data || []).map((row) => ({
        id: row.id,
        storeId: row.store_id,
        clientId: row.client_id,
        clientName: '', // Not in DB, will be populated by UI if needed
        appointmentId: row.appointment_id || undefined,
        staffId: row.staff_id || undefined,
        status: row.status as 'pending' | 'sent' | 'opened' | 'completed' | 'expired',
        sentVia: (row.sent_via || 'email') as 'email' | 'sms' | 'both',
        sentAt: row.sent_at || undefined,
        reminderCount: row.reminder_sent_at ? 1 : 0,
        lastReminderAt: row.reminder_sent_at || undefined,
        expiresAt: row.created_at, // Placeholder - should be calculated based on settings
        createdAt: row.created_at,
        syncStatus: row.sync_status as 'pending' | 'syncing' | 'synced' | 'error',
      }));

      return requests;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch review requests'
      );
    }
  }
);
