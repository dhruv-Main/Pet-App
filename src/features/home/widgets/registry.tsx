import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AgentAction, TwinSnapshot } from '@apptypes/platform';
import type { Pet, Product, User } from '@apptypes/domain';
import type { HomeStackParamList } from '@navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@theme/tokens';
import { PressableScale } from '@components/premium';
import { AppText, Badge, Card, Icon, IconBadge, SectionHeader, Skeleton } from '@components/ui';
import type { IconName } from '@components/ui';
import { AgentActionCard, RiskIndicator, VerificationChip, riskLabel } from '@components/platform';
import { SpendingAnalytics, SubscriptionAnalytics } from '@components/analytics';
import type { PassportPayload } from '@services/api/platformApi';
import {
  mockActiveServices,
  mockMonthlySpend,
  mockSpendByCategory,
  mockSubscriptions,
} from '@services/mock/platformFixtures';
import { mockReminders } from '@services/mock/fixtures';
import { useLoyalty, useOrders, usePrime, useProducts } from '@services/data';
import { useAppSelector } from '@store/hooks';
import { selectNotifications } from '@features/notifications/notificationsSlice';
import { formatDay, formatFullDate, formatWhen } from '@/demo/demoData';
import { ProductCard } from '@features/commerce/components/ProductCard';
import type { FlagKey } from '@platform/config/featureFlags';
import type { WidgetId } from '../dashboardSlice';

export interface WidgetContext {
  nav: NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>;
  pet: Pet;
  user: User;
  pending: AgentAction[];
  twin: { data?: TwinSnapshot; isLoading: boolean; isError: boolean; refetch: () => void };
  passport: { data?: PassportPayload };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export interface WidgetDefinition {
  id: WidgetId;
  title: string;
  description: string;
  flag?: FlagKey;
  Component: React.ComponentType<{ ctx: WidgetContext }>;
}

const reminderIcon: Record<string, IconName> = {
  medicine: 'pill',
  vaccine: 'syringe',
  vet_visit: 'stethoscope',
  feeding: 'utensils',
};

const serviceIcon: Record<string, IconName> = {
  vet: 'stethoscope',
  grooming: 'scissors',
  walking: 'footprints',
  training: 'paw',
  boarding: 'building',
  taxi: 'car',
};

const orderTone: Record<string, 'success' | 'primary' | 'warning' | 'neutral'> = {
  delivered: 'success',
  shipped: 'primary',
  out_for_delivery: 'primary',
  processing: 'warning',
  cancelled: 'neutral',
};

const notificationIcon: Record<string, IconName> = {
  health: 'heart-pulse',
  passport: 'fingerprint',
  agent: 'bot',
  booking: 'calendar',
  commerce: 'package',
  subscription: 'repeat',
  consent: 'shield',
};

function InfoRow({
  icon,
  tone,
  title,
  caption,
  badge,
  badgeTone,
}: {
  icon: IconName;
  tone: React.ComponentProps<typeof IconBadge>['tone'];
  title: string;
  caption?: string;
  badge?: string;
  badgeTone?: React.ComponentProps<typeof Badge>['tone'];
}) {
  return (
    <Card className="flex-row items-center" style={{ gap: 14, minHeight: 76 }}>
      <IconBadge name={icon} tone={tone} size={44} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="label" numberOfLines={1}>
          {title}
        </AppText>
        {caption ? (
          <AppText variant="caption" muted numberOfLines={2}>
            {caption}
          </AppText>
        ) : null}
      </View>
      {badge ? <Badge label={badge} tone={badgeTone ?? (tone as React.ComponentProps<typeof Badge>['tone'])} /> : null}
    </Card>
  );
}

function TwinWidget({ ctx }: { ctx: WidgetContext }) {
  const { twin, nav, pet } = ctx;
  const topFactors = twin.data ? [...twin.data.risk.factors].sort((a, b) => b.score - a.score).slice(0, 3) : [];
  return (
    <View>
      <SectionHeader
        title="Twin health summary"
        actionLabel="Details"
        onAction={() => nav.navigate('TwinDashboard', { petId: pet.id })}
      />
      <View className="px-5">
        <Card style={{ gap: 14 }}>
          {twin.isLoading && (
            <View style={{ gap: 10 }}>
              <Skeleton height={14} width="40%" />
              <Skeleton height={8} />
              <Skeleton height={8} />
            </View>
          )}
          {twin.isError && (
            <Pressable onPress={twin.refetch} accessibilityRole="button" accessibilityLabel="Twin data unavailable. Retry.">
              <AppText muted>Twin data unavailable. Tap to retry.</AppText>
            </Pressable>
          )}
          {twin.data && (
            <>
              <View className="flex-row items-center" style={{ gap: 14 }}>
                <IconBadge name="brain" tone={twin.data.risk.level === 'low' ? 'success' : twin.data.risk.level === 'high' ? 'danger' : 'warning'} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="label">{pet.name}'s Digital Twin</AppText>
                  <AppText variant="caption" muted>
                    Confidence {Math.round(twin.data.risk.confidence * 100)}%
                  </AppText>
                </View>
                <Badge
                  label={`${riskLabel[twin.data.risk.level]} risk`}
                  tone={twin.data.risk.level === 'low' ? 'success' : twin.data.risk.level === 'high' ? 'danger' : 'warning'}
                />
              </View>
              {topFactors.map((f) => (
                <RiskIndicator key={f.key} level={f.level} score={f.score} label={f.label} confidence={f.confidence} />
              ))}
            </>
          )}
        </Card>
      </View>
    </View>
  );
}

function AgentWidget({ ctx }: { ctx: WidgetContext }) {
  const { pending, nav, onApprove, onReject } = ctx;
  return (
    <View>
      <SectionHeader title="Agent suggestions" actionLabel="Agent Center" onAction={() => nav.navigate('AgentCenter')} />
      <View className="px-5" style={{ gap: 10 }}>
        {pending.length === 0 && (
          <Card>
            <AppText muted>No pending suggestions.</AppText>
          </Card>
        )}
        {pending.slice(0, 2).map((a) => (
          <AgentActionCard
            key={a.id}
            action={a}
            compact
            onApprove={() => onApprove(a.id)}
            onReject={() => onReject(a.id)}
          />
        ))}
      </View>
    </View>
  );
}

function UpcomingWidget({ ctx }: { ctx: WidgetContext }) {
  const upcoming = mockReminders
    .filter((r) => r.petId === ctx.pet.id && !r.completed)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 4);
  return (
    <View>
      <SectionHeader title="Upcoming actions" />
      <View className="px-5" style={{ gap: 10 }}>
        {upcoming.length === 0 && (
          <Card>
            <AppText muted>Nothing scheduled for {ctx.pet.name}. Enjoy the calm.</AppText>
          </Card>
        )}
        {upcoming.map((r) => (
          <InfoRow
            key={r.id}
            icon={reminderIcon[r.type] ?? 'clock'}
            tone={r.type === 'vaccine' ? 'danger' : 'primary'}
            title={r.title}
            caption={formatWhen(r.dueAt)}
            badge={r.type.replace('_', ' ')}
          />
        ))}
      </View>
    </View>
  );
}

function VaccinationsWidget({ ctx }: { ctx: WidgetContext }) {
  const { pet, nav } = ctx;
  const due = pet.vaccinations
    .filter((v) => v.status !== 'completed')
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const lastDone = pet.vaccinations
    .filter((v) => v.status === 'completed' && v.administeredAt)
    .sort((a, b) => (b.administeredAt ?? '').localeCompare(a.administeredAt ?? ''))[0];
  return (
    <View>
      <SectionHeader
        title="Upcoming vaccinations"
        actionLabel="Records"
        onAction={() => nav.navigate('PetProfile', { petId: pet.id })}
      />
      <View className="px-5" style={{ gap: 10 }}>
        {due.length === 0 && (
          <InfoRow
            icon="check-circle"
            tone="success"
            title="All vaccinations are up to date"
            caption={lastDone?.administeredAt ? `Last given: ${lastDone.name} on ${formatFullDate(lastDone.administeredAt)}` : undefined}
          />
        )}
        {due.map((v) => (
          <InfoRow
            key={v.id}
            icon="syringe"
            tone={v.status === 'overdue' ? 'danger' : 'warning'}
            title={v.name}
            caption={`${v.status === 'overdue' ? 'Was due' : 'Due'} ${formatFullDate(v.dueAt)}`}
            badge={v.status === 'overdue' ? 'Overdue' : 'Upcoming'}
          />
        ))}
      </View>
    </View>
  );
}

function OrdersWidget() {
  const orders = useOrders().data.slice(0, 3);
  return (
    <View>
      <SectionHeader title="Recent orders" />
      <View className="px-5" style={{ gap: 10 }}>
        {orders.map((o) => (
          <Card key={o.id} style={{ gap: 6 }}>
            <View className="flex-row items-center justify-between">
              <AppText variant="label">{o.number}</AppText>
              <Badge label={o.status.replace(/_/g, ' ')} tone={orderTone[o.status] ?? 'neutral'} />
            </View>
            <AppText variant="caption" muted numberOfLines={2}>
              {o.items.map((i) => (i.quantity > 1 ? `${i.quantity} x ${i.title}` : i.title)).join(', ')}
            </AppText>
            <View className="flex-row items-center justify-between">
              <AppText variant="caption" muted>
                {o.deliveredAt
                  ? `Delivered ${formatDay(o.deliveredAt)}`
                  : o.estimatedDelivery
                    ? `Arriving ${formatDay(o.estimatedDelivery)}`
                    : `Placed ${formatDay(o.placedAt)}`}
              </AppText>
              <AppText variant="label">₹{o.total.toLocaleString('en-IN')}</AppText>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

function PrimeWidget() {
  const prime = usePrime().data;
  const loyalty = useLoyalty().data;
  const progress = Math.min(1, loyalty.points / (loyalty.points + loyalty.pointsToNextTier));
  return (
    <View>
      <SectionHeader title="Pet Prime" />
      <View className="px-5" style={{ gap: 10 }}>
        <Card style={{ gap: 8 }}>
          <View className="flex-row items-center justify-between">
            <AppText variant="label">{prime.plan}</AppText>
            <Badge label={prime.status === 'active' ? 'Active' : prime.status} tone="premium" />
          </View>
          <AppText variant="caption" muted>
            Member since {formatFullDate(prime.memberSince)} | Renews {formatFullDate(prime.renewsOn)}
          </AppText>
          <View className="flex-row" style={{ gap: 16 }}>
            <View>
              <AppText variant="h3">₹{prime.savingsToDate.toLocaleString('en-IN')}</AppText>
              <AppText variant="caption" muted>
                Saved so far
              </AppText>
            </View>
            <View>
              <AppText variant="h3">{prime.freeDeliveries}</AppText>
              <AppText variant="caption" muted>
                Free deliveries
              </AppText>
            </View>
            <View>
              <AppText variant="h3">{prime.teleconsultsRemaining}</AppText>
              <AppText variant="caption" muted>
                Teleconsults left
              </AppText>
            </View>
          </View>
        </Card>
        <Card style={{ gap: 8 }}>
          <View className="flex-row items-center justify-between">
            <AppText variant="label">{loyalty.tier} tier</AppText>
            <AppText variant="label">{loyalty.points.toLocaleString('en-IN')} pts</AppText>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(107,115,144,0.2)', overflow: 'hidden' }}>
            <View style={{ height: 8, width: `${Math.round(progress * 100)}%`, backgroundColor: '#1865f5' }} />
          </View>
          <AppText variant="caption" muted>
            {loyalty.pointsToNextTier} points to {loyalty.nextTier}
          </AppText>
        </Card>
      </View>
    </View>
  );
}

function NotificationsWidget({ ctx }: { ctx: WidgetContext }) {
  const items = useAppSelector(selectNotifications).slice(0, 3);
  return (
    <View>
      <SectionHeader title="Notifications" actionLabel="See all" onAction={() => ctx.nav.navigate('Notifications')} />
      <View className="px-5" style={{ gap: 10 }}>
        {items.length === 0 && (
          <Card>
            <AppText muted>You are all caught up.</AppText>
          </Card>
        )}
        {items.map((n) => (
          <InfoRow
            key={n.id}
            icon={notificationIcon[n.category] ?? 'bell'}
            tone={n.severity === 'critical' ? 'danger' : n.severity === 'attention' ? 'warning' : 'primary'}
            title={n.title}
            caption={n.body}
            badge={n.read ? undefined : 'New'}
            badgeTone="primary"
          />
        ))}
      </View>
    </View>
  );
}

function ServicesWidget() {
  return (
    <View>
      <SectionHeader title="Active services" />
      <View className="px-5" style={{ gap: 10 }}>
        {mockActiveServices.map((s) => (
          <Card key={s.id} className="flex-row items-center" style={{ gap: 12 }}>
            <IconBadge name={serviceIcon[s.kind]} tone="success" />
            <View style={{ flex: 1 }}>
              <AppText variant="label">{s.title}</AppText>
              <AppText variant="caption" muted>
                {s.provider}, {s.when}
                {s.petName ? ` | ${s.petName}` : ''}
              </AppText>
            </View>
            <Badge
              label={s.status === 'in_progress' ? 'In progress' : 'Confirmed'}
              tone={s.status === 'in_progress' ? 'primary' : 'success'}
            />
          </Card>
        ))}
      </View>
    </View>
  );
}

function SpendingWidget() {
  return (
    <View>
      <SectionHeader title="Spending" />
      <View className="px-5">
        <SpendingAnalytics monthly={mockMonthlySpend} categories={mockSpendByCategory} />
      </View>
    </View>
  );
}

function SubscriptionsWidget() {
  return (
    <View>
      <SectionHeader title="Subscriptions" />
      <View className="px-5" style={{ gap: 10 }}>
        <SubscriptionAnalytics subscriptions={mockSubscriptions} />
        {mockSubscriptions.map((s) => (
          <Card key={s.id} className="flex-row items-center" style={{ gap: 12 }}>
            <IconBadge name="repeat" />
            <View style={{ flex: 1 }}>
              <AppText variant="label">{s.title}</AppText>
              <AppText variant="caption" muted>
                {s.status === 'paused' ? 'Paused' : `Next shipment ${s.nextShipment}`}
              </AppText>
            </View>
            <AppText variant="label">INR {s.amount.toLocaleString('en-IN')}</AppText>
          </Card>
        ))}
      </View>
    </View>
  );
}

const RECOMMENDED_CARD_WIDTH = 170;

function RecommendedWidget({ ctx }: { ctx: WidgetContext }) {
  const { nav } = ctx;
  const { data: products } = useProducts();
  const renderItem = React.useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        width={RECOMMENDED_CARD_WIDTH}
        onPress={() => nav.navigate('ProductDetail', { productId: item.id })}
      />
    ),
    [nav],
  );
  return (
    <View>
      <SectionHeader
        title="Recommended purchases"
        actionLabel="Shop all"
        onAction={() => nav.getParent()?.navigate('ShopTab' as never)}
      />
      <FlatList
        horizontal
        data={products}
        keyExtractor={(p) => p.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        renderItem={renderItem}
        initialNumToRender={3}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

function IdentityWidget({ ctx }: { ctx: WidgetContext }) {
  const { nav, pet, passport, user } = ctx;
  return (
    <View>
      <SectionHeader title="Identity and loyalty" />
      <View className="px-5" style={{ gap: 10 }}>
        <Pressable
          onPress={() => nav.navigate('Passport', { petId: pet.id })}
          accessibilityRole="button"
          accessibilityLabel="Open Pet Passport"
        >
          <Card className="flex-row items-center" style={{ gap: 12 }}>
            <IconBadge name="fingerprint" />
            <View style={{ flex: 1 }}>
              <AppText variant="label">Pet Passport</AppText>
              <AppText variant="caption" muted>
                {passport.data?.identity.passportId ?? 'Loading'}
              </AppText>
            </View>
            {passport.data && <VerificationChip status={passport.data.identity.status} />}
          </Card>
        </Pressable>
        <Card className="flex-row items-center" style={{ gap: 12 }}>
          <IconBadge name="gift" tone="warning" />
          <View style={{ flex: 1 }}>
            <AppText variant="label">{user.isPrime ? 'Pet Prime member' : 'Standard member'}</AppText>
            <AppText variant="caption" muted>
              {user.loyaltyPoints.toLocaleString('en-IN')} reward points
            </AppText>
          </View>
        </Card>
      </View>
    </View>
  );
}

function InsightsWidget({ ctx }: { ctx: WidgetContext }) {
  const { twin, nav } = ctx;
  const top = twin.data?.insights[0];
  return (
    <View className="px-5">
      {twin.isLoading && <Skeleton height={150} radius={28} />}
      {top && (
        <LinearGradient
          colors={gradients.twilight}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 28, padding: 20, gap: 12, overflow: 'hidden' }}
        >
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkles" size={16} color="#ffffff" />
            </View>
            <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Pet AI insight
            </AppText>
          </View>
          <AppText variant="h2" style={{ color: '#ffffff' }}>
            {top.title}
          </AppText>
          <AppText style={{ color: 'rgba(255,255,255,0.85)' }} numberOfLines={3}>
            {top.summary}
          </AppText>
          <PressableScale
            onPress={() => nav.navigate('AiAssistant')}
            accessibilityRole="button"
            accessibilityLabel="Ask Pet AI about this insight"
            style={{ alignSelf: 'flex-start', backgroundColor: '#ffffff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <AppText variant="label" style={{ color: '#3b2bb5' }}>
              Ask Pet AI
            </AppText>
          </PressableScale>
        </LinearGradient>
      )}
    </View>
  );
}

function MiniBars({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <View className="flex-row items-end" style={{ gap: 4, height: 36 }}>
      {values.map((v, i) => (
        <View key={i} style={{ flex: 1, height: Math.max(4, (v / max) * 36), borderRadius: 4, backgroundColor: color, opacity: 0.35 + 0.65 * (i / values.length) }} />
      ))}
    </View>
  );
}

function Tile({
  title,
  value,
  sub,
  onPress,
  children,
  tint,
}: {
  title: string;
  value: string;
  sub?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  tint: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value}${sub ? `, ${sub}` : ''}`}
      style={{ width: '48.5%' }}
    >
      <Card style={{ gap: 6, minHeight: 138, justifyContent: 'space-between' }}>
        <AppText variant="eyebrow" style={{ color: tint }}>
          {title}
        </AppText>
        <View style={{ gap: 2 }}>
          <AppText variant="metric">{value}</AppText>
          {!!sub && (
            <AppText variant="caption" muted numberOfLines={1}>
              {sub}
            </AppText>
          )}
        </View>
        {children}
      </Card>
    </PressableScale>
  );
}

function CommandCenterWidget({ ctx }: { ctx: WidgetContext }) {
  const { nav, pet, twin, passport, pending, user } = ctx;
  const loyalty = useLoyalty().data;
  const notifications = useAppSelector(selectNotifications).slice(0, 3);
  const score = Math.round(twin.data?.risk.overall ?? pet.healthScore);
  const spend = mockMonthlySpend.map((m) => (typeof m === 'number' ? m : (m as { amount?: number; value?: number }).amount ?? (m as { value?: number }).value ?? 0));
  const progress = Math.min(1, loyalty.points / (loyalty.points + loyalty.pointsToNextTier));
  return (
    <View>
      <SectionHeader eyebrow="Command center" title="Everything at a glance" />
      <View className="flex-row flex-wrap px-5" style={{ gap: 10 }}>
        <Tile title="Health" value={`${score}`} sub={`${riskLabel[twin.data?.risk.level ?? 'low']} risk`} tint="#10b981" onPress={() => nav.navigate('TwinDashboard', { petId: pet.id })}>
          <MiniBars values={[60, 66, 64, 72, 78, 80, score]} color="#10b981" />
        </Tile>
        <Tile title="AI" value={`${pending.length}`} sub={pending.length === 1 ? 'action to review' : 'actions to review'} tint="#8b5cf6" onPress={() => nav.navigate('AgentCenter')}>
          <MiniBars values={[2, 4, 3, 5, 4, 6, Math.max(1, pending.length)]} color="#8b5cf6" />
        </Tile>
        <Tile title="Passport" value={passport.data ? 'Verified' : '...'} sub={passport.data?.identity.passportId} tint="#1865f5" onPress={() => nav.navigate('Passport', { petId: pet.id })}>
          {passport.data && <VerificationChip status={passport.data.identity.status} />}
        </Tile>
        <Tile title="Services" value={`${mockActiveServices.length}`} sub="active bookings" tint="#f59e0b" onPress={() => nav.getParent()?.navigate('ServicesTab' as never)}>
          <MiniBars values={[1, 2, 1, 3, 2, 2, mockActiveServices.length]} color="#f59e0b" />
        </Tile>
        <Tile title="Spending" value={`₹${(spend[spend.length - 1] ?? 0).toLocaleString('en-IN')}`} sub="this month" tint="#ef4444">
          <MiniBars values={spend.slice(-7)} color="#ef4444" />
        </Tile>
        <Tile title="Loyalty" value={loyalty.tier} sub={`${loyalty.points.toLocaleString('en-IN')} pts`} tint="#d97706">
          <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(217,119,6,0.18)', overflow: 'hidden' }}>
            <View style={{ height: 6, width: `${Math.round(progress * 100)}%`, backgroundColor: '#d97706' }} />
          </View>
        </Tile>
      </View>
      <SectionHeader eyebrow="Recent" title="Activity" actionLabel="See all" onAction={() => nav.navigate('Notifications')} />
      <View className="px-5">
        <Card style={{ gap: 14 }}>
          {notifications.length === 0 && <AppText muted>{user.name.split(' ')[0]}, you are all caught up.</AppText>}
          {notifications.map((n) => (
            <View key={n.id} className="flex-row items-center" style={{ gap: 12 }}>
              <IconBadge name={notificationIcon[n.category] ?? 'bell'} tone={n.severity === 'critical' ? 'danger' : n.severity === 'attention' ? 'warning' : 'primary'} />
              <View style={{ flex: 1 }}>
                <AppText variant="label" numberOfLines={1}>
                  {n.title}
                </AppText>
                <AppText variant="caption" muted numberOfLines={1}>
                  {n.body}
                </AppText>
              </View>
            </View>
          ))}
        </Card>
      </View>
    </View>
  );
}

export const WIDGETS: Record<WidgetId, WidgetDefinition> = {
  twin: { id: 'twin', title: 'Twin health summary', description: 'Top risk factors and confidence', Component: React.memo(TwinWidget) },
  agent: { id: 'agent', title: 'Agent suggestions', description: 'Actions waiting for approval', Component: React.memo(AgentWidget) },
  upcoming: { id: 'upcoming', title: 'Upcoming actions', description: 'Reminders and due items', Component: React.memo(UpcomingWidget) },
  vaccinations: { id: 'vaccinations', title: 'Upcoming vaccinations', description: 'Vaccines due or overdue', Component: React.memo(VaccinationsWidget) },
  orders: { id: 'orders', title: 'Recent orders', description: 'Latest purchases and deliveries', Component: React.memo(OrdersWidget) },
  prime: { id: 'prime', title: 'Pet Prime', description: 'Membership savings and rewards', Component: React.memo(PrimeWidget) },
  notifications: { id: 'notifications', title: 'Notifications', description: 'Latest alerts', Component: React.memo(NotificationsWidget) },
  services: { id: 'services', title: 'Active services', description: 'Bookings in progress', Component: React.memo(ServicesWidget) },
  spending: {
    id: 'spending',
    title: 'Spending',
    description: 'Monthly spend and categories',
    flag: 'spendingAnalytics',
    Component: React.memo(SpendingWidget),
  },
  subscriptions: {
    id: 'subscriptions',
    title: 'Subscriptions',
    description: 'Active plans and shipments',
    Component: React.memo(SubscriptionsWidget),
  },
  recommended: {
    id: 'recommended',
    title: 'Recommended purchases',
    description: 'Products picked for your pet',
    Component: React.memo(RecommendedWidget),
  },
  identity: { id: 'identity', title: 'Identity and loyalty', description: 'Passport and rewards', Component: React.memo(IdentityWidget) },
  insights: { id: 'insights', title: 'AI insights', description: 'Predictive highlights', Component: React.memo(InsightsWidget) },
  command: { id: 'command', title: 'Command center', description: 'Health, AI, passport, services, spend and loyalty', Component: React.memo(CommandCenterWidget) },
};
