import { RootState } from '../reducers';
import {
  loginUser,
  signOutUser,
  getUserById,
  forgetPassword,
  resetPassword,
  recoverPassword,
} from '../../store/services';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { User, Session, AuthState } from '../model';
import { HttpStatusCode } from '../../constants';
import axios from 'axios';

/** Pass `{ silent: true }` to refresh the user without toggling global auth loading (avoids unmounting the app shell / orphan dialog backdrops). */
export type FetchAuthStateArg = { silent?: boolean } | undefined;

export const fetchAuthState = createAsyncThunk<AuthState, FetchAuthStateArg, { rejectValue: string }>(
  'authentication/fetchAuthState',
  async () => {
    try {
      const session = localStorage.getItem('session');
      if (session) {
        const parsedSession: Session = JSON.parse(session);
        const response = await getUserById(parsedSession.userId);
        if (response.data.success && response.data.statusCode === HttpStatusCode.OK) {
          const data: User = response.data.data;
          const isAdmin = data.role.id === 1;
          const isAuthenticated = true;
          return {
            user: data,
            session: parsedSession,
            loading: false,
            error: null,
            isAdmin,
            isAuthenticated,
            profileImageVersion: 0,
          };
        }
      }
    } catch (error) {
      console.error(error);
    }
    return {
      user: null,
      session: null,
      loading: false,
      error: null,
      isAdmin: false,
      isAuthenticated: false,
      profileImageVersion: 0,
    };
  }
);

export const login = createAsyncThunk<
  { user: User; session: Session },
  { email: string; password: string },
  { rejectValue: string }
>(
  'authentication/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await loginUser(email, password);
      const data = response.data;

      if (
        data.success &&
        data.statusCode === HttpStatusCode.OK
      ) {
        const { user, session } =
          data.data;

        const sessionWithUserId: Session = {
          ...session,
          userId: user.id,
        };

        // Store Full Session
        localStorage.setItem(
          'session',
          JSON.stringify(
            sessionWithUserId,
          ),
        );
        // Store Tokens
        localStorage.setItem(
          'accessToken',
          session.accessToken,
        );

        localStorage.setItem(
          'refreshToken',
          session.refreshToken,
        );

        localStorage.setItem(
          'deviceId',
          session.deviceId,
        );

        return {
          user,
          session:
            sessionWithUserId,
        };
      }

      return rejectWithValue(
        data.message,
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data
          ?.message ||
        'Something went wrong.';

      return rejectWithValue(
        errorMessage,
      );
    }
  },
);


export const refreshAccessToken =
  async () => {
    const refreshToken =
      localStorage.getItem(
        'refreshToken',
      );

    const deviceId =
      localStorage.getItem(
        'deviceId',
      );

    const session =
      localStorage.getItem(
        'session',
      );

    const userId = session
      ? JSON.parse(session).userId
      : null;

    return axios.post(
      '/auth/refresh-token',
      {
        refreshToken,
        deviceId,
        userId,
      },
    );
  };

  export const fetchNewAccessToken =
  createAsyncThunk<
    string,
    void,
    { rejectValue: string }
  >(
    'authentication/refresh',
    async (_, { rejectWithValue }) => {
      try {
        const response =
          await refreshAccessToken();

        const data =
          response.data;

        if (
          data.success
        ) {
          const accessToken =
            data.data
              .accessToken;

          localStorage.setItem(
            'accessToken',
            accessToken,
          );

          return accessToken;
        }

        return rejectWithValue(
          data.message,
        );
      } catch {
        return rejectWithValue(
          'Session expired',
        );
      }
    },
  );

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'authentication/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const sessionToken = state.authSelector.session?.accessToken;

      if (sessionToken) {
        await signOutUser();
        localStorage.clear();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      return rejectWithValue('Logout failed. Please try again.');
    }
  }
);

export const forgetPasswordRequest = createAsyncThunk<
  void,
  { validateEmail: string },
  { rejectValue: string }
>('authentication/forgetPassword', async ({ validateEmail }, { rejectWithValue }) => {
  try {
    const response = await forgetPassword(validateEmail);
    const data = response.data;
    if (data.success && data.statusCode === HttpStatusCode.OK) {
      return;
    } else {
      return rejectWithValue(data.message);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || 'Something went wrong. Please try again later';
    return rejectWithValue(errorMessage);
  }
});

export const resetPasswordRequest = createAsyncThunk<
  void,
  { oldPassword: string; newPassword: string; userId: number },
  { rejectValue: string }
>(
  'authentication/resetPassword',
  async ({ oldPassword, newPassword, userId }, { rejectWithValue }) => {
    try {
      const response = await resetPassword(oldPassword, newPassword, userId);
      const data = response.data;
      if (data.success && data.statusCode === HttpStatusCode.OK) {
        return;
      } else {
        return rejectWithValue(data.message);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to reset password. Please try again later';
      return rejectWithValue(errorMessage);
    }
  }
);

export const recoverPasswordRequest = createAsyncThunk<
  void,
  { newPassword: string },
  { rejectValue: string }
>('authentication/recoverPassword', async ({ newPassword }, { rejectWithValue }) => {
  try {
    const response = await recoverPassword(newPassword);
    const data = response.data;
    if (data.success && data.statusCode === HttpStatusCode.OK) {
      return;
    } else {
      return rejectWithValue(data.message);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || 'Something went wrong, Please try again later';
    return rejectWithValue(errorMessage);
  }
});
