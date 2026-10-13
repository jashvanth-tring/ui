import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  ApiResponse,
  AxiosResponse,
  StatusCategory,
  StatusCategoryPayload,
  StatusCategoryUpdatePayload,
} from '../model';
import {
  deleteExistingStatusCategory,
  getStatusCategory,
  createNewStatusCategory,
  updateExistingStatusCategory,
} from '../services';
import { HttpStatusCode } from '../../constants';

export const fetchStatusCategories = createAsyncThunk<
  ApiResponse<StatusCategory[]>,
  void,
  {
    rejectValue: string;
  }
>('statusCategory/fetchStatusCategories', async (_, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<StatusCategory[]> = await getStatusCategory();

    if (response?.success && response?.statusCode === HttpStatusCode.OK) {
      return response;
    }

    return rejectWithValue(
      response.message && typeof response.message === 'string'
        ? response.message
        : 'Failed to fetch roles'
    );
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch roles');
  }
});

export const createStatusCategory = createAsyncThunk<
  ApiResponse<StatusCategory>,
  StatusCategoryPayload,
  {
    rejectValue: string;
  }
>('statusCategory/createStatusCategory', async (newStatuscategory, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<StatusCategory> =
      await createNewStatusCategory(newStatuscategory);
    return response;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch roles');
  }
});

export const updateStatusCategory = createAsyncThunk<
  ApiResponse<StatusCategory>,
  { statusCategoryId: number; payload: StatusCategoryUpdatePayload },
  {
    rejectValue: string;
  }
>(
  'statusCategory/updateStatusCategory',
  async ({ statusCategoryId, payload }, { rejectWithValue }) => {
    try {
      const { data: response }: AxiosResponse<StatusCategory> = await updateExistingStatusCategory(
        statusCategoryId,
        payload
      );
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch roles');
    }
  }
);

export const deleteStatusCategory = createAsyncThunk<
  ApiResponse<StatusCategory>,
  number,
  {
    rejectValue: string;
  }
>('statusCategory/deleteStatusCategory', async (statusCategoryId, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<StatusCategory> =
      await deleteExistingStatusCategory(statusCategoryId);
    return response;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch roles');
  }
});
