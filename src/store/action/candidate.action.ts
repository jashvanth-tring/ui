import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  candidateProfile,
  candidateProfileDetails,
  createCandidateProfile,
  UpdateCandidateProfile,
  PipelineEntry,
  ParsedResumeResponse,
  CandidateStatusHistoryEntry,
  CandidateProfileHistoryEntry,
  HistoryPage,
} from '../model/candidate.types';
import {
  createCandidates,
  FetchAllCandidates,
  getCandidateByIds,
  UpdateCandidateInds,
  archiveCandidate as archiveCandidateService,
  getCandidatePipeline,
  uploadCandidateResume,
  getCandidateMappings,
  getCandidateStatusHistoryApi,
  getCandidateProfileHistoryApi,
} from '../services/candidate';
import axios from 'axios';
import { ApiResponse, AxiosResponse } from '../model';

export const createCandidate = createAsyncThunk(
  'candidates-profile/createCandidate',
  async (candidateData: createCandidateProfile, { rejectWithValue }) => {
    try {
      const { data: response }: AxiosResponse<candidateProfile> =
        await createCandidates(candidateData);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message:
            error.response?.data?.message || 'Candidate has not been created',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
      return rejectWithValue({
        message: 'An unexpected error occurred',
        error: error,
      });
    }
  },
);

export const FetchAllCandidate = createAsyncThunk(
  'candidates-profiles/FetchAllCandidate',
  async (_, { rejectWithValue }) => {
    try {
      const { data: response }: AxiosResponse<candidateProfile[]> =
        await FetchAllCandidates();
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message:
            error.response?.data?.message || 'Failed to fetch candidates',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  },
);

export const getCandidateById = createAsyncThunk<
  ApiResponse<candidateProfileDetails>,
  { id: number },
  { rejectValue: string }
>(
  'candidates-profiles/getCandidateById',
  async ({ id }, { rejectWithValue }) => {
    try {
      const { data: response } = await getCandidateByIds(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to get candidate details',
      );
    }
  },
);

export const UpdateCandidateInd = createAsyncThunk<
  ApiResponse<candidateProfile>,
  { id: number; payload: UpdateCandidateProfile },
  { rejectValue: string }
>(
  'candidates-profiles/updateCandidateInd',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data: response } = await UpdateCandidateInds(id, payload);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to update the Candidate',
      );
    }
  },
);

export const archiveCandidateAction = createAsyncThunk<
  ApiResponse<candidateProfile>,
  { id: number; updatedBy: { id: number } },
  { rejectValue: string }
>(
  'candidates-profiles/archiveCandidate',
  async ({ id, updatedBy }, { rejectWithValue }) => {
    try {
      const { data: response } = await archiveCandidateService(id, updatedBy);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to archive the Candidate',
      );
    }
  },
);

export const fetchCandidatePipeline = createAsyncThunk<
  ApiResponse<PipelineEntry[]>,
  { id: number },
  { rejectValue: string }
>(
  'candidates-profiles/fetchPipeline',
  async ({ id }, { rejectWithValue }) => {
    try {
      const { data: response } = await getCandidatePipeline(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch pipeline',
      );
    }
  },
);

export const uploadResume = createAsyncThunk<
  ApiResponse<ParsedResumeResponse>,
  { file: File },
  { rejectValue: string }
>(
  'candidates-profiles/uploadResume',
  async ({ file }, { rejectWithValue }) => {
    try {
      const { data: response } = await uploadCandidateResume(file);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to upload resume',
      );
    }
  },
);

export const fetchCandidateMappings = createAsyncThunk<
  ApiResponse<any>,
  { id: number },
  { rejectValue: string }
>(
  'candidates-profiles/fetchCandidateMappings',
  async ({ id }, { rejectWithValue }) => {
    try {
      const { data: response } = await getCandidateMappings(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch candidate mappings',
      );
    }
  },
);

export const fetchCandidateStatusHistory = createAsyncThunk<
  { success: boolean } & HistoryPage<CandidateStatusHistoryEntry>,
  { id: number; limit?: number; cursor?: string },
  { rejectValue: string }
>(
  'candidates-profiles/fetchStatusHistory',
  async ({ id, limit = 30, cursor }, { rejectWithValue }) => {
    try {
      const { data } = await getCandidateStatusHistoryApi(id, limit, cursor);
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch status history',
      );
    }
  },
);

export const fetchCandidateProfileHistory = createAsyncThunk<
  { success: boolean } & HistoryPage<CandidateProfileHistoryEntry>,
  { id: number; limit?: number; cursor?: string },
  { rejectValue: string }
>(
  'candidates-profiles/fetchProfileHistory',
  async ({ id, limit = 30, cursor }, { rejectWithValue }) => {
    try {
      const { data } = await getCandidateProfileHistoryApi(id, limit, cursor);
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch profile history',
      );
    }
  },
);