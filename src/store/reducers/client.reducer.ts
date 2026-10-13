import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { client, ClientState } from '../model/client.types';
import {
  createClient,
  FetchAllClients,
  updateClients,
  deleteClients,
} from '../action/client.action';
import { ApiResponse } from '../model';
import { HttpStatusCode } from '../../constants';

const initialState: ClientState = {
  clients: [],
  loading: false,
  error: null,
};

const clientsReducer = createSlice({
  name: 'clients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchAllClients.pending, (state) => {
        state.loading = true;
      })
      .addCase(FetchAllClients.fulfilled, (state, action) => {
        if (action.payload?.data?.length > 0) {
          state.clients = action.payload?.data;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(FetchAllClients.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to fetch clients';
      });
    builder
      .addCase(createClient.pending, (state) => {
        state.loading = true;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.clients.push(action.payload?.data);
        }
      })
      .addCase(createClient.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to fetch clients';
      });

    // // Handle update location
    builder
      .addCase(updateClients.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateClients.fulfilled, (state, action: PayloadAction<ApiResponse<client>>) => {
        if (
          action.payload?.success &&
          action.payload?.statusCode === HttpStatusCode.OK &&
          action.payload.data
        ) {
          const index = state.clients.findIndex((loc) => loc.id === action.payload.data.id);
          if (index !== -1) {
            state.clients[index] = action.payload.data;
          }
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateClients.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to update clients';
      });

    // Handle delete location
    builder
      .addCase(deleteClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteClients.fulfilled, (state, action: PayloadAction<ApiResponse<client>>) => {
        state.loading = false;
        if (
          action.payload?.success &&
          action.payload?.statusCode === HttpStatusCode.OK &&
          action.payload.data
        ) {
          state.clients = state.clients.filter((client) => client.id !== action.payload.data.id);
        }
        state.error = null;
      })
      .addCase(deleteClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to delete client';
      });
  },
});

export default clientsReducer.reducer;
