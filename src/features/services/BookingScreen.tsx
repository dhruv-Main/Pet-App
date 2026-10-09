import React, { useCallback, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppText, Button, EmptyState, Icon, ScreenFallback } from '@components/ui';
import type { IconName } from '@components/ui';
import { ScreenHeader } from '@components/platform';
import { RemoteImage } from '@components/media';
import { Reveal } from '@components/premium';
import { emitBookingCreated } from '@platform/events';
import { providerAsset } from '@services/media/imageService';
import { useProvider, useProviders } from '@services/data';
import { useRequireAuth } from '@features/auth/useRequireAuth';
import { ProviderCard, TYPE_LABEL, isAvailableToday } from './components/ProviderCard';
import { HRail, Pill, Stars, hashOf } from '@features/shared/DetailKit';
import { Divider, Panel, SectionTitle, SuccessBurst, SummaryRow, Timeline, inr } from '@features/shared/CommerceKit';
import type { ServicesStackParamList } from '@navigation/types';
import type { ServiceProvider } from '@apptypes/domain';

const GROUPS: Array<{ title: string; icon: IconName; slots: string[] }> = [
  { title: 'Morning', icon: 'sparkles', slots: ['9:00 AM', '10:00 AM', '11:30 AM'] },
  { title: 'Afternoon', icon: 'home', slots: ['2:00 PM', '3:30 PM', '4:30 PM'] },
  { title: 'Evening', icon: 'moon', slots: ['6:00 PM', '7:30 PM', '8:30 PM'] },
];
const DURATION = '30 min';

const dayLabel = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
const dayLong = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

function ProviderHero({ p }: { p: ServiceProvider }) {
  const today = isAvailableToday(p);
  return (
    <Panel style={{ flexDirection: 'row', gap: 14, padding: 12 }}>
      <View style={{ width: 92, height: 92, borderRadius: 22, overflow: 'hidden' }}>
        <RemoteImage asset={providerAsset(p.id, p.name)} fill />
      </View>
      <View style={{ flex: 1, gap: 4, justifyContent: 'center' }}>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <AppText variant="h3" numberOfLines={1} style={{ flexShrink: 1 }}>
            {p.name}
          </AppText>
          {p.verified && <Icon name="check-circle" size={16} color="#1865f5" />}
        </View>
        <AppText variant="caption" muted numberOfLines={1}>
          {p.specialties?.[0] ?? TYPE_LABEL[p.type]}
          {p.experienceYears ? ` · ${p.experienceYears} yrs experience` : ''}
        </AppText>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <Stars value={p.rating} size={12} />
          <AppText variant="caption" style={{ fontWeight: '700' }}>
            {p.rating}
          </AppText>
          <AppText variant="caption" muted>
            ({p.reviewCount})
          </AppText>
        </View>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: today ? '#16a34a' : '#9ca3af' }} />
          <AppText variant="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>
            Next available {p.nextAvailable}
          </AppText>
        </View>
      </View>
    </Panel>
  );
}

export function BookingScreen() {
  const nav = useNavigation();
  const { requireAuth } = useRequireAuth();
  const route = useRoute<RouteProp<ServicesStackParamList, 'Booking'>>();
  const providerId = route.params?.providerId;
  const provider = useProvider(providerId).data;
  const others = useProviders().data;
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; day: Date; slot: string } | null>(null);

  const days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
      }),
    [],
  );
  const date = days[day];
  const seed = hashOf(`${providerId}${date.toDateString()}`);
  const booked = (s: string) => hashOf(s + seed) % 5 === 0;

  const confirm = useCallback(() => {
    if (!slot || done) return;
    const bookingId = `bk_${Date.now().toString(36)}`;
    emitBookingCreated({ bookingId, providerId: providerId ?? 'unknown', slot: `${dayLabel(date)} ${slot}` });
    setDone({ id: bookingId, day: date, slot });
    AccessibilityInfo.announceForAccessibility(`Booking confirmed for ${dayLabel(date)} at ${slot}`);
  }, [slot, done, providerId, date]);

  if (!provider) {
    return (
      <ScreenFallback>
        <EmptyState title="Provider not found" description="This provider is no longer available." actionLabel="Go back" onAction={() => nav.goBack()} />
      </ScreenFallback>
    );
  }

  if (done) {
    const where = provider.location ?? (provider.type === 'vet_teleconsult' ? 'Video consultation' : 'At the provider');
    const facts: Array<[IconName, string, string]> = [
      ['calendar', 'Date', dayLong(done.day)],
      ['clock', 'Time', `${done.slot} · ${DURATION}`],
      ['stethoscope', 'Appointment', TYPE_LABEL[provider.type]],
      ['pin', 'Location', where],
    ];
    const similar = others.filter((x) => x.id !== provider.id && x.type === provider.type).slice(0, 6);
    return (
      <SafeAreaView className="flex-1 bg-surface-light-2 dark:bg-surface-dark" edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <LinearGradient colors={['#052e16', '#15803d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 56, paddingBottom: 56, alignItems: 'center', gap: 4, paddingHorizontal: 24, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
            <SuccessBurst />
            <View style={{ marginTop: -40, alignItems: 'center', gap: 6 }}>
              <AppText accessibilityRole="header" center style={{ color: '#ffffff', fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 }}>
                Appointment confirmed
              </AppText>
              <AppText center style={{ color: 'rgba(255,255,255,0.85)' }}>
                {dayLong(done.day)} at {done.slot}
              </AppText>
            </View>
          </LinearGradient>

          {/* Ticket */}
          <View style={{ paddingHorizontal: 20, marginTop: -32, gap: 16 }}>
            <Reveal index={1}>
              <Panel style={{ padding: 0, overflow: 'hidden' }}>
                <View className="flex-row items-center" style={{ gap: 14, padding: 16 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 18, overflow: 'hidden' }}>
                    <RemoteImage asset={providerAsset(provider.id, provider.name)} fill />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <AppText variant="h3" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {provider.name}
                      </AppText>
                      {provider.verified && <Icon name="check-circle" size={16} color="#1865f5" />}
                    </View>
                    <AppText variant="caption" muted>
                      {provider.verified ? 'Verified provider' : TYPE_LABEL[provider.type]}
                    </AppText>
                  </View>
                </View>
                <View className="flex-row items-center" style={{ height: 20 }}>
                  <View style={{ width: 10, height: 20, backgroundColor: '#f1f3f9', borderTopRightRadius: 10, borderBottomRightRadius: 10 }} />
                  <View style={{ flex: 1, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(107,115,144,0.35)' }} />
                  <View style={{ width: 10, height: 20, backgroundColor: '#f1f3f9', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }} />
                </View>
                <View style={{ padding: 16, gap: 14 }}>
                  {facts.map(([icon, l, v]) => (
                    <View key={l} className="flex-row items-center" style={{ gap: 12 }}>
                      <Icon name={icon} size={18} color="#1865f5" />
                      <View style={{ flex: 1 }}>
                        <AppText variant="caption" muted>
                          {l}
                        </AppText>
                        <AppText variant="label">{v}</AppText>
                      </View>
                    </View>
                  ))}
                  <Divider />
                  <View className="flex-row items-center justify-between">
                    <View>
                      <AppText variant="caption" muted>
                        Booking ID
                      </AppText>
                      <AppText variant="label" selectable>
                        {done.id.replace('bk_', '#').toUpperCase()}
                      </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <AppText variant="caption" muted>
                        Fee
                      </AppText>
                      <AppText variant="label">{inr(provider.pricePerSession)}</AppText>
                    </View>
                  </View>
                </View>
              </Panel>
            </Reveal>

            <Panel>
              <SectionTitle eyebrow="What happens next" title="Your appointment" />
              <Timeline
                steps={[
                  { title: 'Appointment confirmed', body: `${dayLong(done.day)}, ${done.slot}.`, done: true },
                  { title: 'Reminder', body: 'We will remind you before your appointment.', done: true },
                  { title: 'Ready for consultation', body: 'Have your pet’s records and any questions handy.', done: false },
                ]}
              />
            </Panel>

            <Panel style={{ gap: 12 }}>
              <SectionTitle title="Before you go" />
              {([
                ['file', 'Keep records handy', 'Vaccination history and recent reports help the visit.'],
                ['clock', 'Arrive a few minutes early', 'Join or arrive 5 minutes ahead to settle in.'],
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

            <View style={{ gap: 10 }}>
              <Button label="Done" fullWidth size="lg" onPress={() => (nav as unknown as { navigate: (n: string) => void }).navigate('ServicesHome')} />
              <Button label="Back to provider" variant="secondary" fullWidth onPress={() => nav.goBack()} />
            </View>
          </View>

          {similar.length > 0 && (
            <View style={{ paddingTop: 28 }}>
              <View style={{ paddingHorizontal: 20 }}>
                <SectionTitle eyebrow="Explore" title="More providers" />
              </View>
              <HRail>
                {similar.map((x) => (
                  <ProviderCard
                    key={x.id}
                    provider={x}
                    variant="tile"
                    onPress={() => (nav as unknown as { navigate: (n: string, p: object) => void }).navigate('ProviderDetail', { providerId: x.id })}
                    onBook={() => (nav as unknown as { navigate: (n: string, p: object) => void }).navigate('ProviderDetail', { providerId: x.id })}
                  />
                ))}
              </HRail>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader title="Book appointment" subtitle={provider.name} onBack={() => nav.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 32 }}>
        <ProviderHero p={provider} />

        {/* Calendar */}
        <View>
          <SectionTitle eyebrow="Step 1" title="Choose a date" />
          <AppText variant="label" style={{ marginBottom: 10 }}>
            {date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="radiogroup" contentContainerStyle={{ gap: 10 }}>
            {days.map((d, i) => {
              const sel = i === day;
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    setDay(i);
                    setSlot(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={dayLong(d)}
                  accessibilityState={{ selected: sel, checked: sel }}
                  style={{
                    width: 64,
                    height: 84,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    backgroundColor: sel ? '#0b0f1a' : '#ffffff',
                    borderWidth: 1,
                    borderColor: sel ? '#0b0f1a' : 'rgba(107,115,144,0.18)',
                  }}
                >
                  <AppText variant="caption" style={{ color: sel ? 'rgba(255,255,255,0.7)' : '#6b7390', fontWeight: '600' }}>
                    {i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </AppText>
                  <AppText style={{ color: sel ? '#ffffff' : '#0b0f1a', fontSize: 22, fontWeight: '800' }}>{d.getDate()}</AppText>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: sel ? '#22c55e' : 'transparent' }} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Slots */}
        <View style={{ gap: 18 }}>
          <SectionTitle eyebrow="Step 2" title="Choose a time" />
          {GROUPS.map((g) => (
            <View key={g.title} style={{ gap: 10 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Icon name={g.icon} size={15} color="#6b7390" />
                <AppText variant="label">{g.title}</AppText>
              </View>
              <View className="flex-row flex-wrap" style={{ gap: 10 }} accessibilityRole="radiogroup">
                {g.slots.map((s) => {
                  const taken = booked(s);
                  const sel = slot === s;
                  return (
                    <Pressable
                      key={s}
                      disabled={taken}
                      onPress={() => setSlot(s)}
                      accessibilityRole="radio"
                      accessibilityLabel={`${s}${taken ? ', unavailable' : ''}`}
                      accessibilityState={{ selected: sel, checked: sel, disabled: taken }}
                      style={{
                        minWidth: '30%',
                        flexGrow: 1,
                        height: 48,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: sel ? '#1865f5' : taken ? 'rgba(107,115,144,0.08)' : '#ffffff',
                        borderWidth: 1,
                        borderColor: sel ? '#1865f5' : 'rgba(107,115,144,0.18)',
                      }}
                    >
                      <AppText variant="label" style={{ color: sel ? '#ffffff' : taken ? '#9ca3af' : '#0b0f1a', textDecorationLine: taken ? 'line-through' : 'none' }}>
                        {s}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <Panel style={{ gap: 6 }} accessible accessibilityLabel={`Summary: ${provider.name}, ${dayLong(date)}${slot ? ` at ${slot}` : ', no time selected'}`}>
          <SectionTitle eyebrow="Step 3" title="Appointment summary" />
          <SummaryRow label="Provider" value={provider.name} />
          <SummaryRow label="Date" value={dayLong(date)} />
          <SummaryRow label="Time" value={slot ?? 'Select a time'} />
          <SummaryRow label="Duration" value={DURATION} />
          <Divider />
          <SummaryRow strong label="Fee" value={inr(provider.pricePerSession)} />
          <View style={{ marginTop: 8 }}>
            <Pill label={provider.verified ? 'Verified provider' : TYPE_LABEL[provider.type]} icon="check" tone="success" />
          </View>
        </Panel>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="bg-white dark:bg-surface-dark-2" style={{ borderTopWidth: 1, borderTopColor: 'rgba(107,115,144,0.16)' }}>
        <View style={{ padding: 14, gap: 8 }}>
          <View className="flex-row items-center justify-between">
            <AppText variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>
              {slot ? `${dayLabel(date)} · ${slot}` : 'Select a time to continue'}
            </AppText>
            <AppText variant="h3">{inr(provider.pricePerSession)}</AppText>
          </View>
          <Button label="Confirm appointment" fullWidth size="lg" disabled={!slot} onPress={() => requireAuth(confirm, 'Sign in to confirm your booking.')} />
        </View>
      </SafeAreaView>
    </View>
  );
}
