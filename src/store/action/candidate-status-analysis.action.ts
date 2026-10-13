import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { AxiosResponse } from '../model';
import { CandidateStatusAnalysis } from '../model/candidate-status-analysis.types';
import { fetchAllCandidateStatusAnalysis } from '../services/candidate-status-analysis';

export const fetchAllCandidateWithAnalysis = createAsyncThunk(
  'candidates-status-analysis/FetchAllCandidateWithAnalysis',
  async (_, { rejectWithValue }) => {
    try {
      const { data: response }: AxiosResponse<CandidateStatusAnalysis[]> =
        await fetchAllCandidateStatusAnalysis();
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Failed to fetch candidates analysis',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);
