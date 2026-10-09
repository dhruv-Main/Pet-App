import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppThunk, RootState } from '@store/store';

export const WIDGET_IDS = [
  'insights',
  'vaccinations',
  'command',
  'twin',
  'agent',
  'recommended',
  'upcoming',
  'services',
  'spending',
  'prime',
  'subscriptions',
  'orders',
  'identity',
  'notifications',
] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

interface DashboardState {
  order: WidgetId[];
  hidden: WidgetId[];
  hydrated: boolean;
}

const STORAGE_KEY = 'petos.dashboard.layout.v3';

const initialState: DashboardState = {
  order: [...WIDGET_IDS],
  hidden: [],
  hydrated: false,
};

const isWidgetId = (v: unknown): v is WidgetId => typeof v === 'string' && (WIDGET_IDS as readonly string[]).includes(v);

/** Drops unknown ids and appends widgets added in newer app versions. */
function normalise(order: unknown, hidden: unknown): Pick<DashboardState, 'order' | 'hidden'> {
  const o = Array.isArray(order) ? order.filter(isWidgetId) : [];
  const unique = Array.from(new Set(o));
  const missing = WIDGET_IDS.filter((id) => !unique.includes(id));
  const h = Array.isArray(hidden) ? Array.from(new Set(hidden.filter(isWidgetId))) : [];
  return { order: [...unique, ...missing], hidden: h };
}

const slice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    layoutHydrated(state, action: PayloadAction<{ order: unknown; hidden: unknown } | null>) {
      if (action.payload) {
        const n = normalise(action.payload.order, action.payload.hidden);
        state.order = n.order;
        state.hidden = n.hidden;
      }
      state.hydrated = true;
    },
    widgetMoved(state, action: PayloadAction<{ id: WidgetId; direction: -1 | 1 }>) {
      const i = state.order.indexOf(action.payload.id);
      const j = i + action.payload.direction;
      if (i < 0 || j < 0 || j >= state.order.length) return;
      [state.order[i], state.order[j]] = [state.order[j], state.order[i]];
    },
    widgetToggled(state, action: PayloadAction<WidgetId>) {
      const id = action.payload;
      state.hidden = state.hidden.includes(id) ? state.hidden.filter((h) => h !== id) : [...state.hidden, id];
    },
    layoutReset(state) {
      state.order = [...WIDGET_IDS];
      state.hidden = [...initialState.hidden];
    },
  },
});

export const { layoutHydrated, widgetMoved, widgetToggled, layoutReset } = slice.actions;
export default slice.reducer;

export const selectDashboardOrder = (s: RootState) => s.dashboard.order;
export const selectDashboardHidden = (s: RootState) => s.dashboard.hidden;

export const loadDashboardLayout = (): AppThunk => async (dispatch, getState) => {
  if (getState().dashboard.hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    dispatch(layoutHydrated(raw ? (JSON.parse(raw) as { order: unknown; hidden: unknown }) : null));
  } catch {
    dispatch(layoutHydrated(null));
  }
};

let timer: ReturnType<typeof setTimeout> | undefined;
let last = '';

/** Debounced persistence; call once with the store's subscribe. */
export function persistDashboardLayout(getState: () => RootState): void {
  const { order, hidden, hydrated } = getState().dashboard;
  if (!hydrated) return;
  const next = JSON.stringify({ order, hidden });
  if (next === last) return;
  last = next;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, 400);
}
