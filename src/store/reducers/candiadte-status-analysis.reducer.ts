import { createSlice } from '@reduxjs/toolkit';

import { CandidateStatusAnalysisState } from '../model/candidate-status-analysis.types';
import { fetchAllCandidateWithAnalysis } from '../action/candidate-status-analysis.action';

const initialState: CandidateStatusAnalysisState = {
  candidateStatus: [],
  loading: false,
  error: null,
};

const candidateStatusAnalysisReducer = createSlice({
  name: 'candidates-status-analysis',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCandidateWithAnalysis.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllCandidateWithAnalysis.fulfilled, (state, action) => {
        if (action.payload?.data && action.payload.data.length > 0) {
          state.candidateStatus = action.payload?.data;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllCandidateWithAnalysis.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to fetch Candidate with status';
      });
  },
});

export default candidateStatusAnalysisReducer.reducer;
