import type { AppThunk } from '@store/store';
import type { AgentAction } from '@apptypes/platform';
import { eventBus } from '@platform/events';
import { actionProposed, approved, executed, failed, rejected, undone } from './agentSlice';
import { agentExecutors } from './executors';

export const proposeAction =
  (action: AgentAction): AppThunk =>
  (dispatch) => {
    dispatch(actionProposed(action));
    eventBus.emit('agent.action.proposed', { action });
  };

/**
 * Approval workflow: user approves -> executor runs -> result recorded.
 * Autonomy is gated by the action class: irreversible actions are refused.
 */
export const approveAction =
  (id: string): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = getState().agent.actions.find((a) => a.id === id);
    if (!action || action.status !== 'proposed') return;
    if (action.actionClass === 'irreversible') {
      dispatch(failed(id));
      return;
    }
    dispatch(approved(id));
    eventBus.emit('agent.action.approved', { actionId: id });
    try {
      await agentExecutors[action.kind].run(action);
      dispatch(executed(id));
      eventBus.emit('agent.action.executed', { actionId: id });
    } catch {
      dispatch(failed(id));
    }
  };

export const rejectAction =
  (id: string): AppThunk =>
  (dispatch) => {
    dispatch(rejected(id));
    eventBus.emit('agent.action.rejected', { actionId: id });
  };

export const undoAction =
  (id: string): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = getState().agent.actions.find((a) => a.id === id);
    if (!action || action.status !== 'completed' || !action.undoDeadline) return;
    if (new Date(action.undoDeadline).getTime() < Date.now()) return;
    try {
      await agentExecutors[action.kind].undo(action);
      dispatch(undone(id));
      eventBus.emit('agent.action.undone', { actionId: id });
    } catch {
      dispatch(failed(id));
    }
  };
