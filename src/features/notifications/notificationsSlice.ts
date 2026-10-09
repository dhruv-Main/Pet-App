import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppNotification, NotificationCategory } from '@apptypes/platform';
import { seedNotifications } from '@services/mock/platformFixtures';
import type { RootState } from '@store/store';

export type NotificationFilter = NotificationCategory | 'all' | 'unread';

interface NotificationsState {
  items: AppNotification[];
  filter: NotificationFilter;
}

const MAX_ITEMS = 100;

const initialState: NotificationsState = {
  items: [...seedNotifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  filter: 'all',
};

const slice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notificationAdded(state, action: PayloadAction<AppNotification>) {
      if (state.items.some((n) => n.id === action.payload.id)) return;
      state.items.unshift(action.payload);
      if (state.items.length > MAX_ITEMS) state.items.length = MAX_ITEMS;
    },
    notificationRead(state, action: PayloadAction<string>) {
      const n = state.items.find((i) => i.id === action.payload);
      if (n) n.read = true;
    },
    allNotificationsRead(state) {
      state.items.forEach((n) => {
        n.read = true;
      });
    },
    notificationDismissed(state, action: PayloadAction<string>) {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
    notificationFilterChanged(state, action: PayloadAction<NotificationFilter>) {
      state.filter = action.payload;
    },
  },
});

export const {
  notificationAdded,
  notificationRead,
  allNotificationsRead,
  notificationDismissed,
  notificationFilterChanged,
} = slice.actions;

export default slice.reducer;

const selectState = (s: RootState) => s.notifications;
export const selectNotifications = (s: RootState) => s.notifications.items;
export const selectNotificationFilter = (s: RootState) => s.notifications.filter;

export const selectUnreadCount = createSelector(selectNotifications, (items) =>
  items.reduce((n, i) => (i.read ? n : n + 1), 0),
);

export const selectFilteredNotifications = createSelector(selectState, ({ items, filter }) => {
  if (filter === 'all') return items;
  if (filter === 'unread') return items.filter((i) => !i.read);
  return items.filter((i) => i.category === filter);
});
