import { createApi, fetchBaseQuery, retry, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { RootState } from '@store/store';

/**
 * Centralized RTK Query base API. All feature endpoints inject into this
 * single api via `injectEndpoints`, keeping the service layer modular and
 * aligned with a future microservices gateway (.NET / Python AI services).
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api.petco.example.com/v1/';

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await SecureStore.getItemAsync('accessToken');
  } catch {
    return null;
  }
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  timeout: 15000,
  prepareHeaders: async (headers, { getState }) => {
    const stateToken = (getState() as RootState).auth.accessToken;
    const token = stateToken ?? (await getToken());
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('X-Client', 'mobile');
    return headers;
  },
});

/**
 * Wraps the base query with 401 refresh handling. On a 401 the client attempts
 * a token refresh once, then replays the original request.
 */
// Single-flight: parallel 401s share one refresh call instead of each issuing their own.
let refreshInFlight: Promise<boolean> | null = null;

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!refreshInFlight) {
      refreshInFlight = Promise.resolve(
        rawBaseQuery({ url: 'auth/refresh', method: 'POST' }, api, extraOptions),
      )
        .then((r) => !!r.data)
        .catch(() => false)
        .finally(() => {
          refreshInFlight = null;
        });
    }
    const ok = await refreshInFlight;
    if (ok) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch({ type: 'auth/sessionExpired' });
    }
  }
  return result;
};

/**
 * Retries transient failures (network, timeout, 5xx) up to 2 times with backoff.
 * Client errors (4xx) are never retried.
 */
const resilientBaseQuery: typeof baseQueryWithReauth = retry(
  async (args, api, extraOptions) => {
    const result = await baseQueryWithReauth(args, api, extraOptions);
    const status = result.error?.status;
    if (typeof status === 'number' && status < 500) retry.fail(result.error);
    return result;
  },
  { maxRetries: 2 },
);

export const api = createApi({
  reducerPath: 'api',
  baseQuery: resilientBaseQuery,
  tagTypes: [
    'User',
    'Pet',
    'Product',
    'Cart',
    'Order',
    'Service',
    'Booking',
    'Post',
    'Reminder',
    'Adoption',
    'Device',
    'Passport',
    'Twin',
    'Verification',
  ],
  endpoints: () => ({}),
});
