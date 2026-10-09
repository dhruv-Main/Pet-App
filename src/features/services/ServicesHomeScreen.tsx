import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, EmptyState, Icon, SectionHeader } from '@components/ui';
import type { IconName } from '@components/ui';
import { RemoteImage } from '@components/media';
import { PressableScale, ProviderCardSkeleton } from '@components/premium';
import { useBookings, useProviders } from '@services/data';
import { serviceAsset } from '@services/media/imageService';
import { useRequireAuth } from '@features/auth/useRequireAuth';
import type { ServiceProvider, ServiceType } from '@apptypes/domain';
import type { ServicesStackParamList } from '@navigation/types';
import { ProviderCard, TYPE_LABEL, demoDistanceKm, isAvailableToday } from './components/ProviderCard';

type Nav = NativeStackNavigationProp<ServicesStackParamList, 'ServicesHome'>;

const INK = '#111827';

const CATEGORIES: { label: string; icon: IconName; types: ServiceType[] | null }[] = [
  { label: 'All', icon: 'paw', types: null },
  { label: 'Vet', icon: 'stethoscope', types: ['vet_teleconsult', 'vet_clinic'] },
  { label: 'Teleconsult', icon: 'video', types: ['vet_teleconsult'] },
  { label: 'Clinics', icon: 'stethoscope', types: ['vet_clinic'] },
  { label: 'Grooming', icon: 'scissors', types: ['grooming'] },
  { label: 'Training', icon: 'heart', types: ['training'] },
  { label: 'Boarding', icon: 'building', types: ['boarding', 'pet_sitting'] },
  { label: 'Walking', icon: 'footprints', types: ['walking'] },
  { label: 'Pet sitting', icon: 'heart', types: ['pet_sitting'] },
  { label: 'Pet taxi', icon: 'car', types: ['taxi'] },
  { label: 'Relocation', icon: 'plane', types: ['relocation'] },
  { label: 'Ambulance', icon: 'ambulance', types: ['ambulance'] },
];

const AREAS = ['All Bengaluru', 'Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'Jayanagar'];

const TRENDING: { type: ServiceType; title: string }[] = [
  { type: 'grooming', title: 'Spa and grooming' },
  { type: 'vet_teleconsult', title: 'Video vet consult' },
  { type: 'training', title: 'Puppy training' },
  { type: 'boarding', title: 'Cozy boarding' },
  { type: 'walking', title: 'Daily dog walks' },
];

export function ServicesHomeScreen() {
  const nav = useNavigation<Nav>();
  const { data: providers, isLoading } = useProviders();
  const bookings = useBookings().data;
  const { guest, requireAuth } = useRequireAuth();
  const route = useRoute<RouteProp<ServicesStackParamList, 'ServicesHome'>>();
  const [category, setCategory] = useState(route.params?.category ?? 'All');
  useEffect(() => {
    if (route.params?.category) setCategory(route.params.category);
  }, [route.params?.category]);
  const [query, setQuery] = useState('');
  const [area, setArea] = useState(AREAS[0]);
  const [areaOpen, setAreaOpen] = useState(false);

  const open = (p: ServiceProvider) => nav.navigate('ProviderDetail', { providerId: p.id });
  const book = (p: ServiceProvider) =>
    requireAuth(() => nav.navigate('Booking', { providerId: p.id }), 'Sign in to book this provider.');

  const inArea = useMemo(
    () =>
      providers.filter(
        (p) =>
          area === AREAS[0] ||
          (p.location ?? '').toLowerCase().includes(area.toLowerCase()) ||
          /all bengaluru|online|across/i.test(p.location ?? '')
      ),
    [providers, area]
  );

  const filtering = query.trim().length > 0 || category !== 'All';
  const results = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.label === category);
    const q = query.trim().toLowerCase();
    return inArea.filter((p) => {
      if (cat?.types && !cat.types.includes(p.type)) return false;
      if (!q) return true;
      const hay = [p.name, TYPE_LABEL[p.type], p.location ?? '', ...(p.specialties ?? [])].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [inArea, category, query]);

  const nearest = useMemo(
    () =>
      [...inArea]
        .filter(isAvailableToday)
        .sort((a, b) => demoDistanceKm(a.id) - demoDistanceKm(b.id))
        .slice(0, 6),
    [inArea]
  );
  const recommended = useMemo(
    () => [...inArea].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount).slice(0, 4),
    [inArea]
  );
  const recent = useMemo(() => {
    const seen = new Set<string>();
    return bookings
      .map((b) => providers.find((p) => p.id === b.providerId))
      .filter((p): p is ServiceProvider => !!p && !seen.has(p.id) && !!seen.add(p.id))
      .slice(0, 3);
  }, [bookings, providers]);

  const vet = providers.find((p) => p.type === 'vet_teleconsult') ?? providers.find((p) => p.type === 'vet_clinic');

  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-2" style={{ gap: 12 }}>
          <View className="flex-row items-center justify-between">
            <View style={{ flexShrink: 1 }}>
              <AppText variant="eyebrow" muted>
                Care near you
              </AppText>
              <AppText variant="h1" accessibilityRole="header">
                Services
              </AppText>
            </View>
            <Pressable
              onPress={() => setAreaOpen((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={`Location ${area}`}
              accessibilityState={{ expanded: areaOpen }}
              className="min-h-[44px] flex-row items-center rounded-full px-4"
              style={{ gap: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' }}
            >
              <Icon name="pin" size={14} color={INK} />
              <AppText variant="label">{area}</AppText>
            </Pressable>
          </View>

          {areaOpen && (
            <View className="rounded-2xl bg-white p-1 dark:bg-neutral-900" style={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
              {AREAS.map((a) => (
                <Pressable
                  key={a}
                  onPress={() => {
                    setArea(a);
                    setAreaOpen(false);
                  }}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: a === area }}
                  className="min-h-[44px] flex-row items-center justify-between rounded-xl px-3"
                >
                  <AppText variant="label" style={{ fontWeight: a === area ? '700' : '400' }}>
                    {a}
                  </AppText>
                  {a === area && <Icon name="check" size={16} color={INK} />}
                </Pressable>
              ))}
            </View>
          )}

          <View
            className="flex-row items-center rounded-full bg-white px-4 dark:bg-neutral-900"
            style={{ gap: 10, height: 52, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }}
          >
            <Icon name="search" size={18} color="#6b7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search vets, groomers, trainers"
              placeholderTextColor="#9ca3af"
              accessibilityLabel="Search services"
              returnKeyType="search"
              style={{ flex: 1, fontSize: 15, color: INK, outlineStyle: 'none' } as never}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10}>
                <Icon name="close" size={16} color="#6b7280" />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 18, gap: 16 }}
          accessibilityRole="radiogroup"
        >
          {CATEGORIES.map((c) => {
            const selected = category === c.label;
            return (
              <Pressable
                key={c.label}
                onPress={() => setCategory(c.label)}
                accessibilityRole="radio"
                accessibilityLabel={c.label}
                accessibilityState={{ selected, checked: selected }}
                style={{ alignItems: 'center', gap: 6, width: 64 }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? INK : '#f3f4f6',
                  }}
                >
                  <Icon name={c.icon} size={22} color={selected ? '#ffffff' : INK} />
                </View>
                <AppText variant="caption" style={{ fontWeight: selected ? '700' : '400' }} numberOfLines={1}>
                  {c.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View className="px-5" style={{ gap: 12 }}>
            <ProviderCardSkeleton />
            <ProviderCardSkeleton />
            <ProviderCardSkeleton />
          </View>
        ) : filtering ? (
          <View className="px-5" style={{ gap: 12 }}>
            <AppText variant="label" muted>
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </AppText>
            {results.length === 0 ? (
              <EmptyState
                title="No providers found"
                description="Try another search, category or area."
                actionLabel="Clear filters"
                onAction={() => {
                  setQuery('');
                  setCategory('All');
                }}
              />
            ) : (
              results.map((p) => <ProviderCard key={p.id} provider={p} onPress={() => open(p)} onBook={() => book(p)} />)
            )}
          </View>
        ) : (
          <>
            <View className="px-5">
              <View className="overflow-hidden rounded-3xl p-5" style={{ backgroundColor: INK, gap: 12 }}>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
                    <Icon name="siren" size={18} color="#ffffff" />
                  </View>
                  <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Emergency care · 24x7
                  </AppText>
                </View>
                <AppText variant="h2" style={{ color: '#ffffff' }}>
                  Your pet needs a vet right now?
                </AppText>
                <AppText style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Connect with a verified veterinarian in minutes, day or night.
                </AppText>
                <PressableScale
                  onPress={() => (vet ? open(vet) : setCategory('Vet'))}
                  accessibilityRole="button"
                  accessibilityLabel="Talk to a vet now"
                  style={{ height: 48, borderRadius: 24, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
                >
                  <Icon name="phone" size={16} color={INK} />
                  <AppText variant="label" style={{ color: INK }}>
                    Talk to a vet now
                  </AppText>
                </PressableScale>
              </View>
            </View>

            <SectionHeader title="Nearest available" eyebrow="Today" />
            {nearest.length === 0 ? (
              <View className="px-5">
                <AppText muted>No providers are available today in this area.</AppText>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
                {nearest.map((p) => (
                  <ProviderCard key={p.id} variant="tile" provider={p} onPress={() => open(p)} onBook={() => book(p)} />
                ))}
              </ScrollView>
            )}

            <SectionHeader title="Trending services" eyebrow="Popular this week" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {TRENDING.map((t) => (
                <PressableScale
                  key={t.type}
                  onPress={() => setCategory(CATEGORIES.find((c) => c.types?.includes(t.type))?.label ?? 'All')}
                  accessibilityRole="button"
                  accessibilityLabel={t.title}
                  style={{ width: 190 }}
                >
                  <View className="overflow-hidden rounded-3xl">
                    <RemoteImage asset={serviceAsset(t.type, t.title)} aspectRatio={3 / 4} radius={0} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.75)']}
                      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, paddingTop: 48 }}
                    >
                      <AppText variant="label" style={{ color: '#ffffff' }}>
                        {t.title}
                      </AppText>
                      <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {inArea.filter((p) => p.type === t.type).length} providers
                      </AppText>
                    </LinearGradient>
                  </View>
                </PressableScale>
              ))}
            </ScrollView>

            <SectionHeader title="Recommended for you" eyebrow="Top rated" />
            <View className="px-5" style={{ gap: 12 }}>
              {recommended.map((p) => (
                <ProviderCard key={p.id} provider={p} onPress={() => open(p)} onBook={() => book(p)} />
              ))}
            </View>

            <SectionHeader title="Recently booked" />
            <View className="px-5" style={{ gap: 12 }}>
              {guest ? (
                <Pressable
                  onPress={() => requireAuth(() => undefined, 'Sign in to see your recent bookings and book again in one tap.')}
                  accessibilityRole="button"
                  className="flex-row items-center rounded-3xl p-4"
                  style={{ gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }}
                >
                  <Icon name="history" size={20} color={INK} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">Your booking history</AppText>
                    <AppText variant="caption" muted>
                      Sign in to see providers you booked and rebook quickly.
                    </AppText>
                  </View>
                  <Icon name="chevron" size={16} color="#6b7280" />
                </Pressable>
              ) : recent.length === 0 ? (
                <AppText muted>Providers you book will appear here.</AppText>
              ) : (
                recent.map((p) => (
                  <ProviderCard key={p.id} provider={p} onPress={() => open(p)} onBook={() => book(p)} />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
