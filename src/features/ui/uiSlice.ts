import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  activePetId: string | null;
  isOffline: boolean;
  bottomSheet: string | null;
}

const initialState: UiState = { activePetId: null, isOffline: false, bottomSheet: null };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActivePet(state, action: PayloadAction<string | null>) {
      state.activePetId = action.payload;
    },
    setOffline(state, action: PayloadAction<boolean>) {
      state.isOffline = action.payload;
    },
    openSheet(state, action: PayloadAction<string>) {
      state.bottomSheet = action.payload;
    },
    closeSheet(state) {
      state.bottomSheet = null;
    },
  },
});

export const { setActivePet, setOffline, openSheet, closeSheet } = uiSlice.actions;
export default uiSlice.reducer;
