import type { AppThunk } from '@store/store';
import type { ConsentPurpose } from '@apptypes/platform';
import { emitConsentUpdated } from '@platform/events';
import { grantChanged } from './consentSlice';

/** Updates a consent grant and publishes `consent.updated` for downstream services. */
export const updateConsent =
  (purpose: ConsentPurpose, granted: boolean): AppThunk =>
  (dispatch, getState) => {
    dispatch(grantChanged(purpose, granted));
    emitConsentUpdated({ userId: getState().consent.profile.userId, purpose, granted });
  };
