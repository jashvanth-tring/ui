import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  CreateRequirement,
  Requirement,
  UpdateRequirement,
} from '../model/requirement-details.types.ts';
import { AxiosResponse } from 'axios';
import axios from 'axios';
import {
  addRequirementDetails,
  deleteRequirements,
  fetchAllRequirements,
  updateRequirements,
  fetchRequirementStatusesApi,
  fetchRequirementDashboard 
} from '../services/requirement';
import { ApiResponse } from '../model';
import { uploadJD } from '../services/requirement';
export const createRequirementDetail = createAsyncThunk<
  ApiResponse<Requirement>,
  CreateRequirement,
  {
    rejectValue: string;
  }
>('requirements/createRequirementDetail', async (RequirementData, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<ApiResponse<Requirement>> =
      await addRequirementDetails(RequirementData);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to fetch the position details'
    );
  }
});

export const fetchAllRequirement = createAsyncThunk(
  'requirements/fetchAllRequirement',
  async (_, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchAllRequirements();
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Failed to fetch the Requirements',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);

export const deleteRequirement = createAsyncThunk<
  ApiResponse<Requirement>,
  number,
  {
    rejectValue: string;
  }
>('requirements/deleteRequirement', async (id, { rejectWithValue }) => {
  try {
    const { data: response } = await deleteRequirements(id);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to Delete the requirement details'
    );
  }
});

export const updateRequirement = createAsyncThunk<
  ApiResponse<Requirement>,
  { id: number; payload: UpdateRequirement },
  {
    rejectValue: string;
  }
>('locations/updateLocation', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data: response } = await updateRequirements(id, payload);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to update the requirement details'
    );
  }
});
export const parseJD = createAsyncThunk<
  any,
  File,
  { rejectValue: string }
>('requirements/parseJD', async (file, { rejectWithValue }) => {
  try {
    const { data: response } = await uploadJD(file);
    return response.data; 
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to parse JD'
    );
  }
});

export const fetchRequirementStatuses = createAsyncThunk(
  'requirement/fetchStatuses',
  async (_, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchRequirementStatusesApi();
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data);
      }
    }
  }
);

export const fetchRequirementPriorities = createAsyncThunk(
  'requirements/fetchRequirementPriorities',
  async (
    params: { page?: number; limit?: number, fromDate?: string; toDate?: string} | undefined,
    { rejectWithValue }
  ) => {
    try {
      const { data: response } = await fetchRequirementDashboard(
        params?.page  ?? 1,
        params?.limit ?? 50,
        params?.fromDate ?? undefined,
        params?.toDate ?? undefined,
      );
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || 'Failed to fetch requirement priorities'
        );
      }
      return rejectWithValue('Failed to fetch requirement priorities');
    }
  }
);
export const updateRequirementJrfKey = createAsyncThunk<
  any,
  { id: number; payload: { jrfS3Key: string; updatedBy: { id: number | undefined } } },
  { rejectValue: string }
>('requirements/updateJrfKey', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data: response } = await updateRequirements(id, payload as any);
    return response;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to update JRF key'
    );
  }
});
