import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { AppText, Icon } from '@components/ui';
import type { IconName } from '@components/ui';
import { Avatar, RemoteImage } from '@components/media';
import { Glass, PressableScale, Reveal } from '@components/premium';
import { useFeed, useProducts, useProviders } from '@services/data';
import { bannerAsset, postAsset } from '@services/media/imageService';
import { useAppDispatch } from '@store/hooks';
import { guestExited } from '@features/auth/authSlice';
import { useDemoLogin } from '@features/auth/useDemoLogin';
import { ProviderCard } from '@features/services/components/ProviderCard';
import { GuestProductTile } from './components/GuestProductTile';

const INK = '#0b0f1a';

const BENEFITS: { icon: IconName; title: string; copy: string; colors: [string, string] }[] = [
  { icon: 'fingerprint', title: 'Pet Passport', copy: 'One verified identity for every vet, kennel and border.', colors: ['#0f172a', '#1e3a8a'] },
  { icon: 'brain', title: 'Digital Twin', copy: 'A living model of your pet that spots risk early.', colors: ['#1f1147', '#5b21b6'] },
  { icon: 'bot', title: 'AI Assistant', copy: 'Vet-smart answers, day or night, that know your pet.', colors: ['#042f2e', '#0f766e'] },
  { icon: 'syringe', title: 'Vaccination Tracking', copy: 'Never miss a shot. Smart reminders, shareable proof.', colors: ['#3b0a1e', '#be123c'] },
  { icon: 'siren', title: 'Emergency SOS', copy: 'Nearest open vet and a one-tap alert, in seconds.', colors: ['#2a1202', '#c2410c'] },
];

const REVIEWS = [
  { name: 'Meera, with Biscuit', text: 'The twin flagged Biscuit’s weight trend weeks before our vet visit. Unreal.' },
  { name: 'Rohan, with Luna', text: 'Booked a groomer and a vet in five minutes. Passport made the clinic visit effortless.' },
  { name: 'Ananya, with Simba', text: 'SOS found an open vet at midnight. I cannot imagine pet life without it.' },
];

const UNLOCK: { icon: IconName; label: string }[] = [
  { icon: 'brain', label: 'Digital Twin' },
  { icon: 'fingerprint', label: 'Passport' },
  { icon: 'heart-pulse', label: 'Health Trackers' },
  { icon: 'sparkles', label: 'AI Insights' },
];

/** Glass intelligence card that drifts over the hero photo, tethered to the focal point by a hairline. */
function FloatChip({
  icon,
  label,
  value,
  tone,
  side,
  delay,
}: {
  icon: IconName;
  label: string;
  value: string;
  tone: string;
  side: 'left' | 'right';
  delay: number;
}) {
  const y = useSharedValue(0);
  React.useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(-6, { duration: 2400, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.quad) })), -1),
    );
  }, [delay, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const tether = (
    <View style={{ flexDirection: side === 'left' ? 'row' : 'row-reverse', alignItems: 'center' }}>
      <View style={{ width: 22, height: 1, backgroundColor: 'rgba(255,255,255,0.45)' }} />
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: tone }} />
    </View>
  );
  return (
    <Animated.View
      style={[style, { flexDirection: side === 'left' ? 'row' : 'row-reverse', alignItems: 'center' }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Glass radius={20} intensity={55} style={{ paddingHorizontal: 11, paddingVertical: 7, minWidth: 120 }}>
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={15} color={tone} />
          </View>
          <View>
            <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
              {label}
            </AppText>
            <AppText variant="caption" style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>
              {value}
            </AppText>
          </View>
        </View>
      </Glass>
      {tether}
    </Animated.View>
  );
}

/** Soft pulsing ring that anchors attention on the pet. */
function PulseRing({ style }: { style?: object }) {
  const s = useSharedValue(0);
  React.useEffect(() => {
    s.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }), -1);
  }, [s]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - s.value), transform: [{ scale: 0.5 + s.value }] }));
  return (
    <View pointerEvents="none" style={[{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View style={[{ position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, borderColor: '#ffffff' }, ring]} />
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffffff' }} />
    </View>
  );
}

function Eyebrow({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-end justify-between px-5" style={{ marginTop: 36, marginBottom: 14 }}>
      <View style={{ flexShrink: 1 }}>
        <AppText variant="eyebrow" muted>
          {eyebrow}
        </AppText>
        <AppText variant="h2" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {action && (
        <Pressable onPress={onAction} accessibilityRole="button" className="min-h-[44px] justify-center">
          <AppText variant="label" style={{ textDecorationLine: 'underline' }}>
            {action}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

/** Preview home for visitors: a taste of what Pet OS does, with a clear reason to join. */
export function GuestHomeScreen() {
  const nav = useNavigation();
  const dispatch = useAppDispatch();
  const demoLogin = useDemoLogin();
  const products = useProducts().data;
  const providers = useProviders().data;
  const posts = useFeed().data;
  const [query, setQuery] = useState('');
  const { height: winH } = useWindowDimensions();
  const scrollRef = React.useRef<ScrollView>(null);
  const heroHeight = Math.round(Math.min(Math.max(winH - 150, 640), 740));

  const go = (tab: string, screen?: string, params?: object) =>
    (nav as unknown as { navigate: (n: string, p?: object) => void }).navigate(tab, screen ? { screen, params } : undefined);
  const createAccount = () => dispatch(guestExited('signup'));

  const trending = useMemo(() => [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8), [products]);
  const bestIds = useMemo(() => new Set(trending.slice(0, 3).map((p) => p.id)), [trending]);
  const nearby = useMemo(() => providers.filter((p) => p.verified).slice(0, 6), [providers]);
  const stories = posts.slice(0, 6);

  const q = query.trim().toLowerCase();
  const found = useMemo(() => {
    if (!q) return null;
    return {
      products: products.filter((p) => [p.title, p.brand, p.category, ...p.tags].join(' ').toLowerCase().includes(q)).slice(0, 6),
      providers: providers
        .filter((p) => [p.name, p.type.replace('_', ' '), p.location ?? '', ...(p.specialties ?? [])].join(' ').toLowerCase().includes(q))
        .slice(0, 6),
      posts: posts.filter((p) => p.content.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [q, products, providers, posts]);
  const empty = found && !found.products.length && !found.providers.length && !found.posts.length;

  return (
    <View className="flex-1 bg-white dark:bg-surface-dark">
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* 1. Pet OS hero */}
        <View style={{ height: heroHeight, backgroundColor: INK, overflow: 'hidden' }}>
          <RemoteImage asset={bannerAsset('dashboard', 'A happy dog and its owner')} fill priority="high" />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(11,15,26,0.55)', 'rgba(11,15,26,0.05)', 'rgba(11,15,26,0.1)', 'rgba(11,15,26,0.82)', 'rgba(11,15,26,0.97)']}
            locations={[0, 0.2, 0.42, 0.7, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(11,15,26,0.45)', 'rgba(11,15,26,0)', 'rgba(11,15,26,0.45)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <View className="flex-row items-center justify-between px-5 pt-2">
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="paw" size={18} color={INK} />
                </View>
                <View>
                  <AppText variant="label" style={{ color: '#ffffff', fontSize: 16, letterSpacing: 0.2 }}>
                    Pet OS
                  </AppText>
                  <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.65)', marginTop: -2 }}>
                    Pet life, understood
                  </AppText>
                </View>
              </View>
              <Pressable onPress={() => dispatch(guestExited('login'))} accessibilityRole="button" accessibilityLabel="Sign in" hitSlop={8}>
                <Glass radius={20} style={{ paddingHorizontal: 16, height: 40, justifyContent: 'center' }}>
                  <AppText variant="label" style={{ color: '#ffffff' }}>
                    Sign in
                  </AppText>
                </Glass>
              </Pressable>
            </View>

            {/* Focal point: the pet, with intelligence layered around it */}
            <PulseRing style={{ position: 'absolute', left: '50%', top: 132, marginLeft: -36 }} />
            <View style={{ position: 'absolute', left: 16, top: 78 }}>
              <FloatChip side="left" icon="brain" label="Digital Twin" value="Live" tone="#60a5fa" delay={0} />
            </View>
            <View style={{ position: 'absolute', right: 16, top: 106 }}>
              <FloatChip side="right" icon="heart-pulse" label="Health score" value="92 / 100" tone="#4ade80" delay={500} />
            </View>
            <View style={{ position: 'absolute', left: 16, top: 160 }}>
              <FloatChip side="left" icon="syringe" label="Vaccines" value="Due in 3 days" tone="#fbbf24" delay={900} />
            </View>
            <View style={{ position: 'absolute', right: 16, top: 208 }}>
              <FloatChip side="right" icon="sparkles" label="AI insight" value="Activity +12%" tone="#c4b5fd" delay={1300} />
            </View>

            <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 92 }}>
              <Reveal>
                <AppText accessibilityRole="header" style={{ color: '#ffffff', fontSize: 40, lineHeight: 44, fontWeight: '800', letterSpacing: -1.2 }}>
                  {'Care that\nthinks ahead.'}
                </AppText>
                <AppText style={{ color: 'rgba(255,255,255,0.78)', fontSize: 16, lineHeight: 23, marginTop: 10 }}>
                  The operating system for pet life.
                </AppText>

                <Glass radius={18} intensity={40} style={{ marginTop: 14, paddingHorizontal: 14, paddingVertical: 12 }}>
                  <View className="flex-row items-center" style={{ gap: 10 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' }} />
                    <AppText variant="caption" style={{ color: '#ffffff', flex: 1, lineHeight: 18 }}>
                      {'Bruno’s activity increased 12% this week. Vaccination due in 3 days.'}
                    </AppText>
                  </View>
                </Glass>

                <PressableScale
                  onPress={createAccount}
                  accessibilityRole="button"
                  accessibilityLabel="Create free account"
                  style={{ marginTop: 16, height: 56, borderRadius: 29, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
                >
                  <AppText variant="h3" style={{ color: INK }}>
                    Create Free Account
                  </AppText>
                  <Icon name="arrow-up-right" size={18} color={INK} />
                </PressableScale>
                <Pressable
                  onPress={() => scrollRef.current?.scrollTo({ y: heroHeight - 40, animated: true })}
                  accessibilityRole="button"
                  accessibilityLabel="Continue as guest"
                  style={{ height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
                >
                  <AppText variant="label" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    Continue as Guest
                  </AppText>
                </Pressable>

              </Reveal>
            </View>
          </SafeAreaView>
        </View>

        {/* 2. Search */}
        <View className="px-5" style={{ marginTop: -26 }}>
          <View
            className="flex-row items-center rounded-full bg-white px-5 dark:bg-neutral-900"
            style={{ height: 58, gap: 12, boxShadow: '0 12px 32px rgba(17,24,39,0.16)' } as never}
          >
            <Icon name="search" size={20} color={INK} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search products, vets, boarding, community"
              placeholderTextColor="#9ca3af"
              accessibilityLabel="Search products, services, vets, boarding and community"
              returnKeyType="search"
              style={{ flex: 1, fontSize: 15, color: INK, outlineStyle: 'none' } as never}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10}>
                <Icon name="close" size={18} color="#6b7280" />
              </Pressable>
            )}
          </View>
          {!found && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 14 }}>
              {['Products', 'Services', 'Vets', 'Boarding', 'Community'].map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setQuery(c === 'Products' || c === 'Services' || c === 'Community' ? '' : c.toLowerCase())}
                  accessibilityRole="button"
                  accessibilityLabel={`Search ${c}`}
                  className="min-h-[40px] justify-center rounded-full px-4"
                  style={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' }}
                >
                  <AppText variant="label">{c}</AppText>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {found ? (
          <View className="px-5" style={{ marginTop: 24, gap: 24 }}>
            {empty && <AppText muted>Nothing matched “{query}”. Try another word.</AppText>}
            {found.products.length > 0 && (
              <View style={{ gap: 12 }}>
                <AppText variant="h3">Products</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 8 }}>
                  {found.products.map((p) => (
                    <GuestProductTile key={p.id} product={p} badge={null} width={190} onPress={() => go('ShopTab', 'ProductDetail', { productId: p.id })} />
                  ))}
                </ScrollView>
              </View>
            )}
            {found.providers.length > 0 && (
              <View style={{ gap: 12 }}>
                <AppText variant="h3">Services and vets</AppText>
                {found.providers.map((p) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    onPress={() => go('ServicesTab', 'ProviderDetail', { providerId: p.id })}
                    onBook={() => go('ServicesTab', 'ProviderDetail', { providerId: p.id })}
                  />
                ))}
              </View>
            )}
            {found.posts.length > 0 && (
              <View style={{ gap: 12 }}>
                <AppText variant="h3">Community</AppText>
                {found.posts.map((p) => (
                  <Pressable key={p.id} onPress={() => go('CommunityTab', 'PostDetail', { postId: p.id })} accessibilityRole="button" className="flex-row items-center" style={{ gap: 12 }}>
                    <Avatar userId={p.author.id} name={p.author.name} size={40} />
                    <AppText numberOfLines={2} style={{ flex: 1 }}>
                      {p.content}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* 3. Benefits */}
            <Eyebrow eyebrow="Explore everything" title="Pet services hub" action="Open" onAction={() => go('HomeTab', 'Hub')} />
            <Eyebrow eyebrow="Included with Pet OS" title="Everything in one system" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {BENEFITS.map((b, i) => (
                <Animated.View key={b.title} entering={FadeInRight.delay(i * 90).duration(500)}>
                  <PressableScale onPress={createAccount} accessibilityRole="button" accessibilityLabel={`${b.title}. Create an account to unlock`} style={{ width: 268 }}>
                    <LinearGradient colors={b.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, height: 300, padding: 20, overflow: 'hidden', justifyContent: 'space-between' }}>
                      <View style={{ position: 'absolute', right: -30, top: -10, opacity: 0.16 }}>
                        <Icon name={b.icon} size={190} color="#ffffff" />
                      </View>
                      <View style={{ position: 'absolute', left: -50, bottom: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)' }} />
                      <Glass radius={26} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={b.icon} size={24} color="#ffffff" />
                      </Glass>
                      <Glass radius={22} style={{ padding: 14, gap: 4 }}>
                        <AppText variant="h3" style={{ color: '#ffffff' }}>
                          {b.title}
                        </AppText>
                        <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.82)' }}>
                          {b.copy}
                        </AppText>
                      </Glass>
                    </LinearGradient>
                  </PressableScale>
                </Animated.View>
              ))}
            </ScrollView>

            {/* 4. Trending products */}
            <Eyebrow eyebrow="Loved by pet parents" title="Trending products" action="Shop all" onAction={() => go('ShopTab')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 16 }} style={{ marginBottom: -20 }}>
              {trending.map((p, i) => (
                <GuestProductTile
                  key={p.id}
                  product={p}
                  badge={bestIds.has(p.id) ? 'best' : i % 2 === 1 && p.rating >= 4.5 ? 'ai' : null}
                  onPress={() => go('ShopTab', 'ProductDetail', { productId: p.id })}
                />
              ))}
            </ScrollView>

            {/* 5. Nearby services */}
            <Eyebrow eyebrow="Verified and close by" title="Nearby services" action="Explore" onAction={() => go('ServicesTab')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {nearby.map((p) => (
                <View key={p.id}>
                  <ProviderCard
                    variant="tile"
                    provider={p}
                    onPress={() => go('ServicesTab', 'ProviderDetail', { providerId: p.id })}
                    onBook={() => go('ServicesTab', 'ProviderDetail', { providerId: p.id })}
                  />
                  {!!p.experienceYears && (
                    <AppText variant="caption" muted style={{ marginTop: 6, marginLeft: 4 }}>
                      {p.experienceYears} years experience
                    </AppText>
                  )}
                </View>
              ))}
            </ScrollView>

            {/* 6. Community */}
            <Eyebrow eyebrow="Real pets, real people" title="Community" action="Join in" onAction={() => go('CommunityTab')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {stories.map((s) => (
                <PressableScale key={s.id} onPress={() => go('CommunityTab', 'PostDetail', { postId: s.id })} accessibilityRole="button" accessibilityLabel={`Story by ${s.author.name}`} style={{ width: 240 }}>
                  <View className="overflow-hidden" style={{ borderRadius: 26 }}>
                    <RemoteImage asset={postAsset(s.id, `Photo shared by ${s.author.name}`)} aspectRatio={0.85} radius={0} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, paddingTop: 60, gap: 8 }}>
                      <AppText variant="caption" numberOfLines={2} style={{ color: '#ffffff' }}>
                        {s.content}
                      </AppText>
                      <View className="flex-row items-center" style={{ gap: 8 }}>
                        <Avatar userId={s.author.id} name={s.author.name} size={24} />
                        <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
                          {s.author.name}
                        </AppText>
                      </View>
                    </LinearGradient>
                  </View>
                </PressableScale>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, gap: 12 }}>
              {REVIEWS.map((r) => (
                <View key={r.name} className="rounded-3xl bg-neutral-50 p-5 dark:bg-neutral-900" style={{ width: 280, gap: 10 }}>
                  <View className="flex-row" style={{ gap: 2 }}>
                    {[0, 1, 2, 3, 4].map((n) => (
                      <Icon key={n} name="star" size={14} color={INK} />
                    ))}
                  </View>
                  <AppText>“{r.text}”</AppText>
                  <AppText variant="caption" muted>
                    {r.name}
                  </AppText>
                </View>
              ))}
            </ScrollView>

            {/* 7. Conversion */}
            <View className="px-5" style={{ marginTop: 40 }}>
              <LinearGradient colors={['#0b0f1a', '#1e1b4b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 32, padding: 24, gap: 18, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', right: -40, top: -40, opacity: 0.12 }}>
                  <Icon name="paw" size={220} color="#ffffff" />
                </View>
                <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  You are viewing a preview
                </AppText>
                <AppText variant="h1" style={{ color: '#ffffff' }}>
                  Create an account to unlock the full Pet OS
                </AppText>
                <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                  {UNLOCK.map((u) => (
                    <Glass key={u.label} radius={18} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                      <View className="flex-row items-center" style={{ gap: 8 }}>
                        <Icon name={u.icon} size={16} color="#ffffff" />
                        <AppText variant="label" style={{ color: '#ffffff' }}>
                          {u.label}
                        </AppText>
                        <Icon name="lock" size={12} color="rgba(255,255,255,0.7)" />
                      </View>
                    </Glass>
                  ))}
                </View>
                <View style={{ gap: 10 }}>
                  <PressableScale onPress={createAccount} accessibilityRole="button" accessibilityLabel="Create free account" style={{ height: 54, borderRadius: 27, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
                    <AppText variant="h3" style={{ color: INK }}>
                      Create free account
                    </AppText>
                  </PressableScale>
                  <PressableScale onPress={demoLogin} accessibilityRole="button" accessibilityLabel="Continue with Google" style={{ height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                    <AppText variant="label" style={{ color: '#ffffff' }}>
                      Continue with Google
                    </AppText>
                  </PressableScale>
                  <Pressable onPress={() => dispatch(guestExited('login'))} accessibilityRole="button" className="min-h-[44px] items-center justify-center">
                    <AppText variant="label" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      Already have an account? Sign in
                    </AppText>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
