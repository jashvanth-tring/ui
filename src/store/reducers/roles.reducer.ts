import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchRoles } from '../action/roles.action';
import { ApiResponse, Role, RoleState } from '../model';

const initialState: RoleState = {
  roles: [],
  loading: false,
  error: null,
};

const rolesReducer = createSlice({
  name: 'roles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRoles.fulfilled, (state, action: PayloadAction<ApiResponse<Role[]>>) => {
        state.loading = true;
        if (action.payload?.data?.length > 0) {
          state.roles = action.payload.data;
        }
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch roles';
      });
  },
});
export default rolesReducer.reducer;
