import { createSlice } from '@reduxjs/toolkit';
import { RequirementState } from '../model/requirement-details.types';
import {
  fetchAllRequirement,
  deleteRequirement,
  createRequirementDetail,
  fetchRequirementStatuses,
  fetchRequirementPriorities,
} from '../action/requirement-details.action';
import { HttpStatusCode } from '../../constants';

const initialState: RequirementState = {
  requirements: [],
  statuses:    [],
  loading: false,
  error: null,
  dashboardRows:    [],
  dashboardMeta:    null,
  dashboardLoading: false,
  dashboardError:   null,
};

const requirementsReducer = createSlice({
  name: 'requirement',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    //create requirements
    builder
      .addCase(createRequirementDetail.pending, (state) => {
        state.loading = true;
      })
      .addCase(createRequirementDetail.fulfilled, (state, action) => {
        if (action.payload?.data) {
          // state.requirements.push(action.payload.data);
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(createRequirementDetail.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to create requirements';
      });

    builder
      .addCase(fetchAllRequirement.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllRequirement.fulfilled, (state, action) => {
        if (action.payload?.data?.length > 0) {
          state.requirements = action.payload?.data;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllRequirement.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to Requirements';
      });

    // handle delete

    builder
      .addCase(deleteRequirement.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteRequirement.fulfilled, (state, action) => {
        if (
          action.payload?.success &&
          action.payload?.statusCode === HttpStatusCode.OK &&
          action.payload.data
        ) {
          state.requirements = state.requirements.filter(
            (req) => req.id !== action.payload.data.id
          );
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteRequirement.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to Requirements';
      });

      builder
      .addCase(fetchRequirementStatuses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRequirementStatuses.fulfilled, (state, action) => {
        state.statuses = action.payload?.data ?? [];
        state.loading  = false;
        state.error    = null;
      })
      .addCase(fetchRequirementStatuses.rejected, (state) => {
        state.loading = false;
        state.error   = 'Failed to fetch requirement statuses';
      });
      builder
      .addCase(fetchRequirementPriorities.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError   = null;
      })
      .addCase(fetchRequirementPriorities.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardRows    = action.payload?.data ?? [];
        state.dashboardMeta    = action.payload?.meta ?? null;
        state.dashboardError   = null;
      })
      .addCase(fetchRequirementPriorities.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError   = action.payload as string;
      });
  },
});

export default requirementsReducer.reducer;
