import { createSlice } from '@reduxjs/toolkit';
import { fetchTablePreference } from '../action/table-preference.action';

interface TablePrefState {
  preferences: {
    [key: string]: Record<string, boolean>;
  };
  loading: boolean;
}

const initialState: TablePrefState = {
  preferences: {},
  loading: false,
};

const tablePreferenceSlice = createSlice({
  name: 'tablePreference',
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchTablePreference.pending, (state) => {
        state.loading = true;
      })

      // ✅ FINAL SAFE VERSION
      .addCase(fetchTablePreference.fulfilled, (state, action) => {
        console.log("🔥 FINAL PAYLOAD:", action.payload);

        // ✅ SAFE EXTRACTION
        const tableName = action.payload?.tableName;
        const columnConfig = action.payload?.column_config || {};

        // ❗ GUARD (VERY IMPORTANT)
        if (!tableName) {
          console.warn("⚠️ tableName missing in payload");
          state.loading = false;
          return;
        }

        console.log("✅ TABLE:", tableName);
        console.log("✅ CONFIG:", columnConfig);

        state.preferences[tableName] = columnConfig;

        state.loading = false;
      })

      // ✅ ALSO HANDLE REJECT SAFELY
      .addCase(fetchTablePreference.rejected, (state, action) => {
        console.error("❌ FETCH FAILED:", action.payload || action.error);
        state.loading = false;
      });
  },
});

export default tablePreferenceSlice.reducer;