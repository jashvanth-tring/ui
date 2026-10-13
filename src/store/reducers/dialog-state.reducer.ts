import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  open: false,
};

const dialogState = createSlice({
  name: 'dialogstate',
  initialState,
  reducers: {
    openDialog(state) {
      state.open = true;
    },
    closeDialog(state) {
      state.open = false;
    },
  },
});

export const { openDialog, closeDialog } = dialogState.actions;
export default dialogState.reducer;
