import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { AppText, Card, Badge, Button, SectionHeader } from '@components/ui';
import { PetHeroBanner } from '@components/media';
import { CapabilityCard, ScreenHeader, VerificationChip } from '@components/platform';
import { useSelector } from 'react-redux';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { selectPendingCount } from '@features/agent/agentSelectors';
import { selectConsentProfile } from '@features/consent/consentSlice';
import { useGetPassportQuery, useGetTwinSnapshotQuery } from '@services/api/platformApi';
import { usePet, useHealthRecords } from '@services/data';
import { formatFullDate } from '@/demo/demoData';
import type { Pet } from '@apptypes/domain';
import { EmptyState, ScreenFallback } from '@components/ui';
import type { HomeStackParamList } from '@navigation/types';

export function PetProfileScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'PetProfile'>>();
  const pet = usePet(route.params?.petId).data;
  if (!pet) {
    return (
      <ScreenFallback>
        <EmptyState title="Pet not found" description="This pet profile is no longer available." />
      </ScreenFallback>
    );
  }
  return <PetProfileContent pet={pet} />;
}

function PetProfileContent({ pet }: { pet: Pet }) {
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const pending = useSelector(selectPendingCount);
  const consent = useSelector(selectConsentProfile);
  const passport = useGetPassportQuery({ petId: pet.id });
  const twin = useGetTwinSnapshotQuery({ petId: pet.id });
  const records = useHealthRecords(pet.id).data;

  const grantedCount = consent ? Object.values(consent.grants).filter((g) => g.granted).length : 0;
  const totalConsents = consent ? Object.keys(consent.grants).length : 0;

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader title={pet.name} subtitle="Pet profile" onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-4" style={{ gap: 12 }}>
          <PetHeroBanner pet={pet} />
          {passport.data && (
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <VerificationChip status={passport.data.identity.status} />
              <AppText variant="caption" muted>
                Passport {passport.data.identity.passportId}
              </AppText>
            </View>
          )}
        </View>

        <SectionHeader title="Pet OS" />
        <View className="flex-row flex-wrap px-4" style={{ gap: 12 }}>
          <CapabilityCard
            icon="shield"
            title="Passport"
            status={
              passport.data
                ? `${passport.data.credentials.length} credentials, ${passport.data.identity.tier.replace('_', ' ')}`
                : 'Identity and credentials'
            }
            tone="primary"
            onPress={() => nav.navigate('Passport', { petId: pet.id })}
          />
          <CapabilityCard
            icon="activity"
            title="Digital Twin"
            status={twin.data ? `Wellness ${twin.data.risk.overall} of 100` : 'Health model and trends'}
            tone="success"
            onPress={() => nav.navigate('TwinDashboard', { petId: pet.id })}
          />
          <CapabilityCard
            icon="lock"
            title="Consent Center"
            status={totalConsents ? `${grantedCount} of ${totalConsents} data uses allowed` : 'Control your data'}
            tone="neutral"
            onPress={() => nav.navigate('ConsentCenter')}
          />
          <CapabilityCard
            icon="bot"
            title="Agent Center"
            status={pending ? 'Actions waiting for you' : 'No pending approvals'}
            tone="warning"
            count={pending}
            onPress={() => nav.navigate('AgentCenter')}
          />
        </View>

        <SectionHeader title="Vital info" />
        <View className="flex-row flex-wrap px-5" style={{ gap: 10 }}>
          {[
            ['Weight', `${pet.weightKg} kg`],
            ['Age', pet.ageMonths >= 24 ? `${Math.floor(pet.ageMonths / 12)} yr ${pet.ageMonths % 12} mo` : `${pet.ageMonths} mo`],
            ['Allergies', pet.allergies.join(', ') || 'None'],
            ['Conditions', pet.medicalConditions.join(', ') || 'None'],
            ['Insurance', pet.insuranceProvider ?? 'Not added'],
          ].map(([k, v]) => (
            <Card key={k} className="flex-1" style={{ minWidth: 150 }}>
              <AppText variant="caption" muted>
                {k}
              </AppText>
              <AppText variant="h3">{v}</AppText>
            </Card>
          ))}
        </View>

        <SectionHeader title="Vaccinations" />
        <View className="px-5" style={{ gap: 10 }}>
          {[...pet.vaccinations]
            .sort((a, b) => b.dueAt.localeCompare(a.dueAt))
            .map((v) => (
              <Card key={v.id} className="flex-row items-center justify-between">
                <View style={{ flex: 1 }}>
                  <AppText variant="label">{v.name}</AppText>
                  <AppText variant="caption" muted>
                    {v.status === 'completed' && v.administeredAt
                      ? `Given ${formatFullDate(v.administeredAt)}`
                      : `Due ${formatFullDate(v.dueAt)}`}
                  </AppText>
                </View>
                <Badge
                  label={v.status}
                  tone={v.status === 'completed' ? 'success' : v.status === 'overdue' ? 'danger' : 'warning'}
                />
              </Card>
            ))}
        </View>

        <SectionHeader title="Medical history" />
        <View className="px-5" style={{ gap: 10 }}>
          {records.map((r) => (
            <Card key={r.id} style={{ gap: 4 }}>
              <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                <AppText variant="label" style={{ flex: 1 }}>
                  {r.title}
                </AppText>
                <Badge label={r.type} tone="primary" />
              </View>
              <AppText variant="caption" muted>
                {formatFullDate(r.date)} | {r.provider}
                {r.cost ? ` | ₹${r.cost.toLocaleString('en-IN')}` : ''}
              </AppText>
              <AppText variant="caption">{r.notes}</AppText>
            </Card>
          ))}
        </View>

        <View className="px-5 pt-6" style={{ gap: 10 }}>
          <Button label="Open passport and credentials" variant="secondary" fullWidth onPress={() => nav.navigate('Passport', { petId: pet.id })} />
          <Button label="Book vet appointment" fullWidth onPress={() => nav.getParent()?.navigate('ServicesTab' as never)} />
        </View>
      </ScrollView>
    </View>
  );
}
