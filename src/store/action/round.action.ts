import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiResponse, AxiosResponse } from '../model';
import axios from 'axios';
import { CreateRound, Round, UpdateRound } from '../model/round.types';
import { createRound, deleteRound, fetchAllRound, updateRound } from '../services/round';
import { fetchFeedbackTrackerService } from '../services/round';
import { updateRejectReason } from '../services/round';

export const createRounds = createAsyncThunk(
  'round/createRounds',
  async (clientData: CreateRound, { rejectWithValue }) => {
    try {
      const { data: response }: AxiosResponse<Round> = await createRound(clientData);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Round has not created',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);

export const fetchAllRounds = createAsyncThunk(
  'rounds/fetchAllRounds',
  async (_, { rejectWithValue }) => {
    try {
      const { data: response }: AxiosResponse<Round[] | null> = await fetchAllRound();
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Failed to fetch rounds',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);

export const updateRounds = createAsyncThunk<
  ApiResponse<Round>,
  { id: number; payload: UpdateRound },
  {
    rejectValue: string;
  }
>('rounds/updateRounds', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data: response } = await updateRound(id, payload);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to update the client details'
    );
  }
});

export const deleteRounds = createAsyncThunk<
  ApiResponse<Round>,
  number,
  {
    rejectValue: string;
  }
>('rounds/deleteRounds', async (id, { rejectWithValue }) => {
  try {
    const { data: response } = await deleteRound(id);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to Delete the client details'
    );
  }
});

export const fetchFeedbackTracker = createAsyncThunk(
  'rounds/fetchFeedbackTracker',
  async (
    params: { from?: string; to?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await fetchFeedbackTrackerService(params);  
      return response.data?.data ?? [];                            
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Failed to fetch feedback tracker',
          status:  error.response?.status,
          error:   error.response?.data,
        });
      }
    }
  }
);

export const updateRejectionReason = createAsyncThunk<
  ApiResponse<void>,
  { id: number; payload: { rejectReason: string; updatedBy: { id: number } } },
  { rejectValue: string }
>(
  'rounds/updateRejectionReason',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data: response } = await updateRejectReason(id, payload);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update rejection reason'
      );
    }
  }
);
