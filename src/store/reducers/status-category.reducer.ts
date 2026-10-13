// src/store/reducers/status-category.reducer.ts
import { createSlice } from '@reduxjs/toolkit';
import {
  fetchStatusCategories,
  createStatusCategory,
  updateStatusCategory,
  deleteStatusCategory,
} from '../action/status-category.action';
import { StatusCategory } from '../model';

// Define the state interface here instead of importing it
interface StatusCategoryState {
  statusCategories: StatusCategory[];
  loading: boolean;
  error: string | null;
}

const initialState: StatusCategoryState = {
  statusCategories: [],
  loading: false,
  error: null,
};

const statusCategorySlice = createSlice({
  name: 'statusCategory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch status categories
    builder.addCase(fetchStatusCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStatusCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.statusCategories = action.payload.data || [];
    });
    builder.addCase(fetchStatusCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Failed to fetch status categories';
    });

    // Create status category
    builder.addCase(createStatusCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createStatusCategory.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload && action.payload.data) {
        state.statusCategories.push(action.payload.data);
      }
    });
    builder.addCase(createStatusCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Failed to create status category';
    });

    // Update status category
    builder.addCase(updateStatusCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateStatusCategory.fulfilled, (state, action) => {
      state.loading = false;
      const updatedCategory = action.payload?.data;
      if (updatedCategory) {
        const index = state.statusCategories.findIndex((cat) => cat.id === updatedCategory.id);
        if (index !== -1) {
          state.statusCategories[index] = updatedCategory;
        }
      }
    });
    builder.addCase(updateStatusCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Failed to update status category';
    });

    // Delete status category
    builder.addCase(deleteStatusCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteStatusCategory.fulfilled, (state, action) => {
      state.loading = false;
      const deletedId = action.payload?.data?.id;
      if (deletedId) {
        state.statusCategories = state.statusCategories.filter((cat) => cat.id !== deletedId);
      }
    });
    builder.addCase(deleteStatusCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Failed to delete status category';
    });
  },
});

export default statusCategorySlice.reducer;
