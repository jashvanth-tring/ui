import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAllUsers, getUserQr, inviteUser } from '../services';
import { AxiosResponse, InviteUserPayload, InviteUserResponse, User } from '../model';
import axios from 'axios';

export const registerUser = createAsyncThunk(
  'users/inviteUser',
  async (userData: InviteUserPayload, { rejectWithValue }) => {
    try {
      const { data: response }: AxiosResponse<InviteUserResponse> = await inviteUser(userData);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Registration failed',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
      return rejectWithValue({
        message: 'An unexpected error occurred',
        error,
      });
    }
  }
);

export const registerUserQr = createAsyncThunk(
  'users/inviteUserQr',
  async (input: number, { rejectWithValue }) => {
    try {
      const { data: response } = await getUserQr(input);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Registration failed',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
      return rejectWithValue({
        message: 'An unexpected error occurred',
        error,
      });
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  'users/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const { data: response }: AxiosResponse<User[]> = await getAllUsers();
      return response; // Return the users array directly
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Failed to fetch users',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
      return rejectWithValue({
        message: 'An unexpected error occurred',
        error,
      });
    }
  }
);
