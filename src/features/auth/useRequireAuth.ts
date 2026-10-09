import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { authPromptShown, guestExited } from './authSlice';

/** Guards member-only actions: guests see the sign-in prompt, members proceed. */
export function useRequireAuth() {
  const dispatch = useAppDispatch();
  const guest = useAppSelector((s) => s.auth.status !== 'authenticated');

  const requireAuth = useCallback(
    (action: () => void, reason = 'Sign in to continue.') => {
      if (guest) dispatch(authPromptShown(reason));
      else action();
    },
    [guest, dispatch]
  );

  return { guest, requireAuth, signIn: () => dispatch(guestExited('login')) };
}
