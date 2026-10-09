import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { hubTools } from './hubData';

export interface ActivityRecord {
  id: string;
  listing: string;
  entryId: string;
  title: string;
  subtitle: string;
  img: string;
  status: string;
  ref: string;
  at: string;
  answers: Record<string, string>;
  steps: [string, string][];
  cancelled?: boolean;
}

export interface ExpenseRecord {
  id: string;
  label: string;
  category: string;
  amount: number;
  at: string;
}

export interface FeedSlot {
  id: string;
  label: string;
  time: string;
  grams: number;
  on: boolean;
}

export interface FeedLog {
  id: string;
  at: string;
  grams: number;
  source: string;
}

export interface ExtraPet {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  ageYears: number;
}

export interface ReviewRecord {
  id: string;
  target: string;
  rating: number;
  text: string;
  at: string;
}

interface HubState {
  activity: ActivityRecord[];
  saved: string[];
  remindersDone: string[];
  redeemed: { id: string; title: string; cost: number; at: string }[];
  expenses: ExpenseRecord[];
  birthdays: string[];
  feedSlots: FeedSlot[];
  feedLog: FeedLog[];
  extraPets: ExtraPet[];
  reviews: ReviewRecord[];
  vaultExtra: { id: string; title: string; kind: string; date: string; size: string }[];
  customCount: number;
}

const initialState: HubState = {
  activity: [],
  saved: [],
  remindersDone: [],
  redeemed: [],
  expenses: [],
  birthdays: [],
  feedSlots: hubTools.feeding.map((s) => ({ ...s })),
  feedLog: [],
  extraPets: [],
  reviews: [],
  vaultExtra: [],
  customCount: 0,
};

const slice = createSlice({
  name: 'hub',
  initialState,
  reducers: {
    activityAdded(state, a: PayloadAction<ActivityRecord>) {
      state.activity.unshift(a.payload);
    },
    activityCancelled(state, a: PayloadAction<string>) {
      const r = state.activity.find((x) => x.id === a.payload);
      if (r) {
        r.cancelled = true;
        r.status = 'Cancelled';
      }
    },
    savedToggled(state, a: PayloadAction<string>) {
      state.saved = state.saved.includes(a.payload) ? state.saved.filter((s) => s !== a.payload) : [...state.saved, a.payload];
    },
    reminderToggled(state, a: PayloadAction<string>) {
      state.remindersDone = state.remindersDone.includes(a.payload)
        ? state.remindersDone.filter((s) => s !== a.payload)
        : [...state.remindersDone, a.payload];
    },
    rewardRedeemed(state, a: PayloadAction<{ id: string; title: string; cost: number; at: string }>) {
      state.redeemed.unshift(a.payload);
    },
    expenseAdded(state, a: PayloadAction<ExpenseRecord>) {
      state.expenses.unshift(a.payload);
    },
    expenseRemoved(state, a: PayloadAction<string>) {
      state.expenses = state.expenses.filter((e) => e.id !== a.payload);
    },
    birthdayToggled(state, a: PayloadAction<string>) {
      state.birthdays = state.birthdays.includes(a.payload) ? state.birthdays.filter((s) => s !== a.payload) : [...state.birthdays, a.payload];
    },
    feedSlotUpdated(state, a: PayloadAction<FeedSlot>) {
      state.feedSlots = state.feedSlots.map((s) => (s.id === a.payload.id ? a.payload : s));
    },
    feedDispensed(state, a: PayloadAction<FeedLog>) {
      state.feedLog.unshift(a.payload);
    },
    petAdded(state, a: PayloadAction<ExtraPet>) {
      state.extraPets.push(a.payload);
    },
    reviewAdded(state, a: PayloadAction<ReviewRecord>) {
      state.reviews.unshift(a.payload);
    },
    vaultAdded(state, a: PayloadAction<{ id: string; title: string; kind: string; date: string; size: string }>) {
      state.vaultExtra.unshift(a.payload);
    },
    customCounted(state) {
      state.customCount += 1;
    },
  },
});

export const {
  activityAdded,
  activityCancelled,
  savedToggled,
  reminderToggled,
  rewardRedeemed,
  expenseAdded,
  expenseRemoved,
  birthdayToggled,
  feedSlotUpdated,
  feedDispensed,
  petAdded,
  reviewAdded,
  vaultAdded,
  customCounted,
} = slice.actions;
export default slice.reducer;
