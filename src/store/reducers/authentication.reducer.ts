import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, Session } from '../model';
import { fetchAuthState, login, logoutUser } from '../action/authentication.action';
import type { FetchAuthStateArg } from '../action/authentication.action';

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
  isAdmin: false,
  isAuthenticated: false,
  profileImageVersion: 0,
};

const authenticationReducer = createSlice({
  name: 'authentication',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; session: Session }>) => {
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.isAdmin = action.payload.user.role.id === 1;
      localStorage.setItem('session', JSON.stringify(action.payload.session));
    },
    logout: (state) => {
      state.user = null;
      state.session = null;
      state.isAdmin = false;
      localStorage.clear();
    },
     bumpProfileImageVersion: (state) => {   // ← add this
    state.profileImageVersion += 1;
  },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthState.pending, (state, action) => {
        const arg = action.meta.arg as FetchAuthStateArg;
        if (!arg?.silent) {
          state.loading = true;
        }
      })
      .addCase(fetchAuthState.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAdmin = action.payload.user?.role?.id === 1;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAuthState.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<{ user: User; session: Session }>) => {
          state.user = action.payload.user;
          state.session = action.payload.session;
          state.isAdmin = action.payload.user.role.id === 1;
          state.loading = false;
          state.error = null;
        }
      )
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.session = null;
        state.isAdmin = false;
        localStorage.clear();
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { logout, setCredentials, bumpProfileImageVersion } = authenticationReducer.actions;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAdmin = (state: { auth: AuthState }) => state.auth.isAdmin;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export default authenticationReducer.reducer;
