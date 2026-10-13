import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiResponse } from '../model';
import axios from 'axios';
import {
  createLocations,
  fetchAllLocations,
  updateLocations,
  deleteLocations,
} from '../services/location';
import { createLocationPayload, location, updateLocationPayload } from '../model/location.types';

export const createLocation = createAsyncThunk(
  'location/createLocation',
  async (locationData: createLocationPayload, { rejectWithValue }) => {
    try {
      const { data: response } = await createLocations(locationData);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Locations has not created',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);

export const fetchAllLocation = createAsyncThunk(
  'locations/fetchAllLocation',
  async (_, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchAllLocations();
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Locations has not created',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);

export const updateLocation = createAsyncThunk<
  ApiResponse<location>,
  { id: number; payload: updateLocationPayload },
  {
    rejectValue: string;
  }
>('locations/updateLocation', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data: response } = await updateLocations(id, payload);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to update the location details'
    );
  }
});

export const deleteLocation = createAsyncThunk<
  ApiResponse<location>,
  number,
  {
    rejectValue: string;
  }
>('locations/deleteLocation', async (id, { rejectWithValue }) => {
  try {
    const { data: response } = await deleteLocations(id);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to Delete the location details'
    );
  }
});
