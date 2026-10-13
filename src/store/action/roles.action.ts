import { createAsyncThunk } from '@reduxjs/toolkit';
import { getRoles } from '../services';
import { ApiResponse, AxiosResponse, Role } from '../model';
import { HttpStatusCode } from '../../constants';

export const fetchRoles = createAsyncThunk<
  ApiResponse<Role[]>,
  void,
  {
    rejectValue: string;
  }
>('roles/fetchRoles', async (_, { rejectWithValue }) => {
  try {
    const { data: response }: AxiosResponse<Role[]> = await getRoles();

    if (response.success && response.statusCode === HttpStatusCode.OK) {
      return response;
    }

    return rejectWithValue(response.message || 'Failed to fetch roles');
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch roles');
  }
});
