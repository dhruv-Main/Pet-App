import React, { useMemo } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Button, EmptyState, Icon } from '@components/ui';
import { ScreenHeader } from '@components/platform';
import { RemoteImage } from '@components/media';
import { productAsset } from '@services/media/imageService';
import { useProducts, usePet } from '@services/data';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { selectCartItems, selectCartSubtotal, updateQuantity, removeItem } from './cartSlice';
import type { ShopStackParamList } from '@navigation/types';
import { useRequireAuth } from '@features/auth/useRequireAuth';
import { ShopProductCard } from '@features/commerce/components/ShopProductCard';
import { HRail, Pill, hashOf } from '@features/shared/DetailKit';
import { Divider, Panel, SectionTitle, SummaryRow, TrustStrip, dateIn, inr } from '@features/shared/CommerceKit';
import type { Product } from '@apptypes/domain';

type Nav = NativeStackNavigationProp<ShopStackParamList, 'Cart'>;

const FREE_DELIVERY_AT = 499;
const COMPLEMENT: Record<string, string[]> = {
  food: ['treats', 'supplements'],
  treats: ['toys', 'food'],
  toys: ['treats', 'accessories'],
  grooming: ['healthcare', 'accessories'],
  healthcare: ['supplements', 'grooming'],
  supplements: ['food', 'treats'],
  accessories: ['toys', 'treats'],
  apparel: ['accessories', 'grooming'],
  devices: ['accessories', 'healthcare'],
};

export function CartScreen() {
  const nav = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { requireAuth } = useRequireAuth();
  const { width } = useWindowDimensions();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const all = useProducts().data;
  const pet = usePet().data;
  const petName = pet?.name ?? 'your pet';

  const delivery = subtotal > FREE_DELIVERY_AT ? 0 : 49;
  const total = subtotal + delivery;
  const mrpTotal = items.reduce((s, i) => s + i.product.mrp * i.quantity, 0);
  const saved = Math.max(0, mrpTotal - subtotal);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subscribeSave = Math.round(items.filter((i) => i.product.isSubscribable).reduce((s, i) => s + i.product.price * i.quantity, 0) * 0.1);
  const remaining = Math.max(0, FREE_DELIVERY_AT + 1 - subtotal);
  const progress = Math.min(1, subtotal / (FREE_DELIVERY_AT + 1));

  const inCart = useMemo(() => new Set(items.map((i) => i.product.id)), [items]);
  const open = (id: string) => nav.navigate('ProductDetail', { productId: id });
  const score = (p: Product) => Math.min(99, 78 + (hashOf(p.id + petName) % 14));

  const together = useMemo(() => {
    const cats = new Set(items.flatMap((i) => COMPLEMENT[i.product.category] ?? []));
    return all.filter((p) => !inCart.has(p.id) && cats.has(p.category)).slice(0, 8);
  }, [all, items, inCart]);
  const forPet = useMemo(
    () => all.filter((p) => !inCart.has(p.id) && !together.includes(p)).sort((a, b) => score(b) - score(a)).slice(0, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, inCart, together, petName],
  );
  const trending = useMemo(
    () => all.filter((p) => !inCart.has(p.id)).sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8),
    [all, inCart],
  );

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark">
        <ScreenHeader title="Cart" onBack={nav.canGoBack() ? () => nav.goBack() : undefined} />
        <EmptyState
          icon={<Icon name="cart" size={36} color="#1865f5" />}
          title="Your cart is empty"
          description={`Explore food, toys and smart devices picked for ${petName}.`}
          actionLabel="Start shopping"
          onAction={() => nav.navigate('Catalog')}
        />
        {trending.length > 0 && (
          <View style={{ paddingBottom: 24 }}>
            <SectionTitle eyebrow="Popular right now" title="Trending products" />
            <HRail>
              {trending.slice(0, 6).map((p) => (
                <ShopProductCard key={p.id} product={p} width={160} onPress={() => open(p.id)} />
              ))}
            </HRail>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const checkout = () => requireAuth(() => nav.navigate('Checkout'), 'Sign in to check out. Your cart is saved.');

  return (
    <SafeAreaView className="flex-1 bg-surface-light-2 dark:bg-surface-dark" edges={['bottom']}>
      <ScreenHeader title="Cart" subtitle={`${count} ${count === 1 ? 'item' : 'items'}`} onBack={nav.canGoBack() ? () => nav.goBack() : undefined} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}>
        {/* Delivery */}
        <View style={{ paddingHorizontal: 20 }}>
          <LinearGradient colors={['#0b1b3f', '#1865f5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 18, gap: 14 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Icon name="truck" size={18} color="#ffffff" />
                <AppText variant="label" style={{ color: '#ffffff' }}>
                  Arrives {dateIn(2)}
                </AppText>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, paddingHorizontal: 10, height: 26, justifyContent: 'center' }}>
                <AppText variant="caption" style={{ color: '#ffffff', fontWeight: '700' }}>
                  {delivery === 0 ? 'FREE delivery' : `Delivery ${inr(delivery)}`}
                </AppText>
              </View>
            </View>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Icon name="pin" size={15} color="rgba(255,255,255,0.8)" />
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.88)', flex: 1 }}>
                Deliver to 42, MG Road, Bengaluru 560001
              </AppText>
            </View>
            <View style={{ gap: 6 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
                <View style={{ width: `${progress * 100}%`, height: 6, borderRadius: 3, backgroundColor: '#fbbf24' }} />
              </View>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Icon name="sparkles" size={13} color="#fbbf24" />
                <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {remaining === 0 ? 'Prime benefit unlocked: free delivery on this order' : `Add ${inr(remaining)} more for free Prime delivery`}
                </AppText>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Items */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
          {items.map(({ product: p, quantity }) => {
            const off = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
            return (
              <Panel key={p.id} style={{ flexDirection: 'row', gap: 14, padding: 12 }}>
                <Pressable onPress={() => open(p.id)} accessibilityRole="imagebutton" accessibilityLabel={`View ${p.title}`} style={{ width: 104, height: 104, borderRadius: 18, overflow: 'hidden' }}>
                  <RemoteImage asset={productAsset(p.id, p.title)} fill />
                </Pressable>
                <View style={{ flex: 1, gap: 4, justifyContent: 'space-between' }}>
                  <View style={{ gap: 2 }}>
                    <AppText variant="caption" muted>
                      {p.brand}
                    </AppText>
                    <AppText variant="label" numberOfLines={2}>
                      {p.title}
                    </AppText>
                    <View className="flex-row items-center flex-wrap" style={{ gap: 6 }}>
                      <AppText variant="h3">{inr(p.price)}</AppText>
                      {off > 0 && (
                        <AppText variant="caption" muted style={{ textDecorationLine: 'line-through' }}>
                          {inr(p.mrp)}
                        </AppText>
                      )}
                      {off > 0 && (
                        <AppText variant="caption" style={{ color: '#16a34a', fontWeight: '700' }}>
                          {off}% off
                        </AppText>
                      )}
                    </View>
                    {p.isSubscribable && (
                      <View className="flex-row items-center" style={{ gap: 4 }}>
                        <Icon name="repeat" size={12} color="#1865f5" />
                        <AppText variant="caption" className="text-primary-600 dark:text-primary-300">
                          Subscribe and save 10%
                        </AppText>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center" style={{ borderRadius: 22, backgroundColor: 'rgba(107,115,144,0.12)', height: 40 }}>
                      <Pressable
                        onPress={() => dispatch(updateQuantity({ productId: p.id, quantity: quantity - 1 }))}
                        accessibilityRole="button"
                        accessibilityLabel={`Decrease quantity of ${p.title}`}
                        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Icon name="minus" size={16} />
                      </Pressable>
                      <View accessible accessibilityLabel={`Quantity ${quantity}`} style={{ minWidth: 22, alignItems: 'center' }}>
                        <AppText variant="label">{quantity}</AppText>
                      </View>
                      <Pressable
                        onPress={() => dispatch(updateQuantity({ productId: p.id, quantity: quantity + 1 }))}
                        accessibilityRole="button"
                        accessibilityLabel={`Increase quantity of ${p.title}`}
                        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Icon name="plus" size={16} />
                      </Pressable>
                    </View>
                    <Pressable onPress={() => dispatch(removeItem(p.id))} accessibilityRole="button" accessibilityLabel={`Remove ${p.title}`} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
                      <AppText variant="caption" muted style={{ textDecorationLine: 'underline' }}>
                        Remove
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              </Panel>
            );
          })}
          {saved > 0 && (
            <View className="flex-row items-center" style={{ gap: 8, paddingHorizontal: 4 }}>
              <Icon name="check-circle" size={16} color="#16a34a" />
              <AppText variant="label" style={{ color: '#16a34a' }}>
                You are saving {inr(saved)} on this order
              </AppText>
            </View>
          )}
        </View>

        {/* Recommendations */}
        {together.length > 0 && (
          <View style={{ paddingTop: 28 }}>
            <View style={{ paddingHorizontal: 20 }}>
              <SectionTitle eyebrow="Complete the set" title="Frequently bought together" />
            </View>
            <HRail>
              {together.map((p) => (
                <ShopProductCard key={p.id} product={p} width={158} onPress={() => open(p.id)} />
              ))}
            </HRail>
          </View>
        )}
        {forPet.length > 0 && (
          <View style={{ paddingTop: 28 }}>
            <View style={{ paddingHorizontal: 20 }}>
              <SectionTitle eyebrow="Pet OS" title={`Recommended for ${petName}`} />
            </View>
            <HRail>
              {forPet.map((p) => (
                <ShopProductCard key={p.id} product={p} width={158} match={score(p)} onPress={() => open(p.id)} />
              ))}
            </HRail>
          </View>
        )}
        {trending.length > 0 && (
          <View style={{ paddingTop: 28 }}>
            <View style={{ paddingHorizontal: 20 }}>
              <SectionTitle eyebrow="Popular right now" title="Trending products" />
            </View>
            <HRail>
              {trending.map((p) => (
                <ShopProductCard key={p.id} product={p} width={150} onPress={() => open(p.id)} />
              ))}
            </HRail>
          </View>
        )}

        {/* Summary */}
        <View style={{ paddingHorizontal: 20, paddingTop: 28, gap: 14 }}>
          <Panel style={{ gap: 6 }}>
            <SectionTitle title="Order summary" />
            <SummaryRow label={`Subtotal (${count} ${count === 1 ? 'item' : 'items'})`} value={inr(mrpTotal)} />
            {saved > 0 && <SummaryRow label="Discounts" value={`- ${inr(saved)}`} tone="success" />}
            <SummaryRow label="Delivery" value={delivery === 0 ? 'FREE' : inr(delivery)} tone={delivery === 0 ? 'success' : undefined} />
            <SummaryRow label="Taxes" value="Included" />
            <Divider />
            <SummaryRow strong label="Total" value={inr(total)} />
            {subscribeSave > 0 && (
              <View style={{ marginTop: 8 }}>
                <Pill label={`Subscribe and save about ${inr(subscribeSave)} per order`} icon="repeat" tone="primary" />
              </View>
            )}
          </Panel>
          <TrustStrip />
        </View>
      </ScrollView>

      <View style={{ padding: 14, gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(107,115,144,0.16)' }} className="bg-white dark:bg-surface-dark-2">
        <View className="flex-row items-center justify-between">
          <View>
            <AppText variant="caption" muted>
              Total
            </AppText>
            <AppText variant="h2">{inr(total)}</AppText>
          </View>
          {saved > 0 && <Pill label={`Saving ${inr(saved)}`} tone="success" />}
        </View>
        <Button label="Proceed to checkout" fullWidth size="lg" onPress={checkout} />
      </View>
    </SafeAreaView>
  );
}
