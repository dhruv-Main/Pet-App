import type { AgentAction, AgentActionKind } from '@apptypes/platform';
import { simulateRequest } from '@/demo/NetworkSimulator';

/**
 * Executor port. Each action kind maps to a service call. Today these are
 * simulated; later each delegates to the owning microservice (booking, orders,
 * claims, device) using the same signature.
 */
export interface AgentExecutor {
  run(action: AgentAction): Promise<void>;
  undo(action: AgentAction): Promise<void>;
}

const simulated: AgentExecutor = {
  run: async () => {
    await simulateRequest(900);
  },
  undo: async () => {
    await simulateRequest(400);
  },
};

export const agentExecutors: Record<AgentActionKind, AgentExecutor> = {
  book_appointment: simulated,
  place_order: simulated,
  submit_claim: simulated,
  adjust_feeding: simulated,
  schedule_reminder: simulated,
};
