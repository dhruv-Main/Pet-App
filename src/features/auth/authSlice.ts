import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import type { AppThunk } from '@store/store';
import type { User } from '@apptypes/domain';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: 'idle' | 'authenticating' | 'authenticated' | 'error';
  biometricEnabled: boolean;
  /** True while the visitor browses without an account. */
  guest: boolean;
  /** Which auth screen to open first after leaving guest mode. */
  entry: 'onboarding' | 'login' | 'signup';
  /** Reason text while the sign-in prompt is open, otherwise null. */
  prompt: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle',
  biometricEnabled: false,
  guest: false,
  entry: 'onboarding',
  prompt: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authenticating(state) {
      state.status = 'authenticating';
    },
    credentialsReceived(
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.status = 'authenticated';
      state.guest = false;
      state.prompt = null;
    },
    guestStarted(state) {
      // A guest never carries credentials or a user.
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = 'idle';
      state.guest = true;
      state.prompt = null;
    },
    guestExited(state, action: PayloadAction<'login' | 'signup' | 'onboarding' | undefined>) {
      state.guest = false;
      state.prompt = null;
      state.entry = action.payload ?? 'onboarding';
    },
    authPromptShown(state, action: PayloadAction<string>) {
      state.prompt = action.payload;
    },
    authPromptDismissed(state) {
      state.prompt = null;
    },
    setBiometric(state, action: PayloadAction<boolean>) {
      state.biometricEnabled = action.payload;
    },
    sessionExpired(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = 'idle';
    },
    loggedOut() {
      return initialState;
    },
  },
});

export const {
  authenticating,
  credentialsReceived,
  guestStarted,
  guestExited,
  authPromptShown,
  authPromptDismissed,
  setBiometric,
  sessionExpired,
  loggedOut,
} = authSlice.actions;

/** Clears stored tokens, then resets all app state (see root reducer) which returns the user to onboarding. */
export const logout = (): AppThunk => async (dispatch) => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('refreshToken'),
    ]);
  } catch {
    // Secure storage is unavailable on web; state reset below is what matters.
  }
  dispatch(loggedOut());
};
export default authSlice.reducer;
