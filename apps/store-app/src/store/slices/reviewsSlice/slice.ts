import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../../index';
import type { ReviewSettings } from '../../../types/review';
import type { ReviewRequest } from '../../../types/client';
import { createDefaultReviewSettings } from '../../../types/review';
import {
  fetchReviewSettings,
  updateReviewSettings,
  sendReviewRequest,
  fetchReviewRequests,
} from './thunks';

export interface ReviewsState {
  // Settings
  settings: ReviewSettings;
  settingsLoading: boolean;
  settingsError: string | null;

  // Review Requests
  requests: ReviewRequest[];
  requestsLoading: boolean;
  requestsError: string | null;

  // Send request operation
  sendingRequest: boolean;
  sendRequestError: string | null;
}

const initialState: ReviewsState = {
  settings: createDefaultReviewSettings(),
  settingsLoading: false,
  settingsError: null,

  requests: [],
  requestsLoading: false,
  requestsError: null,

  sendingRequest: false,
  sendRequestError: null,
};

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.settingsError = null;
      state.requestsError = null;
      state.sendRequestError = null;
    },
  },
  extraReducers: (builder) => {
    // ==================== SETTINGS ====================
    builder
      .addCase(fetchReviewSettings.pending, (state) => {
        state.settingsLoading = true;
        state.settingsError = null;
      })
      .addCase(fetchReviewSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = action.payload || createDefaultReviewSettings();
      })
      .addCase(fetchReviewSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.settingsError = action.payload as string;
      });

    builder
      .addCase(updateReviewSettings.pending, (state) => {
        state.settingsLoading = true;
        state.settingsError = null;
      })
      .addCase(updateReviewSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = action.payload;
      })
      .addCase(updateReviewSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.settingsError = action.payload as string;
      });

    // ==================== SEND REQUEST ====================
    builder
      .addCase(sendReviewRequest.pending, (state) => {
        state.sendingRequest = true;
        state.sendRequestError = null;
      })
      .addCase(sendReviewRequest.fulfilled, (state) => {
        state.sendingRequest = false;
      })
      .addCase(sendReviewRequest.rejected, (state, action) => {
        state.sendingRequest = false;
        state.sendRequestError = action.payload as string;
      });

    // ==================== FETCH REQUESTS ====================
    builder
      .addCase(fetchReviewRequests.pending, (state) => {
        state.requestsLoading = true;
        state.requestsError = null;
      })
      .addCase(fetchReviewRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.requests = action.payload;
      })
      .addCase(fetchReviewRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.requestsError = action.payload as string;
      });
  },
});

// ==================== ACTIONS ====================
export const { clearErrors } = reviewsSlice.actions;

// ==================== SELECTORS ====================
export const selectReviewSettings = (state: RootState) => state.reviews.settings;
export const selectSettingsLoading = (state: RootState) => state.reviews.settingsLoading;
export const selectSettingsError = (state: RootState) => state.reviews.settingsError;

export const selectReviewRequests = (state: RootState) => state.reviews.requests;
export const selectRequestsLoading = (state: RootState) => state.reviews.requestsLoading;
export const selectRequestsError = (state: RootState) => state.reviews.requestsError;

export const selectSendingRequest = (state: RootState) => state.reviews.sendingRequest;
export const selectSendRequestError = (state: RootState) => state.reviews.sendRequestError;

// ==================== REDUCER ====================
export default reviewsSlice.reducer;
