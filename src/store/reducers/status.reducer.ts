import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse, StatusData, StatusState } from '../model';
import { HttpStatusCode } from '../../constants';
import { createStatus, deleteStatus, fetchStatus, updateStatus } from '../action/status.action';

const initialState: StatusState = {
  status: [],
  loading: false,
  error: null,
};

const statusSlice = createSlice({
  name: 'status',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatus.fulfilled, (state, action: PayloadAction<ApiResponse<StatusData[]>>) => {
        state.loading = false;
        if (action.payload.data.length > 0) {
          // state.status = action.payload.data.reduce(
          //   (acc, category) => {
          //     acc[category.id] = {
          //       categoryName: category.categoryName,
          //       status: category.status,
          //     };
          //     return acc;
          //   },
          //   {} as Record<number, { categoryName: string; status: StatusData[] }>
          // );
          state.status = action.payload.data;
          state.error = null;
        }
      })
      .addCase(fetchStatus.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(createStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStatus.fulfilled, (state, action: PayloadAction<ApiResponse<StatusData>>) => {
        const { statusCode, data } = action.payload;
        state.loading = false;
        if (statusCode === HttpStatusCode.CREATED && data) {
          state.status.push(data);
        }
      })
      .addCase(createStatus.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(updateStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStatus.fulfilled, (state, action: PayloadAction<ApiResponse<StatusData>>) => {
        const { statusCode, data } = action.payload;
        state.loading = false;
        if (statusCode === HttpStatusCode.OK && data) {
          const index = state.status.findIndex((status) => status.id === data.id);
          if (index !== -1) {
            state.status[index] = data;
          }
        }
      })
      .addCase(updateStatus.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to update status';
      })
      .addCase(deleteStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStatus.fulfilled, (state, action: PayloadAction<ApiResponse<StatusData>>) => {
        const { statusCode, data } = action.payload;
        state.loading = false;
        if (statusCode === HttpStatusCode.OK && data) {
          state.status = state.status.filter((status) => status.id !== data.id);
        }
      })
      .addCase(deleteStatus.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to delete status';
      });
  },
});

export default statusSlice.reducer;
