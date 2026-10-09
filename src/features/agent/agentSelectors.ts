import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

export const selectAgentActions = (s: RootState) => s.agent.actions;
export const selectAgentAudit = (s: RootState) => s.agent.audit;

export const selectPendingActions = createSelector(selectAgentActions, (actions) =>
  actions.filter((a) => a.status === 'proposed')
);

export const selectPendingCount = createSelector(selectPendingActions, (a) => a.length);

export const selectActiveActions = createSelector(selectAgentActions, (actions) =>
  actions.filter((a) => a.status === 'executing' || a.status === 'completed')
);
