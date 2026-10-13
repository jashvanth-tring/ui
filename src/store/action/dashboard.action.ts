import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { fetchDashboardKpis, fetchTodayProfilesShared } from '../services/dashboard';

export const fetchDashboardTable = createAsyncThunk(
  'dashboard-table/fetchDashboardTable',
  async (_, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchDashboardKpis();
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Failed to fetch dashboard',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);
export const fetchTodayProfilesSharedCount = createAsyncThunk(
  'dashboard/fetchTodayProfilesShared',
  async (_, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchTodayProfilesShared();
      const todayData = response?.data?.[0];
      const profilesShared =
        todayData?.categories?.find(
          (c: any) => c.categoryName === 'NO OF PROFILES SHARED'
        )?.count ?? 0;
      return profilesShared as number;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({ message: 'Failed to fetch profiles shared count' });
      }
    }
  }
);