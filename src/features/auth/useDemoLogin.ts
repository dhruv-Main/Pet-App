import { useCallback } from 'react';
import { useAppDispatch } from '@store/hooks';
import { mockUser } from '@services/mock/fixtures';
import { credentialsReceived } from './authSlice';

/** Demo-mode sign in: every provider (email, Google) signs in as the demo user. */
export function useDemoLogin() {
  const dispatch = useAppDispatch();
  return useCallback(
    () => dispatch(credentialsReceived({ user: mockUser, accessToken: 'demo.jwt.token', refreshToken: 'demo.refresh' })),
    [dispatch]
  );
}
