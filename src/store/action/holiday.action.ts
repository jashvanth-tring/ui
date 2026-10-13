import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { CreateHoliday, UpdateHoliday } from '../model/holiday.types';
import {
  fetchHolidaysService,
  createHolidayService,
  updateHolidayService,
  deleteHolidayService,
  deleteHolidaysByYearService,
  uploadHolidayDocService,
} from '../services/holiday';

export const fetchHolidays = createAsyncThunk(
  'holidays/fetchHolidays',
  async (params: { year?: string; month?: string } | undefined, { rejectWithValue }) => {
    try {
      const { data: response } = await fetchHolidaysService(params);
      return response?.data ?? [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Failed to fetch holidays',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);

export const createHoliday = createAsyncThunk(
  'holidays/createHoliday',
  async (payload: CreateHoliday, { rejectWithValue }) => {
    try {
      const { data: response } = await createHolidayService(payload);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Failed to create holiday',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);

export const updateHoliday = createAsyncThunk(
  'holidays/updateHoliday',
  async ({ id, payload }: { id: number; payload: UpdateHoliday }, { rejectWithValue }) => {
    try {
      const { data: response } = await updateHolidayService(id, payload);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update holiday'
      );
    }
  }
);

export const deleteHoliday = createAsyncThunk(
  'holidays/deleteHoliday',
  async (id: number, { rejectWithValue }) => {
    try {
      const { data: response } = await deleteHolidayService(id);
      return { ...response, id };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete holiday'
      );
    }
  }
);

export const deleteHolidaysByYear = createAsyncThunk(
  'holidays/deleteHolidaysByYear',
  async (year: number, { rejectWithValue }) => {
    try {
      const { data: response } = await deleteHolidaysByYearService(year);
      return { ...response, year };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete holidays by year'
      );
    }
  }
);

export const uploadHolidayDoc = createAsyncThunk(
  'holidays/uploadHolidayDoc',
  async ({ file, year }: { file: File; year: number }, { rejectWithValue }) => {
    try {
      const { data: response } = await uploadHolidayDocService(file, year);
      return response?.data ?? { inserted: 0 };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Upload failed',
          status: error.response?.status,
          error: error.response?.data,
        });
      }
    }
  }
);