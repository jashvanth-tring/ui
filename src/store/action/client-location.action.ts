import { createAsyncThunk } from '@reduxjs/toolkit';
import { clientLocation, createClientLocationPayload } from '../model/client-location.types.ts';
import axios from 'axios';
import {
  createClientLocation,
  fetchClientLocation,
  deleteClientLocation,
} from '../services/client-location.ts';
import { ApiResponse } from '../model/index.ts';

export const createClientLocations = createAsyncThunk(
  'client-location/createClientLocations',
  async (clientLocationData: createClientLocationPayload, { rejectWithValue }) => {
    try {
      const { data: response } = await createClientLocation(clientLocationData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create the client locations'
      );
    }
  }
);

export const fetchClientLocations = createAsyncThunk(
  'client-locations/fetchClientLocations',
  async (_, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchClientLocation();
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Client Locations has not created',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);

export const deleteClientLocations = createAsyncThunk<
  ApiResponse<clientLocation>,
  number,
  {
    rejectValue: string;
  }
>('client-locations/deleteClientLocations', async (id, { rejectWithValue }) => {
  try {
    const { data: response } = await deleteClientLocation(id);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to Delete the Clients location'
    );
  }
});
