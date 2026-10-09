import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { AppText, Button, EmptyState, FloatingBackButton, Icon, ScreenFallback } from '@components/ui';
import type { IconName } from '@components/ui';
import { RemoteImage } from '@components/media';
import { Glass } from '@components/premium';
import { providerAsset } from '@services/media/imageService';
import { useProvider, useProviders } from '@services/data';
import { useRequireAuth } from '@features/auth/useRequireAuth';
import { ProviderCard, TYPE_LABEL, demoDistanceKm, isAvailableToday } from './components/ProviderCard';
import { DetailSection, HRail, InfoRow, Pill, RatingSummary, ReviewCard, Stars, Surface, hashOf } from '@features/shared/DetailKit';
import type { ReviewItem } from '@features/shared/DetailKit';
import type { ServiceProvider } from '@apptypes/domain';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const VET = new Set(['vet_teleconsult', 'vet_clinic']);
const SLOTS = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '4:30 PM', '6:00 PM', '7:30 PM', '8:30 PM'];
const EDU = ['BVSc & AH, Veterinary College', 'MVSc, Veterinary University', 'BVSc, State Veterinary College'];
const CERTS = ['Council-registered practitioner', 'Fear Free certified', 'Advanced small-animal care', 'Emergency and critical care'];
const LANGS = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Marathi'];

function pick<T>(list: T[], seed: number, n: number): T[] {
  return Array.from({ length: n }, (_, i) => list[(seed + i) % list.length]);
}

function reviewsFor(p: ServiceProvider): ReviewItem[] {
  const seed = hashOf(p.id);
  const names = ['Aditi R.', 'Karan P.', 'Meera S.', 'Rohit D.'];
  const bodies: Array<[string, string]> = [
    ['Calm, clear and kind', 'Explained everything in plain language and was patient with my pet. We left knowing exactly what to do next.'],
    ['Worth it', 'Easy to book and on time. Follow-up advice was practical and genuinely useful.'],
    ['Great with nervous pets', 'Our pet is usually anxious and was relaxed the whole time. Highly recommend.'],
    ['Thorough and honest', 'Did not push anything unnecessary. Gave options and let us decide.'],
  ];
  return bodies.map(([title, body], i) => ({
    name: names[(seed + i) % names.length],
    when: ['1 week ago', '3 weeks ago', '1 month ago', '2 months ago'][i],
    rating: i === 2 ? 4 : 5,
    title,
    body,
    tag: 'Verified visit',
  }));
}

export function ProviderDetailScreen() {
  const route = useRoute<RouteProp<{ ProviderDetail: { providerId: string } }, 'ProviderDetail'>>();
  const nav = useNavigation();
  const p = useProvider(route.params?.providerId).data;
  if (!p) {
    return (
      <ScreenFallback>
        <EmptyState title="Provider not found" description="This provider is no longer available." actionLabel="Go back" onAction={() => nav.goBack()} />
      </ScreenFallback>
    );
  }
  return <ProviderDetailContent key={p.id} p={p} />;
}

function ProviderDetailContent({ p }: { p: ServiceProvider }) {
  const nav = useNavigation();
  const { requireAuth } = useRequireAuth();
  const { width } = useWindowDimensions();
  const all = useProviders().data;
  const seed = hashOf(p.id);
  const online = isAvailableToday(p);
  const isVet = VET.has(p.type);
  const heroH = Math.min(width * 1.05, 460);

  const years = p.experienceYears ?? 4 + (seed % 12);
  const consults = Math.max(120, p.reviewCount * (6 + (seed % 5)));
  const recommend = 90 + (seed % 10);

  const book = useCallback(
    () => requireAuth(() => (nav as unknown as { navigate: (n: string, a: object) => void }).navigate('Booking', { providerId: p.id }), 'Sign in to book this provider.'),
    [nav, p.id, requireAuth],
  );
  const open = useCallback(
    (id: string) => (nav as unknown as { push: (n: string, a: object) => void }).push('ProviderDetail', { providerId: id }),
    [nav],
  );

  const schedule = useMemo(
    () => SLOTS.map((t, i) => ({ t, booked: (seed >> i) % 3 === 0 || i < (online ? 2 : 3) })),
    [seed, online],
  );
  const nextFree = schedule.find((s) => !s.booked)?.t;

  const types: Array<{ icon: IconName; title: string; body: string; on: boolean }> = [
    { icon: 'phone', title: 'Video consult', body: 'Talk from home in minutes', on: p.type === 'vet_teleconsult' || isVet },
    { icon: 'building', title: 'Clinic visit', body: p.location ?? 'In-person appointment', on: p.type === 'vet_clinic' || !!p.location },
    { icon: 'siren', title: 'Emergency', body: online ? 'Available now' : 'Not available now', on: isVet && online },
  ];

  const similar = all.filter((x) => x.id !== p.id && x.type === p.type);
  const nearby = [...all].filter((x) => x.id !== p.id).sort((a, b) => demoDistanceKm(a.id) - demoDistanceKm(b.id)).slice(0, 6);
  const emergency = all.filter((x) => x.id !== p.id && x.verified && VET.has(x.type) && isAvailableToday(x)).slice(0, 6);

  const stats: Array<[string, string]> = [
    [`${years}+`, 'Years experience'],
    [consults.toLocaleString('en-IN'), 'Consultations'],
    [`${recommend}%`, 'Recommend'],
    [p.reviewCount.toLocaleString('en-IN'), 'Reviews'],
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark" edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={{ height: heroH, backgroundColor: '#0b0f1a' }}>
          <RemoteImage asset={providerAsset(p.id, p.name)} fill priority="high" />
          <LinearGradient colors={['rgba(11,15,26,0.4)', 'rgba(11,15,26,0)', 'rgba(11,15,26,0.88)']} locations={[0, 0.35, 1]} style={{ position: 'absolute', inset: 0 } as never} />
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 28, gap: 8 }}>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {p.verified && (
                <Glass radius={15} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 30 }}>
                  <Icon name="check-circle" size={14} color="#86efac" />
                  <AppText variant="label" style={{ color: '#ffffff' }}>
                    Verified
                  </AppText>
                </Glass>
              )}
              <Glass radius={15} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: online ? '#22c55e' : '#9ca3af' }} />
                <AppText variant="label" style={{ color: '#ffffff' }}>
                  {online ? 'Online now' : 'Offline'}
                </AppText>
              </Glass>
            </View>
            <AppText variant="h1" style={{ color: '#ffffff' }} accessibilityRole="header">
              {p.name}
            </AppText>
            <AppText style={{ color: 'rgba(255,255,255,0.85)' }}>
              {p.specialties?.[0] ?? TYPE_LABEL[p.type]}
              {p.location ? ` · ${p.location}` : ''}
            </AppText>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Stars value={p.rating} />
              <AppText variant="label" style={{ color: '#ffffff' }}>
                {p.rating}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>
                ({p.reviewCount.toLocaleString('en-IN')} reviews)
              </AppText>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: 20, marginTop: -20 }}>
          <Surface style={{ flexDirection: 'row', paddingVertical: 18 }}>
            {stats.map(([v, l], i) => (
              <View key={l} accessible accessibilityLabel={`${l}: ${v}`} style={{ flex: 1, alignItems: 'center', gap: 2, borderLeftWidth: i ? 1 : 0, borderLeftColor: 'rgba(107,115,144,0.16)' }}>
                <AppText variant="h3">{v}</AppText>
                <AppText variant="caption" muted center>
                  {l}
                </AppText>
              </View>
            ))}
          </Surface>
        </View>

        {/* Availability */}
        <DetailSection eyebrow="Today" title="Availability">
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            <Surface style={{ gap: 4 }}>
              <InfoRow icon="calendar" tone="success" title={`Next available: ${p.nextAvailable}`} body={online ? 'Open for same-day bookings.' : 'Book ahead to reserve your slot.'} />
            </Surface>
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {schedule.map((s) => (
                <Pressable
                  key={s.t}
                  disabled={s.booked}
                  onPress={book}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: s.booked }}
                  accessibilityLabel={`${s.t}${s.booked ? ', booked' : ', available. Book'}`}
                  style={{
                    minWidth: '22%',
                    flexGrow: 1,
                    height: 44,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: s.booked ? 'rgba(107,115,144,0.1)' : s.t === nextFree ? '#1865f5' : 'rgba(24,101,245,0.1)',
                  }}
                >
                  <AppText variant="label" style={{ color: s.booked ? '#9ca3af' : s.t === nextFree ? '#ffffff' : '#1d4ed8', textDecorationLine: s.booked ? 'line-through' : 'none' }}>
                    {s.t}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </DetailSection>

        {/* Consultation types */}
        <DetailSection eyebrow="Choose how" title="Consultation types">
          <View style={{ paddingHorizontal: 20 }}>
            <Surface style={{ gap: 16 }}>
              {types.map((t) => (
                <View key={t.title} style={{ opacity: t.on ? 1 : 0.5 }}>
                  <InfoRow icon={t.icon} tone={t.title === 'Emergency' ? 'warning' : 'primary'} title={t.title} body={t.on ? t.body : 'Not offered'} />
                </View>
              ))}
            </Surface>
          </View>
        </DetailSection>

        {/* About */}
        <DetailSection eyebrow="Background" title="About">
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {p.about ? <AppText style={{ lineHeight: 24 }}>{p.about}</AppText> : null}
            {p.specialties && p.specialties.length > 0 && (
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {p.specialties.map((s) => (
                  <Pill key={s} label={s} tone="primary" />
                ))}
              </View>
            )}
            <Surface style={{ gap: 16 }}>
              <InfoRow icon="clock" title="Experience" body={`${years}+ years caring for pets`} />
              <InfoRow icon="file" tone="neutral" title="Education" body={EDU[seed % EDU.length]} />
              <InfoRow icon="shield" tone="success" title="Certifications" body={pick(CERTS, seed, 2).join(' · ')} />
              <InfoRow icon="message" tone="warning" title="Languages" body={['English', ...pick(LANGS.slice(1), seed, 2)].join(', ')} />
            </Surface>
          </View>
        </DetailSection>

        {/* Reviews */}
        <DetailSection eyebrow="Patients say" title="Ratings and reviews">
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <Surface>
              <RatingSummary rating={p.rating} count={p.reviewCount} />
            </Surface>
          </View>
          <HRail>
            {reviewsFor(p).map((r, i) => (
              <ReviewCard key={i} r={r} width={Math.min(300, width - 56)} />
            ))}
          </HRail>
        </DetailSection>

        {similar.length > 0 && (
          <DetailSection eyebrow="Compare" title="Similar providers">
            <HRail>
              {similar.map((x) => (
                <ProviderCard key={x.id} provider={x} variant="tile" onPress={() => open(x.id)} onBook={() => open(x.id)} />
              ))}
            </HRail>
          </DetailSection>
        )}

        <DetailSection eyebrow="Close to you" title="Nearby providers">
          <HRail>
            {nearby.map((x) => (
              <ProviderCard key={x.id} provider={x} variant="tile" onPress={() => open(x.id)} onBook={() => open(x.id)} />
            ))}
          </HRail>
        </DetailSection>

        {emergency.length > 0 && (
          <DetailSection eyebrow="Need help now" title="Emergency alternatives">
            <HRail>
              {emergency.map((x) => (
                <ProviderCard key={x.id} provider={x} variant="tile" onPress={() => open(x.id)} onBook={() => open(x.id)} />
              ))}
            </HRail>
          </DetailSection>
        )}
      </ScrollView>

      <FloatingBackButton />

      <View className="flex-row items-center bg-white dark:bg-surface-dark-2" style={{ padding: 14, gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(107,115,144,0.16)' }}>
        <View style={{ minWidth: 96 }}>
          <AppText variant="caption" muted>
            From
          </AppText>
          <AppText variant="h2">{inr(p.pricePerSession)}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Book now" fullWidth onPress={book} />
        </View>
      </View>
    </SafeAreaView>
  );
}
