import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PositionDetailsState, PositionDetails, ApiResponse } from '../model';
import {
  fetchPositionDetails,
  addPositionDetail,
  updatePositionDetail,
  deletePositionDetail,
} from '../action/position-details.action';
import { HttpStatusCode } from '../../constants';

const initialState: PositionDetailsState = {
  positions: [],
  loading: false,
  error: null,
};

const positionDetailsSlice = createSlice({
  name: 'positionDetails',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch Position Details
    builder.addCase(fetchPositionDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchPositionDetails.fulfilled,
      (state, action: PayloadAction<ApiResponse<PositionDetails[]>>) => {
        state.loading = false;
        if (action.payload?.success && action.payload?.statusCode === HttpStatusCode.OK) {
          state.positions = action.payload.data || [];
        }
        state.error = null;
      }
    );
    builder.addCase(fetchPositionDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Failed to fetch position details';
    });

    // Add Position Detail
    builder.addCase(addPositionDetail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      addPositionDetail.fulfilled,
      (state, action: PayloadAction<ApiResponse<PositionDetails>>) => {
        state.loading = false;
        if (
          action.payload?.success &&
          action.payload?.statusCode === HttpStatusCode.CREATED &&
          action.payload.data
        ) {
          state.positions.push(action.payload.data);
        }
        state.error = null;
      }
    );
    builder.addCase(addPositionDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Failed to add position detail';
    });

    // Update Position Detail
    builder.addCase(updatePositionDetail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updatePositionDetail.fulfilled,
      (state, action: PayloadAction<ApiResponse<PositionDetails>>) => {
        state.loading = false;
        if (
          action.payload?.success &&
          action.payload?.statusCode === HttpStatusCode.OK &&
          action.payload.data
        ) {
          const index = state.positions.findIndex((pos) => pos.id === action.payload.data.id);
          if (index !== -1) {
            state.positions[index] = action.payload.data;
          }
        }
        state.error = null;
      }
    );
    builder.addCase(updatePositionDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Failed to update position detail';
    });

    // Delete Position Detail
    builder.addCase(deletePositionDetail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      deletePositionDetail.fulfilled,
      (state, action: PayloadAction<ApiResponse<PositionDetails>>) => {
        state.loading = false;
        if (
          action.payload?.success &&
          action.payload?.statusCode === HttpStatusCode.OK &&
          action.payload.data
        ) {
          state.positions = state.positions.filter((pos) => pos.id !== action.payload.data.id);
        }
        state.error = null;
      }
    );
    builder.addCase(deletePositionDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Failed to delete position detail';
    });
  },
});

export default positionDetailsSlice.reducer;
