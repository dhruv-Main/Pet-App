import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { hubCollections } from '@features/hub/hubData';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, EmptyState, Icon, Skeleton } from '@components/ui';
import type { IconName } from '@components/ui';
import { RemoteImage } from '@components/media';
import { Glass, PressableScale, Reveal } from '@components/premium';
import { useIsMember, usePets, useProducts } from '@services/data';
import { bannerAsset, productAsset } from '@services/media/imageService';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { addItem, selectCartCount } from '@features/cart/cartSlice';
import { guestExited } from '@features/auth/authSlice';
import { ShopProductCard } from './components/ShopProductCard';
import { recentlyViewed } from './recentlyViewed';
import type { ShopStackParamList } from '@navigation/types';
import type { Product, ProductCategory } from '@apptypes/domain';

type Nav = NativeStackNavigationProp<ShopStackParamList, 'Catalog'>;

const INK = '#0b0f1a';
const H = 20;

const CATEGORY_META: Record<ProductCategory, { label: string; icon: IconName; color: string }> = {
  food: { label: 'Food', icon: 'utensils', color: '#b45309' },
  treats: { label: 'Treats', icon: 'gift', color: '#be185d' },
  supplements: { label: 'Wellness', icon: 'pill', color: '#15803d' },
  apparel: { label: 'Fashion', icon: 'package', color: '#6d28d9' },
  accessories: { label: 'Gear', icon: 'package', color: '#334155' },
  devices: { label: 'Smart tech', icon: 'cpu', color: '#1d4ed8' },
  toys: { label: 'Play', icon: 'paw', color: '#c2410c' },
  healthcare: { label: 'Health', icon: 'heart-pulse', color: '#be123c' },
  grooming: { label: 'Grooming', icon: 'scissors', color: '#0f766e' },
};
const CATEGORY_ORDER = Object.keys(CATEGORY_META) as ProductCategory[];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function reasonFor(p: Product, name: string, breed: string): string {
  switch (p.category) {
    case 'food':
      return `Balanced nutrition for ${breed}s`;
    case 'treats':
      return `A guilt-free reward for ${name}`;
    case 'supplements':
      return `Supports ${name}'s joints and coat`;
    case 'toys':
      return `Matches ${name}'s play energy`;
    case 'devices':
      return `Feeds ${name}'s Digital Twin`;
    case 'healthcare':
      return `Fills a gap in ${name}'s care plan`;
    case 'grooming':
      return `Keeps a ${breed} coat healthy`;
    case 'apparel':
      return `Comfort-fit for ${breed}s`;
    default:
      return `A daily essential for ${name}`;
  }
}

function SectionTitle({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-end justify-between" style={{ paddingHorizontal: H, marginTop: 34, marginBottom: 14 }}>
      <View style={{ flexShrink: 1 }}>
        {eyebrow ? (
          <AppText variant="eyebrow" muted>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="h2" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {right}
    </View>
  );
}

function Rail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: H, paddingVertical: 8, gap: 14 }}
    >
      {children}
    </ScrollView>
  );
}

export function CatalogScreen() {
  const nav = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const { data: products, isLoading, isError, refetch } = useProducts();
  const member = useIsMember();
  const pet = usePets().data[0];
  const cartCount = useAppSelector(selectCartCount);
  const [active, setActive] = useState<ProductCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const route = useRoute<RouteProp<ShopStackParamList, 'Catalog'>>();
  const [collection, setCollection] = useState<string | null>(route.params?.collection ?? null);
  React.useEffect(() => {
    if (route.params?.collection) {
      setCollection(route.params.collection);
      setActive('all');
      setQuery('');
    }
  }, [route.params?.collection]);
  const col = collection ? hubCollections[collection] : undefined;
  const [, bump] = useState(0);
  useFocusEffect(useCallback(() => bump((n) => n + 1), []));

  const petName = pet?.name ?? 'Bruno';
  const breed = pet?.breed ?? 'Labrador';
  const species = pet?.species ?? 'dog';

  const content = Math.min(width, 1100);
  const cols = content >= 900 ? 4 : content >= 640 ? 3 : 2;
  const gridGap = 14;
  const gridCard = Math.floor((content - H * 2 - gridGap * (cols - 1)) / cols);
  const railCard = Math.min(236, Math.max(190, Math.floor(content * 0.58)));

  const open = useCallback(
    (id: string) => {
      recentlyViewed.push(id);
      nav.navigate('ProductDetail', { productId: id });
    },
    [nav],
  );

  const picks = useMemo(
    () =>
      products
        .filter((p) => {
          const text = `${p.title} ${p.tags.join(' ')}`.toLowerCase();
          const other = species === 'dog' ? 'cat' : species === 'cat' ? 'dog' : '';
          return !other || !new RegExp(`\\b${other}\\b`).test(text) || text.includes(species);
        })
        .map((p) => ({
          p,
          score: Math.min(99, 78 + (hash(p.id + petName) % 14) + (p.tags.some((t) => t.toLowerCase().includes(species)) ? 6 : 0)),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6),
    [products, petName, species],
  );
  const best = useMemo(() => [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8), [products]);
  const trending = useMemo(() => {
    const bestIds = new Set(best.slice(0, 4).map((p) => p.id));
    return [...products].filter((p) => !bestIds.has(p.id)).sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount).slice(0, 8);
  }, [products, best]);
  const subs = useMemo(() => products.filter((p) => p.isSubscribable).slice(0, 6), [products]);
  const recents = useMemo(() => recentlyViewed.list().map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p), [products]);
  const categories = useMemo(
    () =>
      CATEGORY_ORDER.map((key) => ({ key, items: products.filter((p) => p.category === key) })).filter((c) => c.items.length > 0),
    [products],
  );

  const q = query.trim().toLowerCase();
  const browsing = !!q || active !== 'all' || !!col;
  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (active !== 'all' && p.category !== active) return false;
        if (col) {
          const tagHit = col.tags?.some((t) => p.tags.some((x) => x.toLowerCase() === t.toLowerCase()));
          const catHit = col.categories?.includes(p.category);
          const subHit = col.subscribable && p.isSubscribable;
          if (!tagHit && !catHit && !subHit) return false;
        }
        return !q || [p.title, p.brand, p.category, ...p.tags].join(' ').toLowerCase().includes(q);
      }),
    [products, active, q, col],
  );
  const clearFilters = () => {
    setQuery('');
    setActive('all');
    setCollection(null);
  };

  const hero = picks[0];
  const signup = () => dispatch(guestExited('signup'));
  const restock = subs.find((p) => p.category === 'food') ?? subs[0];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 1100, alignSelf: 'center' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between" style={{ paddingHorizontal: H, paddingTop: 8 }}>
            <View>
              <AppText variant="eyebrow" muted>
                Pet OS Store
              </AppText>
              <AppText variant="h1" accessibilityRole="header">
                Shop
              </AppText>
            </View>
            <Pressable
              onPress={() => nav.navigate('Cart')}
              accessibilityRole="button"
              accessibilityLabel={`Cart, ${cartCount} items`}
              style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: INK }}
            >
              <Icon name="cart" size={20} color="#ffffff" />
              {cartCount > 0 && (
                <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#f43f5e', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                  <AppText variant="caption" style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>
                    {cartCount}
                  </AppText>
                </View>
              )}
            </Pressable>
          </View>

          {/* Search */}
          <View style={{ paddingHorizontal: H, marginTop: 14 }}>
            <View
              className="flex-row items-center bg-neutral-100 dark:bg-neutral-800"
              style={{ height: 54, borderRadius: 27, paddingHorizontal: 18, gap: 10 }}
            >
              <Icon name="search" size={19} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={`Search food, toys and tech for ${petName}`}
                placeholderTextColor="#9ca3af"
                accessibilityLabel="Search products"
                returnKeyType="search"
                autoCorrect={false}
                style={{ flex: 1, fontSize: 15, color: '#111827', outlineStyle: 'none' } as object}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10}>
                  <Icon name="x-circle" size={18} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {isLoading ? (
            <View className="flex-row flex-wrap" style={{ gap: gridGap, padding: H }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={300} radius={26} width={gridCard} />
              ))}
            </View>
          ) : isError ? (
            <EmptyState title="Products are unavailable" description="Check your connection and try again." actionLabel="Try again" onAction={refetch} />
          ) : (
            <>
              {/* Categories */}
              <SectionTitle eyebrow="Browse" title="Shop by category" />
              <Rail>
                <PressableScale onPress={() => setActive('all')} accessibilityRole="button" accessibilityLabel="All products">
                  <CategoryCard
                    label="Everything"
                    count={products.length}
                    icon="layout"
                    color="#111827"
                    selected={active === 'all'}
                    imageKey={null}
                  />
                </PressableScale>
                {categories.map((c) => (
                  <PressableScale
                    key={c.key}
                    onPress={() => setActive(active === c.key ? 'all' : c.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${CATEGORY_META[c.key].label} category`}
                  >
                    <CategoryCard
                      label={CATEGORY_META[c.key].label}
                      count={c.items.length}
                      icon={CATEGORY_META[c.key].icon}
                      color={CATEGORY_META[c.key].color}
                      selected={active === c.key}
                      imageKey={c.items[0]}
                    />
                  </PressableScale>
                ))}
              </Rail>

              <SectionTitle eyebrow="Curated" title="Shop collections" />
              <Rail>
                {Object.entries(hubCollections).map(([key, c]) => (
                  <PressableScale
                    key={key}
                    onPress={() => {
                      setActive('all');
                      setQuery('');
                      setCollection(collection === key ? null : key);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${c.title} collection`}
                  >
                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 22,
                        backgroundColor: collection === key ? INK : '#f3f4f6',
                      }}
                    >
                      <AppText variant="label" style={{ color: collection === key ? '#fff' : INK, fontWeight: '700' }}>
                        {c.title}
                      </AppText>
                    </View>
                  </PressableScale>
                ))}
              </Rail>

              {browsing ? (
                <>
                  <SectionTitle
                    eyebrow={`${filtered.length} ${filtered.length === 1 ? 'result' : 'results'}`}
                    title={q ? `Results for "${query.trim()}"` : col ? col.title : CATEGORY_META[active as ProductCategory].label}
                    right={
                      <Pressable onPress={clearFilters} accessibilityRole="button" className="min-h-[44px] justify-center">
                        <AppText variant="label" style={{ textDecorationLine: 'underline' }}>
                          Clear
                        </AppText>
                      </Pressable>
                    }
                  />
                  {filtered.length ? (
                    <View className="flex-row flex-wrap" style={{ paddingHorizontal: H, gap: gridGap }}>
                      {filtered.map((p) => (
                        <ShopProductCard key={p.id} product={p} width={gridCard} onPress={() => open(p.id)} />
                      ))}
                    </View>
                  ) : (
                    <EmptyState title="No products found" description="Try a different search or category." actionLabel="Clear filters" onAction={clearFilters} />
                  )}
                </>
              ) : (
                <>
                  {/* Hero */}
                  {hero && (
                    <Reveal style={{ paddingHorizontal: H, marginTop: 24 }}>
                      <View style={{ height: 380, borderRadius: 32, overflow: 'hidden', backgroundColor: INK }}>
                        <RemoteImage asset={bannerAsset('shop', 'Pet shopping')} fill priority="high" />
                        <LinearGradient
                          colors={['rgba(11,15,26,0.05)', 'rgba(11,15,26,0.88)']}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <View style={{ position: 'absolute', top: 16, left: 16 }}>
                          <Glass radius={16} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                            <View className="flex-row items-center" style={{ gap: 6 }}>
                              <Icon name={member ? 'sparkles' : 'lock'} size={13} color="#ffffff" />
                              <AppText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
                                {member ? 'AI Shopping Insight' : 'Personalised preview'}
                              </AppText>
                            </View>
                          </Glass>
                        </View>
                        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
                          <Glass radius={26} intensity={50} style={{ padding: 18, gap: 10 }}>
                            <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.75)' }}>
                              {member ? `${hero.score}% match for ${petName}` : 'Shopping that knows your pet'}
                            </AppText>
                            <AppText variant="h1" style={{ color: '#fff', fontSize: 28, lineHeight: 34 }}>
                              {member ? `Recommended for ${petName}` : `Picked for ${petName}`}
                            </AppText>
                            <AppText variant="label" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '400' }} numberOfLines={2}>
                              {member
                                ? `${hero.p.title}. ${reasonFor(hero.p, petName, breed)}.`
                                : `A preview for a ${breed}. Sign up to tune it to your pet.`}
                            </AppText>
                            <View className="flex-row" style={{ gap: 10, marginTop: 4 }}>
                              <PressableScale
                                onPress={() => (member ? open(hero.p.id) : signup())}
                                accessibilityRole="button"
                                accessibilityLabel={member ? 'View recommended product' : 'Unlock personalised picks'}
                                style={{ backgroundColor: '#fff', borderRadius: 26, paddingHorizontal: 20, height: 46, justifyContent: 'center' }}
                              >
                                <AppText variant="label" style={{ color: INK, fontWeight: '700' }}>
                                  {member ? 'View pick' : 'Unlock my picks'}
                                </AppText>
                              </PressableScale>
                              {member && (
                                <PressableScale
                                  onPress={() => dispatch(addItem({ product: hero.p }))}
                                  accessibilityRole="button"
                                  accessibilityLabel="Quick add recommended product"
                                  style={{ borderRadius: 26, paddingHorizontal: 18, height: 46, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }}
                                >
                                  <AppText variant="label" style={{ color: '#fff', fontWeight: '600' }}>
                                    Quick add
                                  </AppText>
                                </PressableScale>
                              )}
                            </View>
                          </Glass>
                        </View>
                      </View>
                    </Reveal>
                  )}

                  {/* Restock reminder (members) */}
                  {member && restock && (
                    <Reveal index={1} style={{ paddingHorizontal: H, marginTop: 14 }}>
                      <PressableScale
                        onPress={() => open(restock.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Restock ${restock.title}`}
                      >
                        <View className="flex-row items-center bg-violet-50 dark:bg-neutral-900" style={{ borderRadius: 22, padding: 14, gap: 12 }}>
                          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="repeat" size={20} color="#fff" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <AppText variant="label">Time to restock {petName}&apos;s essentials</AppText>
                            <AppText variant="caption" muted numberOfLines={1}>
                              {restock.title} · subscribe and save 10%
                            </AppText>
                          </View>
                          <Icon name="chevron" size={18} />
                        </View>
                      </PressableScale>
                    </Reveal>
                  )}

                  {/* For your pet */}
                  <SectionTitle
                    eyebrow={member ? 'AI recommendations' : 'AI recommendations · preview'}
                    title={member ? `For ${petName}` : 'Recommended for your pet'}
                  />
                  <Rail>
                    {picks.map(({ p, score }) => (
                      <ShopProductCard
                        key={p.id}
                        product={p}
                        width={railCard + 20}
                        match={score}
                        reason={reasonFor(p, petName, breed)}
                        onPress={() => open(p.id)}
                      />
                    ))}
                    {!member && (
                      <PressableScale onPress={signup} accessibilityRole="button" accessibilityLabel="Unlock personalised match scores">
                        <LinearGradient
                          colors={['#1f1147', '#5b21b6']}
                          style={{ width: railCard, height: '100%', minHeight: 360, borderRadius: 26, padding: 22, justifyContent: 'space-between' }}
                        >
                          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="lock" size={22} color="#fff" />
                          </View>
                          <View style={{ gap: 8 }}>
                            <AppText variant="h3" style={{ color: '#fff' }}>
                              Unlock match scores
                            </AppText>
                            <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              Real scores and reasons based on your pet’s health, age and breed.
                            </AppText>
                            <View style={{ backgroundColor: '#fff', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 }}>
                              <AppText variant="label" style={{ color: INK, fontWeight: '700' }}>
                                Create free account
                              </AppText>
                            </View>
                          </View>
                        </LinearGradient>
                      </PressableScale>
                    )}
                  </Rail>

                  {/* Best sellers */}
                  <SectionTitle eyebrow="Loved by pet parents" title="Best sellers" />
                  <Rail>
                    {best.map((p) => (
                      <ShopProductCard key={p.id} product={p} width={railCard} onPress={() => open(p.id)} />
                    ))}
                  </Rail>

                  {/* Subscription deals */}
                  {subs.length > 0 && (
                    <>
                      <SectionTitle eyebrow="Never run out" title="Subscription deals" />
                      <Rail>
                        {subs.map((p) => (
                          <SubscriptionCard key={p.id} product={p} onPress={() => open(p.id)} />
                        ))}
                      </Rail>
                    </>
                  )}

                  {/* Trending */}
                  <SectionTitle eyebrow="Right now" title="Trending" />
                  <Rail>
                    {trending.map((p) => (
                      <ShopProductCard key={p.id} product={p} width={railCard} onPress={() => open(p.id)} />
                    ))}
                  </Rail>

                  {/* Recently viewed */}
                  {recents.length > 0 && (
                    <>
                      <SectionTitle eyebrow="Pick up where you left off" title="Recently viewed" />
                      <Rail>
                        {recents.map((p) => (
                          <ShopProductCard key={p.id} product={p} width={railCard} aspectRatio={1.1} onPress={() => open(p.id)} />
                        ))}
                      </Rail>
                    </>
                  )}

                  {/* Guest conversion */}
                  {!member && (
                    <Reveal style={{ paddingHorizontal: H, marginTop: 40 }}>
                      <LinearGradient colors={['#0b0f1a', '#1e1b4b']} style={{ borderRadius: 32, padding: 24, gap: 14 }}>
                        <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          Included with a free account
                        </AppText>
                        <AppText variant="h2" style={{ color: '#fff' }}>
                          Shopping that gets smarter with every pet
                        </AppText>
                        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                          {(
                            [
                              ['sparkles', 'AI match scores'],
                              ['repeat', 'Auto-refill reminders'],
                              ['heart-pulse', 'Health-based picks'],
                              ['gift', 'Member-only deals'],
                            ] as [IconName, string][]
                          ).map(([icon, label]) => (
                            <Glass key={label} radius={18} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                              <View className="flex-row items-center" style={{ gap: 6 }}>
                                <Icon name="lock" size={12} color="#fff" />
                                <Icon name={icon} size={13} color="#fff" />
                                <AppText variant="caption" style={{ color: '#fff', fontWeight: '600' }}>
                                  {label}
                                </AppText>
                              </View>
                            </Glass>
                          ))}
                        </View>
                        <PressableScale
                          onPress={signup}
                          accessibilityRole="button"
                          accessibilityLabel="Create free account"
                          style={{ backgroundColor: '#fff', borderRadius: 28, height: 52, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <AppText variant="label" style={{ color: INK, fontWeight: '700' }}>
                            Create free account
                          </AppText>
                        </PressableScale>
                      </LinearGradient>
                    </Reveal>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryCard({
  label,
  count,
  icon,
  color,
  selected,
  imageKey,
}: {
  label: string;
  count: number;
  icon: IconName;
  color: string;
  selected: boolean;
  imageKey: Product | null;
}) {
  return (
    <View
      style={{
        width: 132,
        height: 172,
        borderRadius: 26,
        overflow: 'hidden',
        backgroundColor: color,
        borderWidth: selected ? 3 : 0,
        borderColor: '#7c3aed',
      }}
    >
      {imageKey ? (
        <RemoteImage asset={productAsset(imageKey.id, imageKey.title)} fill />
      ) : (
        <RemoteImage asset={bannerAsset('shop', 'All products')} fill />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0)', color]}
        locations={[0.2, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ position: 'absolute', top: 10, left: 10 }}>
        <Glass radius={16} style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={17} color="#fff" />
        </Glass>
      </View>
      <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
        <AppText variant="label" style={{ color: '#fff', fontWeight: '800' }} numberOfLines={1}>
          {label}
        </AppText>
        <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
          {count} items
        </AppText>
      </View>
    </View>
  );
}

function SubscriptionCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const dispatch = useAppDispatch();
  const [added, setAdded] = useState(false);
  const save = Math.round(product.price * 0.1);
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={`${product.title}, subscribe and save`}>
      <View
        className="flex-row bg-white dark:bg-neutral-900"
        style={{ width: 340, borderRadius: 26, overflow: 'hidden', shadowColor: '#111827', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 }}
      >
        <View style={{ width: 130 }}>
          <RemoteImage asset={productAsset(product.id, product.title)} fill />
        </View>
        <View style={{ flex: 1, padding: 14, gap: 6 }}>
          <View className="flex-row items-center self-start" style={{ gap: 5, backgroundColor: '#ede9fe', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Icon name="repeat" size={11} color="#6d28d9" />
            <AppText variant="caption" style={{ color: '#6d28d9', fontWeight: '800' }}>
              Save 10%
            </AppText>
          </View>
          <AppText variant="label" numberOfLines={2}>
            {product.title}
          </AppText>
          <AppText variant="caption" muted>
            ₹{product.price.toLocaleString('en-IN')} · save ₹{save} every delivery
          </AppText>
          <Pressable
            onPress={() => {
              dispatch(addItem({ product }));
              setAdded(true);
              setTimeout(() => setAdded(false), 1400);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Quick add ${product.title}`}
            style={{ alignSelf: 'flex-start', backgroundColor: added ? '#16a34a' : '#111827', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <AppText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
              {added ? 'Added' : 'Quick add'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </PressableScale>
  );
}
