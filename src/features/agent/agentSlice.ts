import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AgentAction, AgentTask, AuditEntry } from '@apptypes/platform';
import { seedAgentActions, seedAgentTasks, seedAudit } from '@services/mock/platformFixtures';

interface AgentState {
  tasks: AgentTask[];
  actions: AgentAction[];
  audit: AuditEntry[];
}

const initialState: AgentState = {
  tasks: seedAgentTasks,
  actions: seedAgentActions,
  audit: seedAudit,
};

interface Stamped {
  id: string;
  at: string;
  auditId: string;
}

let auditSeq = 0;
const stamp = (id: string) => ({
  payload: { id, at: new Date().toISOString(), auditId: `au_${Date.now().toString(36)}_${auditSeq++}` } as Stamped,
});

function pushAudit(
  state: AgentState,
  s: Stamped,
  event: AuditEntry['event'],
  actor: AuditEntry['actor'],
  detail?: string
) {
  state.audit.unshift({ id: s.auditId, actionId: s.id, at: s.at, actor, event, detail });
}

function syncTask(state: AgentState, taskId: string) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  const related = state.actions.filter((a) => a.taskId === taskId);
  if (related.some((a) => a.status === 'executing')) task.status = 'running';
  else if (related.some((a) => a.status === 'proposed')) task.status = 'awaiting_approval';
  else if (related.every((a) => a.status === 'rejected' || a.status === 'undone')) task.status = 'cancelled';
  else task.status = 'done';
}

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    actionProposed: {
      reducer(state, action: PayloadAction<{ action: AgentAction; auditId: string; at: string }>) {
        const { action: a, auditId, at } = action.payload;
        state.actions.unshift(a);
        const task = state.tasks.find((t) => t.id === a.taskId);
        if (task) task.actionIds.push(a.id);
        state.audit.unshift({ id: auditId, actionId: a.id, at, actor: 'agent', event: 'proposed' });
        syncTask(state, a.taskId);
      },
      prepare(a: AgentAction) {
        const s = stamp(a.id).payload;
        return { payload: { action: a, auditId: s.auditId, at: s.at } };
      },
    },
    approved: {
      reducer(state, action: PayloadAction<Stamped>) {
        const a = state.actions.find((x) => x.id === action.payload.id);
        if (!a || a.status !== 'proposed') return;
        a.status = 'executing';
        pushAudit(state, action.payload, 'approved', 'user');
        syncTask(state, a.taskId);
      },
      prepare: stamp,
    },
    rejected: {
      reducer(state, action: PayloadAction<Stamped>) {
        const a = state.actions.find((x) => x.id === action.payload.id);
        if (!a || a.status !== 'proposed') return;
        a.status = 'rejected';
        pushAudit(state, action.payload, 'rejected', 'user');
        syncTask(state, a.taskId);
      },
      prepare: stamp,
    },
    executed: {
      reducer(state, action: PayloadAction<Stamped>) {
        const a = state.actions.find((x) => x.id === action.payload.id);
        if (!a || a.status !== 'executing') return;
        a.status = 'completed';
        a.executedAt = action.payload.at;
        if (a.undoWindowSec > 0) {
          a.undoDeadline = new Date(
            new Date(action.payload.at).getTime() + a.undoWindowSec * 1000
          ).toISOString();
        }
        pushAudit(state, action.payload, 'executed', 'system');
        syncTask(state, a.taskId);
      },
      prepare: stamp,
    },
    failed: {
      reducer(state, action: PayloadAction<Stamped>) {
        const a = state.actions.find((x) => x.id === action.payload.id);
        if (!a) return;
        a.status = 'failed';
        pushAudit(state, action.payload, 'failed', 'system');
        syncTask(state, a.taskId);
      },
      prepare: stamp,
    },
    undone: {
      reducer(state, action: PayloadAction<Stamped>) {
        const a = state.actions.find((x) => x.id === action.payload.id);
        if (!a || a.status !== 'completed' || !a.undoDeadline) return;
        if (new Date(a.undoDeadline).getTime() < new Date(action.payload.at).getTime()) return;
        a.status = 'undone';
        a.undoDeadline = undefined;
        pushAudit(state, action.payload, 'undone', 'user');
        syncTask(state, a.taskId);
      },
      prepare: stamp,
    },
  },
});

export const { actionProposed, approved, rejected, executed, failed, undone } = agentSlice.actions;
export default agentSlice.reducer;
