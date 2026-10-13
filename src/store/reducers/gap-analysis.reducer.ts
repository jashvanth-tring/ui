import { createSlice } from '@reduxjs/toolkit';
import {
  fetchClientWiseData,
  fetchGapAnalysisOne,
  fetchGapAnalysisThree,
  fetchGapAnalysisTwo,
  fetchWeeklyData,
  fetchDailyData,
} from '../action/gap-analysis.action';
import {
  gap_analysis_1,
  gap_analysis_2,
  gap_analysis_3,
  WeeklyData,
  ClientWiseData,
  CategoriesData,
  PositionData,
} from '../model/gap-analysis.types';

interface GapState {
  gap_analysis_1: gap_analysis_1[];
  gap_analysis_2: gap_analysis_2[];
  gap_analysis_3: gap_analysis_3[];
  weekly_data: WeeklyData[];
  daily_data: WeeklyData[];
  client_wise_data: ClientWiseData[];
  loading: boolean;
  error: string | null;
}

const initialState: GapState = {
  gap_analysis_1: [],
  gap_analysis_2: [],
  gap_analysis_3: [],
  weekly_data: [],
  daily_data: [],
  client_wise_data: [],
  loading: false,
  error: null,
};

// Define types based on your gap-analysis.types.ts
interface WeeklyDataResponse {
  weekStart?: string;
  startDate?: string;
  weekEnd?: string;
  endDate?: string;
  categories?: CategoriesData[];
  data?: CategoriesData[]; // Assuming data has the same structure as categories
  [key: string]: unknown;
}
interface ClientWiseDataResponse {
  clientId?: string | number;
  id?: string | number;
  clientName?: string;
  name?: string;
  positions?: PositionData[];
  data?: PositionData[];
  [key: string]: unknown;
}

// Transform API response to WeeklyData type
const toWeeklyData = (response: WeeklyDataResponse): WeeklyData => {
  return {
    weekStart: response.weekStart || response.startDate || '',
    weekEnd: response.weekEnd || response.endDate || '',
    categories: response.categories || response.data || [],
    ...response,
  };
};

// Transform API response to ClientWiseData type
// In your transformation function
const toClientWiseData = (response: ClientWiseDataResponse): ClientWiseData => {
  // Handle clientId conversion
  let clientId: number;

  if (typeof response.clientId === 'string') {
    clientId = parseInt(response.clientId, 10);
    if (isNaN(clientId)) {
      console.warn(`Invalid clientId: ${response.clientId}, defaulting to 0`);
      clientId = 0;
    }
  } else if (typeof response.clientId === 'number') {
    clientId = response.clientId;
  } else {
    // Handle case where clientId is undefined by checking for id
    const fallbackId = response.id;
    if (typeof fallbackId === 'string') {
      clientId = parseInt(fallbackId, 10) || 0;
    } else if (typeof fallbackId === 'number') {
      clientId = fallbackId;
    } else {
      clientId = 0;
    }
  }

  return {
    clientId, // Now guaranteed to be number
    clientName: response.clientName || response.name || '',
    positions: response.positions || response.data || [],
  };
};
const gapReducer = createSlice({
  name: 'analysis',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Gap analysis -1
      .addCase(fetchGapAnalysisOne.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGapAnalysisOne.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload.data)) {
          state.gap_analysis_1 = action.payload.data;
        } else if (action.payload.data) {
          state.gap_analysis_1 = [action.payload.data];
        }
      })
      .addCase(fetchGapAnalysisOne.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch Gap Analysis 1';
      })

      // Gap analysis -2
      .addCase(fetchGapAnalysisTwo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGapAnalysisTwo.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload.data)) {
          state.gap_analysis_2 = action.payload.data;
        } else if (action.payload.data) {
          state.gap_analysis_2 = [action.payload.data];
        }
      })
      .addCase(fetchGapAnalysisTwo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch Gap Analysis 2';
      })

      // Gap analysis -3
      .addCase(fetchGapAnalysisThree.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGapAnalysisThree.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload.data)) {
          state.gap_analysis_3 = action.payload.data;
        } else if (action.payload.data) {
          state.gap_analysis_3 = [action.payload.data];
        }
      })
      .addCase(fetchGapAnalysisThree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch Gap Analysis 3';
      })

      // Fetch Weekly Data
      .addCase(fetchWeeklyData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeeklyData.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload.data)) {
          state.weekly_data = action.payload.data.map(toWeeklyData);
        } else if (action.payload.data) {
          state.weekly_data = [toWeeklyData(action.payload.data)];
        }
      })
      .addCase(fetchWeeklyData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch Weekly Data';
      })

      // Client Wise Data
      .addCase(fetchClientWiseData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientWiseData.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload.data)) {
          state.client_wise_data = action.payload.data.map(toClientWiseData);
        } else if (action.payload.data) {
          state.client_wise_data = [toClientWiseData(action.payload.data)];
        }
      })
      .addCase(fetchClientWiseData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch Client Wise Data';
      })

      // Fetch Daily Data
      .addCase(fetchDailyData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyData.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload.data)) {
          state.daily_data = action.payload.data.map(toWeeklyData);
        } else if (action.payload.data) {
          state.daily_data = [toWeeklyData(action.payload.data)];
        }
      })
      .addCase(fetchDailyData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch Daily Data';
      });
  },
});

export default gapReducer.reducer;
