import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse } from '../model';
import { location, LocationState } from '../model/location.types';
import {
  fetchAllLocation,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../action/location.action';
import { HttpStatusCode } from '../../constants';

const initialState: LocationState = {
  locations: [],
  loading: false,
  error: null,
};

const locationReducer = createSlice({
  name: 'locations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Handle create location
    builder
      .addCase(createLocation.pending, (state) => {
        state.loading = true;
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.locations.push(action.payload.data);
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(createLocation.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to create location';
      });

    // Handle fetch all locations
    builder
      .addCase(fetchAllLocation.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllLocation.fulfilled, (state, action) => {
        if (action.payload?.data?.length > 0) {
          state.locations = action.payload?.data;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllLocation.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to fetch locations';
      });

    // Handle update location
    builder
      .addCase(updateLocation.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateLocation.fulfilled, (state, action: PayloadAction<ApiResponse<location>>) => {
        if (
          action.payload?.success &&
          action.payload?.statusCode === HttpStatusCode.OK &&
          action.payload.data
        ) {
          const index = state.locations.findIndex((loc) => loc.id === action.payload.data.id);
          if (index !== -1) {
            state.locations[index] = action.payload.data;
          }
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateLocation.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to update location';
      });

    // Handle delete location
    builder
      .addCase(deleteLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLocation.fulfilled, (state, action: PayloadAction<ApiResponse<location>>) => {
        state.loading = false;
        if (
          action.payload?.success &&
          action.payload?.statusCode === HttpStatusCode.OK &&
          action.payload.data
        ) {
          state.locations = state.locations.filter((loc) => loc.id !== action.payload.data.id);
        }
        state.error = null;
      })
      .addCase(deleteLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to delete location';
      });
  },
});

export default locationReducer.reducer;
