import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { candidateProfile, CandidateState } from '../model/candidate.types';
import {
  FetchAllCandidate,
  UpdateCandidateInd,
  createCandidate,
  archiveCandidateAction,
  getCandidateById,
  fetchCandidatePipeline,
  uploadResume,
  fetchCandidateStatusHistory,
  fetchCandidateProfileHistory,
} from '../action/candidate.action';
import { HttpStatusCode } from '../../constants';
import { ApiResponse } from '../model';

const initialState: CandidateState = {
  candidates:                 [],
  loading:                    false,
  error:                      null,
  currentCandidate:           null,
  pipeline:                   [],
  pipelineLoading:            false,
  parsedResume:               null,
  parseLoading:               false,
  statusHistory:              [],
  statusHistoryNextCursor:    null,
  statusHistoryHasMore:       false,
  statusHistoryLoading:       false,
  profileHistory:             [],
  profileHistoryNextCursor:   null,
  profileHistoryHasMore:      false,
  profileHistoryLoading:      false,
};

const candidateReducer = createSlice({
  name: 'candidates-profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchAllCandidate.pending, (state) => { state.loading = true; })
      .addCase(FetchAllCandidate.fulfilled, (state, action) => {
        if (action.payload?.data && action.payload.data.length > 0) state.candidates = action.payload?.data;
        state.loading = false; state.error = null;
      })
      .addCase(FetchAllCandidate.rejected, (state) => { state.loading = false; state.error = 'Failed to fetch candidates'; });

    builder
      .addCase(createCandidate.pending, (state) => { state.loading = true; })
      .addCase(createCandidate.fulfilled, (state, action) => {
        if (action.payload?.data) state.candidates.push(action.payload?.data);
        state.loading = false;
      })
      .addCase(createCandidate.rejected, (state) => { state.loading = false; state.error = 'Failed to create candidate'; });

    builder
      .addCase(UpdateCandidateInd.pending, (state) => { state.loading = true; })
      .addCase(UpdateCandidateInd.fulfilled, (state, action: PayloadAction<ApiResponse<candidateProfile>>) => {
        if (action.payload?.success && action.payload?.statusCode === HttpStatusCode.OK && action.payload.data) {
          const index = state.candidates.findIndex((c) => c.id === action.payload.data.id);
          if (index !== -1) state.candidates[index] = action.payload.data;
        }
        state.loading = false; state.error = null;
      })
      .addCase(UpdateCandidateInd.rejected, (state) => { state.loading = false; state.error = 'Failed to update candidate'; });

    builder
      .addCase(archiveCandidateAction.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(archiveCandidateAction.fulfilled, (state, action) => {
        state.loading = false;
        if (
          action.payload?.success &&
          action.payload?.statusCode === HttpStatusCode.OK
        ) {
          state.candidates = state.candidates.filter(
            (c) => c.id !== action.meta.arg.id
          );
        }

        state.error = null;
      })
      .addCase(archiveCandidateAction.rejected, (state, action) => {
        state.loading = false; state.error = action.payload ?? 'Failed to archive candidate';
      });

    builder
      .addCase(getCandidateById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getCandidateById.fulfilled, (state, action) => { state.loading = false; state.currentCandidate = action.payload?.data ?? null; })
      .addCase(getCandidateById.rejected, (state, action) => { state.loading = false; state.error = action.payload ?? 'Failed to fetch candidate'; });

    builder
      .addCase(fetchCandidatePipeline.pending, (state) => { state.pipelineLoading = true; state.error = null; })
      .addCase(fetchCandidatePipeline.fulfilled, (state, action) => { state.pipelineLoading = false; state.pipeline = action.payload?.data ?? []; })
      .addCase(fetchCandidatePipeline.rejected, (state, action) => { state.pipelineLoading = false; state.error = action.payload ?? 'Failed to fetch pipeline'; });

    builder
      .addCase(uploadResume.pending, (state) => { state.parseLoading = true; state.error = null; })
      .addCase(uploadResume.fulfilled, (state, action) => { state.parseLoading = false; state.parsedResume = action.payload?.data ?? null; })
      .addCase(uploadResume.rejected, (state, action) => { state.parseLoading = false; state.error = action.payload ?? 'Failed to upload resume'; });

    // ─── Status History ───────────────────────────────────────────────────────
    builder
      .addCase(fetchCandidateStatusHistory.pending, (state, action) => {
        state.statusHistoryLoading = true;
        // Reset list on fresh load (no cursor), preserve on pagination
        if (!action.meta.arg.cursor) {
          state.statusHistory            = [];
          state.statusHistoryNextCursor  = null;
          state.statusHistoryHasMore     = false;
        }
      })
      .addCase(fetchCandidateStatusHistory.fulfilled, (state, action) => {
        state.statusHistoryLoading    = false;
        const incoming                = action.payload?.data ?? [];
        // Append for infinite scroll, replace for fresh load
        state.statusHistory           = action.meta.arg.cursor
          ? [...state.statusHistory, ...incoming]
          : incoming;
        state.statusHistoryNextCursor = action.payload?.nextCursor ?? null;
        state.statusHistoryHasMore    = action.payload?.hasMore ?? false;
      })
      .addCase(fetchCandidateStatusHistory.rejected, (state) => { state.statusHistoryLoading = false; });

    // ─── Profile History ──────────────────────────────────────────────────────
    builder
      .addCase(fetchCandidateProfileHistory.pending, (state, action) => {
        state.profileHistoryLoading = true;
        if (!action.meta.arg.cursor) {
          state.profileHistory            = [];
          state.profileHistoryNextCursor  = null;
          state.profileHistoryHasMore     = false;
        }
      })
      .addCase(fetchCandidateProfileHistory.fulfilled, (state, action) => {
        state.profileHistoryLoading    = false;
        const incoming                 = action.payload?.data ?? [];
        state.profileHistory           = action.meta.arg.cursor
          ? [...state.profileHistory, ...incoming]
          : incoming;
        state.profileHistoryNextCursor = action.payload?.nextCursor ?? null;
        state.profileHistoryHasMore    = action.payload?.hasMore ?? false;
      })
      .addCase(fetchCandidateProfileHistory.rejected, (state) => { state.profileHistoryLoading = false; });
  },
});

export default candidateReducer.reducer;
