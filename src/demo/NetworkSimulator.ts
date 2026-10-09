import { useSyncExternalStore } from 'react';

/**
 * Simulates network conditions for demo mode. Mock services route their latency
 * through `simulateRequest`, so switching the mode changes the whole app at runtime.
 */
export type NetworkMode = 'fast' | 'normal' | 'slow' | 'offline' | 'error';

export const NETWORK_MODES: readonly NetworkMode[] = ['fast', 'normal', 'slow', 'offline', 'error'];

const LATENCY_FACTOR: Record<NetworkMode, number> = { fast: 0.1, normal: 1, slow: 5, offline: 0, error: 1 };

export class SimulatedNetworkError extends Error {
  readonly kind: 'offline' | 'server';
  constructor(kind: 'offline' | 'server') {
    super(kind === 'offline' ? 'You appear to be offline.' : 'The server returned an error (500).');
    this.kind = kind;
    this.name = 'SimulatedNetworkError';
  }
}

interface NetworkState {
  mode: NetworkMode;
  /** Increments on every mode change so cached screens can reload. */
  epoch: number;
}

const initial = process.env.EXPO_PUBLIC_NETWORK_MODE as NetworkMode | undefined;
let state: NetworkState = { mode: initial && NETWORK_MODES.includes(initial) ? initial : 'normal', epoch: 0 };
const listeners = new Set<() => void>();

export const NetworkSimulator = {
  getState: (): NetworkState => state,
  getMode: (): NetworkMode => state.mode,
  setMode(mode: NetworkMode) {
    if (mode === state.mode) return;
    state = { mode, epoch: state.epoch + 1 };
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Resolves after the mode-scaled latency, or rejects when the mode is offline or error. */
export async function simulateRequest(baseMs = 400): Promise<void> {
  const { mode } = state;
  if (mode === 'offline') {
    await new Promise<void>((r) => setTimeout(r, 120));
    throw new SimulatedNetworkError('offline');
  }
  await new Promise<void>((r) => setTimeout(r, Math.round(baseMs * LATENCY_FACTOR[mode])));
  if (mode === 'error') throw new SimulatedNetworkError('server');
}

/** RTK Query compatible error for a failed simulated request. */
export function toQueryError(e: unknown): { status: 'FETCH_ERROR'; error: string } | { status: number; data: string } {
  if (e instanceof SimulatedNetworkError) {
    return e.kind === 'offline' ? { status: 'FETCH_ERROR', error: e.message } : { status: 500, data: e.message };
  }
  return { status: 'FETCH_ERROR', error: e instanceof Error ? e.message : 'Request failed' };
}

export function useNetworkState(): NetworkState {
  return useSyncExternalStore(NetworkSimulator.subscribe, NetworkSimulator.getState, NetworkSimulator.getState);
}
