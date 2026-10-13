import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  ApiResponse,
  AxiosResponse,
  PositionDetails,
  PositionPayload,
  PositionUpdatePayload,
} from '../model';
import {
  addPositionDetails,
  getPositionDetails,
  updatePositionDetails,
  deletePositionDetails,
} from '../services';
import { HttpStatusCode } from '../../constants';

export const fetchPositionDetails = createAsyncThunk<
  ApiResponse<PositionDetails[]>,
  void,
  {
    rejectValue: string;
  }
>('positionDetails/fetchPositionDetails', async (_, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<PositionDetails[]> = await getPositionDetails();
    if (response?.success && response?.statusCode === HttpStatusCode.OK) {
      return response;
    }
    return rejectWithValue(
      response.message && typeof response.message === 'string'
        ? response.message
        : 'Failed to fetch the position details'
    );
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to fetch the position details'
    );
  }
});

export const addPositionDetail = createAsyncThunk<
  ApiResponse<PositionDetails>,
  PositionPayload,
  {
    rejectValue: string;
  }
>('positionDetails/addPositionDetails', async (addPosition, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<PositionDetails> =
      await addPositionDetails(addPosition);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to fetch the position details'
    );
  }
});

export const updatePositionDetail = createAsyncThunk<
  ApiResponse<PositionDetails>,
  { id: number; payload: PositionUpdatePayload },
  {
    rejectValue: string;
  }
>('positionDetails/updatePositionDetails', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<PositionDetails> = await updatePositionDetails(
      id,
      payload
    );
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to fetch the position details'
    );
  }
});

export const deletePositionDetail = createAsyncThunk<
  ApiResponse<PositionDetails>,
  number,
  {
    rejectValue: string;
  }
>('positionDetails/deletePositionDetails', async (id, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<PositionDetails> = await deletePositionDetails(id);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to fetch the position details'
    );
  }
});
