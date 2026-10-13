import { createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../axiosSetup';

// ✅ SAVE (supports both column visibility and column order)
export const saveTablePreference = createAsyncThunk(
  'tablePreference/save',
  async (
    payload: { 
      tableName: string; 
      columnConfig?: Record<string, boolean>;
      columnOrder?: string[];
    }
  ) => {
    try {
      console.log('📤 SAVING PREF:', payload);

      const response = await axiosInstance.post(
        '/user-preferences',
        payload
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ SAVE ERROR:', error);
      throw error; // ✅ throw instead of rejectWithValue
    }
  }
);

// ✅ FETCH (supports both column visibility and column order)
export const fetchTablePreference = createAsyncThunk(
  'tablePreference/fetch',
  async (tableName: string) => {
    try {
      console.log('📥 FETCH PREF FOR:', tableName);

      const response = await axiosInstance.get(
        `/user-preferences/${tableName}`
      );

      console.log('🔥 API RESPONSE:', response.data);

      const data = response.data || {};

      return {
        tableName: data.table_name || tableName,     // ✅ normalize
        column_config: data.column_config || {},     // ✅ normalize
        column_order: data.column_order || [],       // ✅ new field
      };

    } catch (error: any) {
      console.error('❌ FETCH ERROR:', error);

      // ✅ ALWAYS RETURN SAFE DATA (no reject)
      return {
        tableName,
        column_config: {},
        column_order: [],
      };
    }
  }
);