import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ConsentProfile, ConsentPurpose } from '@apptypes/platform';
import { mockConsent } from '@services/mock/platformFixtures';
import type { RootState } from '@store/store';

interface ConsentState {
  profile: ConsentProfile;
}

const initialState: ConsentState = { profile: mockConsent };

const consentSlice = createSlice({
  name: 'consent',
  initialState,
  reducers: {
    grantChanged: {
      reducer(state, action: PayloadAction<{ purpose: ConsentPurpose; granted: boolean; at: string }>) {
        const { purpose, granted, at } = action.payload;
        state.profile.grants[purpose] = { purpose, granted, updatedAt: at };
        state.profile.version += 1;
      },
      prepare(purpose: ConsentPurpose, granted: boolean) {
        return { payload: { purpose, granted, at: new Date().toISOString() } };
      },
    },
  },
});

export const { grantChanged } = consentSlice.actions;
export default consentSlice.reducer;

export const selectConsentProfile = (s: RootState) => s.consent.profile;
export const selectConsentFor = (purpose: ConsentPurpose) => (s: RootState) =>
  s.consent.profile.grants[purpose];
