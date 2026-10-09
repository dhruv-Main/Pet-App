import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AppText, Button, EmptyState, Icon } from '@components/ui';
import type { IconName } from '@components/ui';
import { ScreenHeader } from '@components/platform';
import { RemoteImage } from '@components/media';
import { Reveal } from '@components/premium';
import { emitOrderPlaced } from '@platform/events';
import { productAsset } from '@services/media/imageService';
import { useProducts, usePet } from '@services/data';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { selectCartItems, selectCartSubtotal, clearCart } from './cartSlice';
import { useRequireAuth } from '@features/auth/useRequireAuth';
import { ShopProductCard } from '@features/commerce/components/ShopProductCard';
import { HRail, hashOf } from '@features/shared/DetailKit';
import { Divider, Panel, SectionTitle, SuccessBurst, SummaryRow, Timeline, TrustStrip, dateIn, inr } from '@features/shared/CommerceKit';
import type { CartItem } from '@apptypes/domain';

const PAYMENT_METHODS: Array<{ id: string; icon: IconName; hint: string }> = [
  { id: 'UPI', icon: 'phone', hint: 'Pay instantly with any UPI app' },
  { id: 'Card', icon: 'card', hint: 'Credit or debit card' },
  { id: 'Cash on delivery', icon: 'wallet', hint: 'Pay when it arrives' },
  { id: 'Petco Wallet', icon: 'gift', hint: 'Use your wallet balance' },
];
const ADDRESS = '42, MG Road, Bengaluru 560001';
const FREE_DELIVERY_AT = 499;

interface PlacedOrder {
  id: string;
  items: CartItem[];
  subtotal: number;
  mrpTotal: number;
  delivery: number;
  total: number;
  method: string;
}

export function CheckoutScreen() {
  const nav = useNavigation();
  const { requireAuth } = useRequireAuth();
  const dispatch = useAppDispatch();
  const subtotal = useAppSelector(selectCartSubtotal);
  const items = useAppSelector(selectCartItems);
  const pet = usePet().data;
  const all = useProducts().data;
  const delivery = subtotal > FREE_DELIVERY_AT ? 0 : 49;
  const total = subtotal + delivery;
  const mrpTotal = items.reduce((s, i) => s + i.product.mrp * i.quantity, 0);
  const saved = Math.max(0, mrpTotal - subtotal);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [method, setMethod] = useState(PAYMENT_METHODS[0].id);
  const submitting = useRef(false);
  const petName = pet?.name ?? 'your pet';

  const placeOrder = useCallback(() => {
    if (submitting.current || items.length === 0) return;
    submitting.current = true;
    const id = `ord_${Date.now().toString(36)}`;
    emitOrderPlaced({ orderId: id, total, itemCount: items.reduce((n, i) => n + i.quantity, 0) });
    setPlaced({ id, items, subtotal, mrpTotal, delivery, total, method });
    dispatch(clearCart());
    AccessibilityInfo.announceForAccessibility('Order placed');
  }, [items, total, subtotal, mrpTotal, delivery, method, dispatch]);

  const goTab = (tab: string, screen: string) =>
    (nav as unknown as { navigate: (n: string, p?: object) => void }).navigate(tab, { screen });
  const open = (id: string) => (nav as unknown as { navigate: (n: string, p?: object) => void }).navigate('ProductDetail', { productId: id });

  const picks = useMemo(() => {
    const bought = new Set((placed?.items ?? items).map((i) => i.product.id));
    return all.filter((p) => !bought.has(p.id)).sort((a, b) => hashOf(b.id + petName) - hashOf(a.id + petName)).slice(0, 8);
  }, [all, items, placed, petName]);

  if (placed) {
    const n = placed.items.reduce((s, i) => s + i.quantity, 0);
    const mrpSaved = Math.max(0, placed.mrpTotal - placed.subtotal);
    return (
      <SafeAreaView className="flex-1 bg-surface-light-2 dark:bg-surface-dark" edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <LinearGradient colors={['#052e16', '#15803d', '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 56, paddingBottom: 36, paddingHorizontal: 24, alignItems: 'center', gap: 6, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
            <SuccessBurst />
            <View style={{ marginTop: -40 }}>
              <AppText accessibilityRole="header" center style={{ color: '#ffffff', fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 }}>
                Order confirmed
              </AppText>
            </View>
            <AppText center style={{ color: 'rgba(255,255,255,0.85)' }}>
              Thank you. {petName === 'your pet' ? 'Your pet' : petName} is going to love it.
            </AppText>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 }}>
                <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Order number
                </AppText>
                <AppText variant="label" style={{ color: '#ffffff' }} selectable>
                  {placed.id.replace('ord_', '#').toUpperCase()}
                </AppText>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 }}>
                <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Estimated delivery
                </AppText>
                <AppText variant="label" style={{ color: '#ffffff' }}>
                  {dateIn(2)}
                </AppText>
              </View>
            </View>
          </LinearGradient>

          <View style={{ padding: 20, gap: 16 }}>
            <Reveal index={1}>
              <Panel>
                <SectionTitle eyebrow="What happened" title="Order progress" />
                <Timeline
                  steps={[
                    { title: 'Order placed', body: 'We have received your order.', done: true },
                    { title: 'Packed', body: 'Your items are packed with care, usually within a day.', done: false },
                    { title: 'Shipped', body: 'On its way, with tracking updates.', done: false },
                    { title: 'Delivered', body: `Expected by ${dateIn(2)}.`, done: false },
                  ]}
                />
              </Panel>
            </Reveal>

            <Panel style={{ gap: 12 }}>
              <SectionTitle eyebrow="What happens next" title="We will keep you posted" />
              {([
                ['bell', 'Updates as it moves', 'You will get a notification at every step.'],
                ['truck', 'Delivery to your door', `Arriving ${dateIn(2)} at ${ADDRESS}.`],
                ['undo', 'Easy returns', 'Not right? Return within 7 days, free.'],
              ] as Array<[IconName, string, string]>).map(([icon, t, b]) => (
                <View key={t} className="flex-row" style={{ gap: 12 }}>
                  <Icon name={icon} size={18} color="#1865f5" />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">{t}</AppText>
                    <AppText variant="caption" muted>
                      {b}
                    </AppText>
                  </View>
                </View>
              ))}
            </Panel>

            <Panel style={{ gap: 6 }}>
              <SectionTitle title={`Order summary (${n} ${n === 1 ? 'item' : 'items'})`} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
                {placed.items.map(({ product: p, quantity }) => (
                  <View key={p.id} style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden' }} accessible accessibilityLabel={`${p.title}, quantity ${quantity}`}>
                    <RemoteImage asset={productAsset(p.id, p.title)} fill />
                  </View>
                ))}
              </ScrollView>
              <SummaryRow label="Subtotal" value={inr(placed.mrpTotal)} />
              {mrpSaved > 0 && <SummaryRow label="Discounts" value={`- ${inr(mrpSaved)}`} tone="success" />}
              <SummaryRow label="Delivery" value={placed.delivery === 0 ? 'FREE' : inr(placed.delivery)} tone={placed.delivery === 0 ? 'success' : undefined} />
              <Divider />
              <SummaryRow strong label="Total paid" value={inr(placed.total)} />
              <View className="flex-row items-center" style={{ gap: 8, marginTop: 8 }}>
                <Icon name="card" size={16} color="#6b7390" />
                <AppText variant="caption" muted>
                  Payment: {placed.method}
                </AppText>
              </View>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Icon name="pin" size={16} color="#6b7390" />
                <AppText variant="caption" muted style={{ flex: 1 }}>
                  Delivering to {ADDRESS}
                </AppText>
              </View>
            </Panel>

            <View style={{ gap: 10 }}>
              <Button label="Track my orders" fullWidth size="lg" onPress={() => goTab('HomeTab', 'Orders')} />
              <Button label="Continue shopping" variant="secondary" fullWidth onPress={() => (nav as unknown as { navigate: (n: string) => void }).navigate('Catalog')} />
              <Button label="Book a vet consultation" variant="secondary" fullWidth onPress={() => goTab('ServicesTab', 'ServicesHome')} />
            </View>
          </View>

          {picks.length > 0 && (
            <View>
              <View style={{ paddingHorizontal: 20 }}>
                <SectionTitle eyebrow="Pet OS" title={`More for ${petName}`} />
              </View>
              <HRail>
                {picks.map((p) => (
                  <ShopProductCard key={p.id} product={p} width={158} onPress={() => open(p.id)} />
                ))}
              </HRail>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark">
        <ScreenHeader title="Checkout" onBack={nav.canGoBack() ? () => nav.goBack() : undefined} />
        <EmptyState title="Nothing to check out" description="Your cart is empty." actionLabel="Back to cart" onAction={() => nav.goBack()} />
      </SafeAreaView>
    );
  }

  const points = Math.floor(total / 10);

  return (
    <SafeAreaView className="flex-1 bg-surface-light-2 dark:bg-surface-dark" edges={['bottom']}>
      <ScreenHeader title="Checkout" subtitle="Secure checkout" onBack={nav.canGoBack() ? () => nav.goBack() : undefined} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }}>
        {/* Steps */}
        <View className="flex-row items-center" style={{ gap: 8 }} accessible accessibilityLabel="Step 2 of 3, review and pay">
          {['Cart', 'Review and pay', 'Done'].map((s, i) => (
            <View key={s} style={{ flex: 1, gap: 6 }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: i < 2 ? '#1865f5' : 'rgba(107,115,144,0.25)' }} />
              <AppText variant="caption" muted={i !== 1} style={i === 1 ? { fontWeight: '700' } : undefined}>
                {s}
              </AppText>
            </View>
          ))}
        </View>

        {/* Delivery */}
        <Panel style={{ gap: 12 }}>
          <View className="flex-row items-center justify-between">
            <SectionTitle eyebrow="Delivery" title="Address" />
            <Icon name="pin" size={20} color="#1865f5" />
          </View>
          <View style={{ marginTop: -8, gap: 2 }}>
            <AppText variant="label">Home</AppText>
            <AppText muted>{ADDRESS}</AppText>
          </View>
          <Divider />
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <Icon name="truck" size={18} color="#16a34a" />
            <View style={{ flex: 1 }}>
              <AppText variant="label">Estimated delivery {dateIn(2)}</AppText>
              <AppText variant="caption" muted>
                {delivery === 0 ? 'Free delivery with Prime' : `Delivery ${inr(delivery)}. Free above ${inr(FREE_DELIVERY_AT + 1)}`}
              </AppText>
            </View>
          </View>
        </Panel>

        {/* Payment */}
        <Panel style={{ gap: 4 }} accessibilityRole="radiogroup">
          <SectionTitle eyebrow="Payment" title="Payment method" />
          {PAYMENT_METHODS.map((m) => {
            const selected = m.id === method;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMethod(m.id)}
                accessibilityRole="radio"
                accessibilityLabel={`${m.id}. ${m.hint}`}
                accessibilityState={{ selected, checked: selected }}
                className="flex-row items-center"
                style={{
                  gap: 12,
                  minHeight: 60,
                  paddingHorizontal: 12,
                  borderRadius: 18,
                  marginBottom: 8,
                  borderWidth: 1.5,
                  borderColor: selected ? '#1865f5' : 'rgba(107,115,144,0.18)',
                  backgroundColor: selected ? 'rgba(24,101,245,0.06)' : 'transparent',
                }}
              >
                <Icon name={m.icon} size={20} color={selected ? '#1865f5' : '#6b7390'} />
                <View style={{ flex: 1 }}>
                  <AppText variant="label">{m.id}</AppText>
                  <AppText variant="caption" muted>
                    {m.hint}
                  </AppText>
                </View>
                <Icon name={selected ? 'check-circle' : 'dot'} size={22} color={selected ? '#1865f5' : '#9ca3af'} />
              </Pressable>
            );
          })}
        </Panel>

        {/* Items */}
        <Panel style={{ gap: 12 }}>
          <SectionTitle eyebrow="Review" title={`Items (${count})`} />
          {items.map(({ product: p, quantity }) => (
            <View key={p.id} className="flex-row items-center" style={{ gap: 12 }}>
              <View style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden' }}>
                <RemoteImage asset={productAsset(p.id, p.title)} fill />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="label" numberOfLines={2}>
                  {p.title}
                </AppText>
                <AppText variant="caption" muted>
                  Qty {quantity}
                </AppText>
              </View>
              <AppText variant="label">{inr(p.price * quantity)}</AppText>
            </View>
          ))}
        </Panel>

        {/* Rewards + Prime */}
        <LinearGradient colors={['#1f1147', '#5b21b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 16, gap: 10 }}>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Icon name="sparkles" size={16} color="#fbbf24" />
            <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Rewards and Prime
            </AppText>
          </View>
          <AppText variant="h3" style={{ color: '#ffffff' }}>
            Earn about {points} reward points on this order
          </AppText>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {delivery === 0 ? 'Prime free delivery is applied.' : 'Spend a little more to unlock free Prime delivery.'}
          </AppText>
        </LinearGradient>

        {/* Summary */}
        <Panel style={{ gap: 6 }}>
          <SectionTitle title="Order summary" />
          <SummaryRow label="Subtotal" value={inr(mrpTotal)} />
          {saved > 0 && <SummaryRow label="Savings" value={`- ${inr(saved)}`} tone="success" />}
          <SummaryRow label="Delivery" value={delivery === 0 ? 'FREE' : inr(delivery)} tone={delivery === 0 ? 'success' : undefined} />
          <SummaryRow label="Taxes" value="Included" />
          <Divider />
          <SummaryRow strong label="Total" value={inr(total)} />
          {saved > 0 && (
            <View className="flex-row items-center" style={{ gap: 6, marginTop: 6 }}>
              <Icon name="check-circle" size={14} color="#16a34a" />
              <AppText variant="caption" style={{ color: '#16a34a', fontWeight: '700' }}>
                You save {inr(saved)} on this order
              </AppText>
            </View>
          )}
        </Panel>

        <TrustStrip />
      </ScrollView>

      <View style={{ padding: 14, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(107,115,144,0.16)' }} className="bg-white dark:bg-surface-dark-2">
        <View className="flex-row items-center justify-between">
          <AppText variant="caption" muted>
            Pay with {method}
          </AppText>
          <AppText variant="h3">{inr(total)}</AppText>
        </View>
        <Button label={`Place order · ${inr(total)}`} fullWidth size="lg" onPress={() => requireAuth(placeOrder, 'Sign in to place your order. Your cart will be saved.')} />
        <View className="flex-row items-center justify-center" style={{ gap: 6 }}>
          <Icon name="lock" size={12} color="#6b7390" />
          <AppText variant="caption" muted>
            Secure payments. Easy returns.
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}
