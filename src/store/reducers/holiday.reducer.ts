import { createSlice } from '@reduxjs/toolkit';
import { HolidayState } from '../model/holiday.types';
import {
  fetchHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  deleteHolidaysByYear,
  uploadHolidayDoc,
} from '../action/holiday.action';

const initialState: HolidayState = {
  holidays: [],
  loading: false,
  error: null,
  uploading: false,
  uploadError: null,
};

const holidayReducer = createSlice({
  name: 'holidays',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ── Fetch ────────────────────────────────────────────────────────────────
    builder
      .addCase(fetchHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = action.payload ?? [];
      })
      .addCase(fetchHolidays.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to fetch holidays';
      });

    // ── Create ───────────────────────────────────────────────────────────────
    builder
      .addCase(createHoliday.pending, (state) => {
        state.loading = true;
      })
      .addCase(createHoliday.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createHoliday.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to create holiday';
      });

    // ── Update ───────────────────────────────────────────────────────────────
    builder
      .addCase(updateHoliday.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateHoliday.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateHoliday.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to update holiday';
      });

    // ── Delete single ────────────────────────────────────────────────────────
    builder
      .addCase(deleteHoliday.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHoliday.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = state.holidays.filter((h) => h.id !== action.payload?.id);
      })
      .addCase(deleteHoliday.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to delete holiday';
      });

    // ── Delete by year ───────────────────────────────────────────────────────
    builder
      .addCase(deleteHolidaysByYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHolidaysByYear.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = state.holidays.filter((h) => h.year !== action.payload?.year);
      })
      .addCase(deleteHolidaysByYear.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to delete holidays by year';
      });

    // ── Upload ───────────────────────────────────────────────────────────────
    builder
      .addCase(uploadHolidayDoc.pending, (state) => {
        state.uploading = true;
        state.uploadError = null;
      })
      .addCase(uploadHolidayDoc.fulfilled, (state) => {
        state.uploading = false;
      })
      .addCase(uploadHolidayDoc.rejected, (state) => {
        state.uploading = false;
        state.uploadError = 'Upload failed';
      });
  },
});

export default holidayReducer.reducer;