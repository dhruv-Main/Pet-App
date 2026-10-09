import { combineReducers, configureStore, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from '@services/api/baseApi';
import authReducer from '@features/auth/authSlice';
import cartReducer from '@features/cart/cartSlice';
import uiReducer from '@features/ui/uiSlice';
import consentReducer from '@features/consent/consentSlice';
import agentReducer from '@features/agent/agentSlice';
import notificationsReducer from '@features/notifications/notificationsSlice';
import dashboardReducer, { persistDashboardLayout } from '@features/home/dashboardSlice';
import hubReducer from '@features/hub/hubSlice';
import { startNotificationBridge } from '@features/notifications/notificationBridge';

const appReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: authReducer,
  cart: cartReducer,
  ui: uiReducer,
  consent: consentReducer,
  agent: agentReducer,
  notifications: notificationsReducer,
  dashboard: dashboardReducer,
  hub: hubReducer,
});

/** Logging out wipes every slice, including the RTK Query cache, so no user data survives. */
const rootReducer: typeof appReducer = (state, action) =>
  appReducer(action.type === 'auth/loggedOut' ? undefined : state, action);

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({ serializableCheck: { ignoredActions: ['auth/sessionExpired'] } }).concat(
      api.middleware
    ),
});

setupListeners(store.dispatch);
startNotificationBridge(store.dispatch);
store.subscribe(() => persistDashboardLayout(store.getState));

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<R = void> = ThunkAction<R, RootState, unknown, UnknownAction>;
