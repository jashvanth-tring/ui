import { createSlice } from '@reduxjs/toolkit';
import { fetchDashboardTable, fetchTodayProfilesSharedCount } from '../action/dashboard.action';
import { dashboardState } from '../model/dashboard.types';

const initialState: dashboardState = {
  dashboard: [],
  loading: false,
  error: null,
  profilesShared: 0, 
};

const dashboardReducer = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardTable.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardTable.fulfilled, (state, action) => {
        if (action.payload?.data?.length > 0) {
          state.dashboard = action.payload?.data;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchDashboardTable.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to fetch dashboard table Information';
      })
      .addCase(fetchTodayProfilesSharedCount.fulfilled, (state, action) => {
        state.profilesShared = action.payload ?? 0;
      });
  },
});

export default dashboardReducer.reducer;
