import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Round, RoundState } from '../model/round.types';
import { createRounds, fetchAllRounds, updateRounds, deleteRounds, fetchFeedbackTracker } from '../action/round.action';
import { ApiResponse } from '../model';
import { HttpStatusCode } from '../../constants';
import { FeedbackRow } from '../model/feedbackTracker.types';


const initialState: RoundState = {
  rounds: [],
  loading: false,
  error: null,
  feedbackRows:    [] as FeedbackRow[],
  feedbackLoading: false,
  feedbackError:   null as string | null,
};

const roundReducer = createSlice({
  name: 'rounds',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllRounds.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllRounds.fulfilled, (state, action) => {
        if (action.payload?.data && action.payload?.data?.length > 0) {
          state.rounds = action.payload?.data;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllRounds.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to fetch rounds';
      });
    builder
      .addCase(createRounds.pending, (state) => {
        state.loading = true;
      })
      .addCase(createRounds.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.rounds.push(action.payload?.data);
        }
      })
      .addCase(createRounds.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to fetch rounds';
      });

    // // Handle update location
    builder
      .addCase(updateRounds.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateRounds.fulfilled, (state, action: PayloadAction<ApiResponse<Round>>) => {
        if (
          action.payload?.success &&
          action.payload?.statusCode === HttpStatusCode.OK &&
          action.payload.data
        ) {
          const index = state.rounds.findIndex((loc) => loc.id === action.payload.data.id);
          if (index !== -1) {
            state.rounds[index] = action.payload.data;
          }
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateRounds.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to update rounds';
      });

    // Handle delete location
    builder
      .addCase(deleteRounds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRounds.fulfilled, (state, action: PayloadAction<ApiResponse<Round>>) => {
        state.loading = false;
        if (
          action.payload?.success &&
          action.payload?.statusCode === HttpStatusCode.OK &&
          action.payload.data
        ) {
          state.rounds = state.rounds.filter((client) => client.id !== action.payload.data.id);
        }
        state.error = null;
      })
      .addCase(deleteRounds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to delete client';
      });

      builder
      .addCase(fetchFeedbackTracker.pending, (state) => {
        state.feedbackLoading = true;
        state.feedbackError   = null;
      })
      .addCase(fetchFeedbackTracker.fulfilled, (state, action) => {
        state.feedbackLoading = false;
        state.feedbackRows    = action.payload ?? [];
      })
      .addCase(fetchFeedbackTracker.rejected, (state, action) => {
        state.feedbackLoading = false;
        state.feedbackError   = (action.payload as { message: string })?.message
                                ?? 'Failed to fetch feedback tracker';
      });
  },
});

export default roundReducer.reducer;
