import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse, InviteUserResponse, User, UserState } from '../model';
import { fetchAllUsers, registerUser } from '../action/users.action';

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
};

const usersReducer = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<ApiResponse<User[]>>) => {
        if (action.payload?.data?.length > 0) {
          state.users = action.payload?.data;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllUsers.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to fetch users';
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        registerUser.fulfilled,
        (state, action: PayloadAction<ApiResponse<InviteUserResponse>>) => {
          if (action.payload?.data) {
            state.users = [...state.users, action.payload?.data?.userDetails];
          }
          state.loading = false;
          state.error = null;
        }
      )
      .addCase(registerUser.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to fetch users';
      });
  },
});

export default usersReducer.reducer;
