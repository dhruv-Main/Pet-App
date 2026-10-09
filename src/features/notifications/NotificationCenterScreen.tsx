import React, { useMemo } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import type { AppNotification, NotificationCategory, NotificationSeverity } from '@apptypes/platform';
import { AppText, Button, Card, EmptyState, IconBadge } from '@components/ui';
import type { IconName } from '@components/ui';
import { ScreenHeader } from '@components/platform';
import { useTheme } from '@theme/ThemeProvider';
import {
  NotificationFilter,
  allNotificationsRead,
  notificationDismissed,
  notificationFilterChanged,
  notificationRead,
  selectFilteredNotifications,
  selectNotificationFilter,
  selectUnreadCount,
} from './notificationsSlice';

const CATEGORY_ICON: Record<NotificationCategory, IconName> = {
  health: 'heart-pulse',
  passport: 'shield',
  agent: 'bot',
  booking: 'calendar',
  commerce: 'package',
  subscription: 'repeat',
  consent: 'lock',
};

const SEVERITY_TONE: Record<NotificationSeverity, 'primary' | 'warning' | 'danger'> = {
  info: 'primary',
  attention: 'warning',
  critical: 'danger',
};

const FILTERS: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'health', label: 'Health' },
  { key: 'agent', label: 'Agent' },
  { key: 'passport', label: 'Passport' },
  { key: 'booking', label: 'Bookings' },
  { key: 'commerce', label: 'Orders' },
  { key: 'subscription', label: 'Subscriptions' },
  { key: 'consent', label: 'Consent' },
];

function relativeTime(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

type Row = { type: 'header'; id: string; label: string } | { type: 'item'; id: string; n: AppNotification };

function group(items: AppNotification[]): Row[] {
  const rows: Row[] = [];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = startOfToday.getTime() - 6 * 86400000;
  const buckets: [string, AppNotification[]][] = [
    ['Today', items.filter((i) => new Date(i.createdAt).getTime() >= startOfToday.getTime())],
    [
      'This week',
      items.filter((i) => {
        const t = new Date(i.createdAt).getTime();
        return t < startOfToday.getTime() && t >= weekAgo;
      }),
    ],
    ['Earlier', items.filter((i) => new Date(i.createdAt).getTime() < weekAgo)],
  ];
  buckets.forEach(([label, list]) => {
    if (list.length === 0) return;
    rows.push({ type: 'header', id: `h-${label}`, label });
    list.forEach((n) => rows.push({ type: 'item', id: n.id, n }));
  });
  return rows;
}

export function NotificationCenterScreen() {
  const nav = useNavigation<NavigationProp<ParamListBase>>();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const items = useSelector(selectFilteredNotifications);
  const filter = useSelector(selectNotificationFilter);
  const unread = useSelector(selectUnreadCount);
  const rows = useMemo(() => group(items), [items]);

  const open = (n: AppNotification) => {
    dispatch(notificationRead(n.id));
    if (n.target) {
      nav.navigate(n.target.screen, n.target.params);
    }
  };

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'All caught up'}
        onBack={() => nav.goBack()}
        right={
          unread > 0 ? (
            <Button label="Mark all read" size="sm" variant="ghost" onPress={() => dispatch(allNotificationsRead())} />
          ) : undefined
        }
      />
      <View style={{ height: 52 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
          accessibilityRole="tablist"
        >
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => dispatch(notificationFilterChanged(f.key))}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  minHeight: 36,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  justifyContent: 'center',
                  backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
                }}
              >
                <AppText variant="label" style={{ color: active ? '#ffffff' : theme.colors.text }}>
                  {f.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 10 }}
        ListEmptyComponent={
          <EmptyState title="Nothing here" description="New alerts will appear as your pets and agents act." />
        }
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            return (
              <AppText variant="label" muted className="mt-2 uppercase" accessibilityRole="header">
                {row.label}
              </AppText>
            );
          }
          const n = row.n;
          return (
            <Pressable
              onPress={() => open(n)}
              onLongPress={() => dispatch(notificationDismissed(n.id))}
              accessibilityRole="button"
              accessibilityLabel={`${n.read ? '' : 'Unread. '}${n.title}. ${n.body}. ${relativeTime(n.createdAt)}`}
              accessibilityHint={n.target ? 'Opens the related screen. Long press to dismiss.' : 'Long press to dismiss.'}
            >
              <Card className="flex-row" style={{ gap: 12, opacity: n.read ? 0.82 : 1 }}>
                <IconBadge name={CATEGORY_ICON[n.category]} tone={SEVERITY_TONE[n.severity]} />
                <View className="flex-1" style={{ gap: 2 }}>
                  <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                    <AppText variant="label" className="flex-1" numberOfLines={1}>
                      {n.title}
                    </AppText>
                    {!n.read && (
                      <View
                        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary }}
                      />
                    )}
                  </View>
                  <AppText variant="caption" muted>
                    {n.body}
                  </AppText>
                  <AppText variant="caption" muted>
                    {relativeTime(n.createdAt)}
                  </AppText>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
