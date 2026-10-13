import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse } from '../model';
import { clientLocation, ClientLocationState } from '../model/client-location.types';
import {
  fetchClientLocations,
  createClientLocations,
  deleteClientLocations,
} from '../action/client-location.action';
import { HttpStatusCode } from '../../constants';

const initialState: ClientLocationState = {
  clientLocations: [],
  loading: true,
  error: null,
};

const clientLocationReducer = createSlice({
  name: 'clients-location',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    //fetch request handled
    builder
      .addCase(fetchClientLocations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClientLocations.fulfilled, (state, action) => {
        if (action.payload?.data?.length > 0) {
          state.clientLocations = action.payload?.data;
        }

        state.loading = false;
        state.error = null;
      })
      .addCase(fetchClientLocations.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to fetch client locations';
      });

    //create request handled
    builder
      .addCase(createClientLocations.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        createClientLocations.fulfilled,
        (state, action: PayloadAction<ApiResponse<clientLocation>>) => {
          if (action.payload?.data) {
            state.clientLocations.push(action.payload.data);
          }
          state.loading = false;
          state.error = null;
        }
      )
      .addCase(createClientLocations.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to create client locations';
      });

    // Handle delete location
    builder
      .addCase(deleteClientLocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteClientLocations.fulfilled,
        (state, action: PayloadAction<ApiResponse<clientLocation>>) => {
          state.loading = false;
          if (
            action.payload?.success &&
            action.payload?.statusCode === HttpStatusCode.OK &&
            action.payload.data
          ) {
            state.clientLocations = state.clientLocations.filter(
              (clientLocation: clientLocation) =>
                clientLocation.id !== (action.payload.data as clientLocation).id
            );
          }
          state.error = null;
        }
      )
      .addCase(deleteClientLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to delete client location';
      });
  },
});

export default clientLocationReducer.reducer;
