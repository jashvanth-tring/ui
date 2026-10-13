import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  ApiResponse,
  AxiosResponse,
  StatusData,
  StatusPayload,
  StatusUpdatePayload,
} from '../model';
import {
  createNewStatus,
  deleteExistingStatus,
  getStatus,
  updateExistingStatus,
} from '../services';
import { HttpStatusCode } from '../../constants';

function rejectMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { message?: unknown } | undefined;
    const m = body?.message;
    if (typeof m === 'string' && m.trim()) return m.trim();
    if (Array.isArray(m) && m.length > 0 && typeof m[0] === 'string') return m[0].trim();
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const fetchStatus = createAsyncThunk<
  ApiResponse<StatusData[]>,
  void,
  {
    rejectValue: string;
  }
>('status/fetchStatus', async (_, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<StatusData[]> = await getStatus();

    if (response?.success && response?.statusCode === HttpStatusCode.OK) {
      return response;
    }
    return rejectWithValue(
      response.message && typeof response.message === 'string'
        ? response.message
        : 'Failed to fetch status'
    );
  } catch (error) {
    return rejectWithValue(rejectMessage(error, 'Failed to fetch status'));
  }
});

export const createStatus = createAsyncThunk<
  ApiResponse<StatusData>,
  StatusPayload,
  {
    rejectValue: string;
  }
>('status/createStatus', async (newStatus, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<StatusData> = await createNewStatus(newStatus);
    if (!response?.success) {
      const msg =
        typeof response?.message === 'string' && response.message.trim()
          ? response.message.trim()
          : 'Failed to create status';
      return rejectWithValue(msg);
    }
    return response;
  } catch (error) {
    return rejectWithValue(rejectMessage(error, 'Failed to create status'));
  }
});

export const updateStatus = createAsyncThunk<
  ApiResponse<StatusData>,
  { statusId: number; payload: StatusUpdatePayload },
  {
    rejectValue: string;
  }
>('status/updateStatus', async ({ statusId, payload }, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<StatusData> = await updateExistingStatus(
      statusId,
      payload
    );
    if (!response?.success) {
      const msg =
        typeof response?.message === 'string' && response.message.trim()
          ? response.message.trim()
          : 'Failed to update status';
      return rejectWithValue(msg);
    }
    return response;
  } catch (error) {
    return rejectWithValue(rejectMessage(error, 'Failed to update status'));
  }
});

export const deleteStatus = createAsyncThunk<
  ApiResponse<StatusData>,
  number,
  {
    rejectValue: string;
  }
>('status/deleteStatus', async (statusId, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<StatusData> = await deleteExistingStatus(statusId);
    if (!response?.success) {
      const msg =
        typeof response?.message === 'string' && response.message.trim()
          ? response.message.trim()
          : 'Failed to delete status';
      return rejectWithValue(msg);
    }
    return response;
  } catch (error) {
    return rejectWithValue(rejectMessage(error, 'Failed to delete status'));
  }
});
