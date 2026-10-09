import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppText, Badge, Card, IconBadge, SectionHeader } from '@components/ui';
import { ScreenHeader } from '@components/platform';
import { useLoyalty, useOrders } from '@services/data';
import { mockSubscriptions } from '@services/mock/platformFixtures';
import { formatDay } from '@/demo/demoData';

const statusTone: Record<string, 'success' | 'primary' | 'warning' | 'neutral'> = {
  delivered: 'success',
  shipped: 'primary',
  out_for_delivery: 'primary',
  processing: 'warning',
  cancelled: 'neutral',
};

export function OrdersScreen() {
  const nav = useNavigation();
  const orders = useOrders().data;
  const loyalty = useLoyalty().data;

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader title="Orders and rewards" subtitle="Purchases, subscriptions and points" onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <SectionHeader title="Subscriptions" />
        <View className="px-5" style={{ gap: 10 }}>
          {mockSubscriptions.map((s) => (
            <Card key={s.id} className="flex-row items-center" style={{ gap: 12 }}>
              <IconBadge name="repeat" tone={s.status === 'paused' ? 'neutral' : 'primary'} />
              <View style={{ flex: 1 }}>
                <AppText variant="label">{s.title}</AppText>
                <AppText variant="caption" muted>
                  {s.status === 'paused' ? 'Paused' : `Next shipment ${s.nextShipment}`}
                </AppText>
              </View>
              <AppText variant="label">{'\u20b9'}{s.amount.toLocaleString('en-IN')}</AppText>
            </Card>
          ))}
        </View>

        <SectionHeader title="Order history" />
        <View className="px-5" style={{ gap: 10 }}>
          {orders.map((o) => (
            <Card key={o.id} style={{ gap: 6 }}>
              <View className="flex-row items-center justify-between">
                <AppText variant="label">{o.number}</AppText>
                <Badge label={o.status.replace(/_/g, ' ')} tone={statusTone[o.status] ?? 'neutral'} />
              </View>
              {o.items.map((i) => (
                <AppText key={i.productId} variant="caption" muted numberOfLines={1}>
                  {i.quantity} x {i.title}
                </AppText>
              ))}
              <View className="flex-row items-center justify-between">
                <AppText variant="caption" muted>
                  Placed {formatDay(o.placedAt)} | {o.paymentMethod}
                </AppText>
                <AppText variant="label">{'\u20b9'}{o.total.toLocaleString('en-IN')}</AppText>
              </View>
            </Card>
          ))}
        </View>

        <SectionHeader title={`Rewards: ${loyalty.points.toLocaleString('en-IN')} points`} />
        <View className="px-5" style={{ gap: 10 }}>
          {loyalty.history.map((h) => (
            <Card key={h.id} className="flex-row items-center" style={{ gap: 12 }}>
              <View style={{ flex: 1 }}>
                <AppText variant="label">{h.reason}</AppText>
                <AppText variant="caption" muted>
                  {formatDay(h.date)}
                </AppText>
              </View>
              <Badge label={`${h.delta > 0 ? '+' : ''}${h.delta}`} tone={h.delta > 0 ? 'success' : 'neutral'} />
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
