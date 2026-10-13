import { createAsyncThunk } from '@reduxjs/toolkit';
import { client, CreateClient, updateClientsPayload } from '../model/client.types';
import { ApiResponse, AxiosResponse } from '../model';
import axios from 'axios';
import {
  createClientProfile,
  FetchAllClient,
  updateClient,
  deleteClient,
} from '../services/client';
import { uploadClient } from '../services/client';

export const createClient = createAsyncThunk(
  'client-Profile/createClient',
  async (clientData: CreateClient, { rejectWithValue }) => {
    try {
      const { data: response }: AxiosResponse<client> = await createClientProfile(clientData);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Client has not created',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);
export const parseClient = createAsyncThunk(
  "client/parseClient",
  async (file: File, { rejectWithValue }) => {
    try {
      const { data: response } = await uploadClient(file);

      return response.data; // ✅ SAME AS parseJD

    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to parse client"
      );
    }
  }
);
export const FetchAllClients = createAsyncThunk(
  'client-Profiles/FetchAllClients',
  async (_, { rejectWithValue }) => {
    try {
      const { data: response } = await FetchAllClient();
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Failed to fetch clients',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);

export const updateClients = createAsyncThunk<
  ApiResponse<client>,
  { id: number; payload: updateClientsPayload },
  {
    rejectValue: string;
  }
>('client-Profile/updateClients', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data: response } = await updateClient(id, payload);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to update the client details'
    );
  }
});
export const deleteClients = createAsyncThunk<
  ApiResponse<client>,
  number,
  {
    rejectValue: string;
  }
>('client-Profile/deleteClients', async (id, { rejectWithValue }) => {
  try {
    const { data: response } = await deleteClient(id);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to Delete the client details'
    );
  }
});

export const FetchAllClientsWithStatus = createAsyncThunk(
  'client-Profiles/FetchAllClientsWithStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { data: response } = await FetchAllClient();
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Failed to fetch clients',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);
