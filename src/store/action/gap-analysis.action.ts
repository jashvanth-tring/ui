// gap-analysis.actions.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios, { AxiosError, AxiosHeaders, RawAxiosRequestHeaders } from 'axios';
import {
  fetchClientWiseDataAction,
  fetchGapAnalysisOnes,
  fetchGapAnalysisThrees,
  fetchGapAnalysisTwos,
  fetchWeeklyDataAction,
  fetchDailyDataAction,
  updateGapsAnalysis,
} from '../services/gap-analysis';
import { gap_analysis_1, updateGapPayload } from '../model/gap-analysis.types';
import { ApiResponse } from '../model';

interface RequestParams {
  params?: string;
  headers?: RawAxiosRequestHeaders | AxiosHeaders;
}

export const fetchGapAnalysisOne = createAsyncThunk(
  'analysis/fetchGapAnalysisOne',
  async (params: RequestParams, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchGapAnalysisOnes(params);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        return rejectWithValue({
          message: axiosError.response?.data?.message || 'Failed to fetch Gap analysis one details',
          status: axiosError.response?.status,
          error: axiosError.response?.data,
        });
      }
      return rejectWithValue({
        message: 'An unknown error occurred',
        status: 500,
        error: error,
      });
    }
  }
);

export const fetchGapAnalysisTwo = createAsyncThunk(
  'analysis/fetchGapAnalysisTwo',
  async (params: RequestParams, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchGapAnalysisTwos(params);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        return rejectWithValue({
          message: axiosError.response?.data?.message || 'Failed to fetch Gap analysis two details',
          status: axiosError.response?.status,
          error: axiosError.response?.data,
        });
      }
      return rejectWithValue({
        message: 'An unknown error occurred',
        status: 500,
        error: error,
      });
    }
  }
);

export const fetchGapAnalysisThree = createAsyncThunk(
  'analysis/fetchGapAnalysisThree',
  async (params: RequestParams, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchGapAnalysisThrees(params);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        return rejectWithValue({
          message:
            axiosError.response?.data?.message || 'Failed to fetch Gap analysis three details',
          status: axiosError.response?.status,
          error: axiosError.response?.data,
        });
      }
      return rejectWithValue({
        message: 'An unknown error occurred',
        status: 500,
        error: error,
      });
    }
  }
);

export const fetchClientWiseData = createAsyncThunk(
  'analysis/fetchClientWiseData',
  async (params: RequestParams, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchClientWiseDataAction(params);
      console.log("Datae", response);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        return rejectWithValue({
          message: axiosError.response?.data?.message || 'Failed to fetch client-wise data',
          status: axiosError.response?.status,
          error: axiosError.response?.data,
        });
      }
      return rejectWithValue({
        message: 'An unknown error occurred',
        status: 500,
        error: error,
      });
    }
  }
);

export const fetchWeeklyData = createAsyncThunk(
  'analysis/fetchWeeklyData',
  async (params: RequestParams, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchWeeklyDataAction(params);
      console.log('data check', params);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        return rejectWithValue({
          message: axiosError.response?.data?.message || 'Failed to fetch weekly data',
          status: axiosError.response?.status,
          error: axiosError.response?.data,
        });
      }
      return rejectWithValue({
        message: 'An unknown error occurred',
        status: 500,
        error: error,
      });
    }
  }
);

export const fetchDailyData = createAsyncThunk(
  'analysis/fetchDailyData',
  async (params: RequestParams, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchDailyDataAction(params);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        return rejectWithValue({
          message: axiosError.response?.data?.message || 'Failed to fetch daily data',
          status: axiosError.response?.status,
          error: axiosError.response?.data,
        });
      }
      return rejectWithValue({
        message: 'An unknown error occurred',
        status: 500,
        error: error,
      });
    }
  }
);

export const updateGapAnalysis = createAsyncThunk<
  ApiResponse<gap_analysis_1>,
  { payload: updateGapPayload; params?: { headers?: RawAxiosRequestHeaders | AxiosHeaders } },
  { rejectValue: { message: string; status?: number; error?: unknown } }
>('analysis/update', async ({ payload, params }, { rejectWithValue }) => {
  try {
    const { data: response } = await updateGapsAnalysis(payload, params);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return rejectWithValue({
        message: axiosError.response?.data?.message || 'Failed to update the Gap analysis details',
        status: axiosError.response?.status,
        error: axiosError.response?.data,
      });
    }
    return rejectWithValue({
      message: error instanceof Error ? error.message : 'Failed to update the Gap analysis details',
      status: 500,
      error: error,
    });
  }
});
