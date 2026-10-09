import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HomeStackParamList } from '@navigation/types';
import { ASSURANCE_TIERS, AssuranceTier } from '@apptypes/platform';
import { AppText, Badge, Button, Card, ErrorState, Icon, IconBadge, IconButton, Skeleton } from '@components/ui';
import { PassportQRCard, ScreenHeader, VerificationChip } from '@components/platform';
import {
  useGetPassportQuery,
  useGetVerificationHistoryQuery,
  useRequestVerificationMutation,
} from '@services/api/platformApi';
import { useFeatureFlag } from '@platform/config/featureFlags';
import { usePet } from '@services/data';
import type { Pet } from '@apptypes/domain';
import { EmptyState, ScreenFallback } from '@components/ui';
import { useTheme } from '@theme/ThemeProvider';

const TIER_COPY: Record<AssuranceTier, { title: string; detail: string }> = {
  self_declared: { title: 'Self declared', detail: 'Owner provided details' },
  biometric: { title: 'Biometric', detail: 'Nose print or face match' },
  microchip: { title: 'Microchip', detail: 'ISO chip read by a vet' },
  dna: { title: 'DNA', detail: 'Lab verified lineage' },
  registry: { title: 'Registry', detail: 'Government or kennel registry' },
};

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export function PassportScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'Passport'>>();
  const pet = usePet(route.params?.petId).data;
  if (!pet) {
    return (
      <ScreenFallback>
        <EmptyState title="Pet not found" description="This pet is no longer available." />
      </ScreenFallback>
    );
  }
  return <PassportContent pet={pet} />;
}

function PassportContent({ pet }: { pet: Pet }) {
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const petId = pet.id;
  const { theme } = useTheme();

  const { data, isLoading, isError, refetch } = useGetPassportQuery({ petId });
  const [verify, { isLoading: verifying }] = useRequestVerificationMutation();
  const scannerOn = useFeatureFlag('passportScanner');
  const requestsOn = useFeatureFlag('verificationRequests');
  const history = useGetVerificationHistoryQuery({ petId }, { skip: !requestsOn });

  const currentRank = data ? ASSURANCE_TIERS.indexOf(data.identity.tier) : 0;
  const nextTier = ASSURANCE_TIERS[currentRank + 1] as AssuranceTier | undefined;

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader
        title="Pet Passport"
        subtitle={pet.name}
        onBack={() => nav.goBack()}
        right={
          scannerOn ? (
            <IconButton icon="scan" label="Scan a passport" onPress={() => nav.navigate('QRScanner')} />
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
        {isLoading && (
          <View style={{ gap: 12 }}>
            <Skeleton height={170} radius={16} />
            <Skeleton height={120} radius={16} />
          </View>
        )}
        {isError && <ErrorState message="Passport could not be loaded." onRetry={refetch} />}
        {data && (
          <>
            <PassportQRCard identity={data.identity} petName={pet.name} />

            <Card style={{ gap: 12 }}>
              <AppText variant="h3">Assurance level</AppText>
              {ASSURANCE_TIERS.map((tier, i) => {
                const reached = i <= currentRank;
                return (
                  <View key={tier} className="flex-row items-center" style={{ gap: 12 }}>
                    <IconBadge name={reached ? 'check-circle' : 'dot'} tone={reached ? 'success' : 'neutral'} size={32} />
                    <View className="flex-1">
                      <AppText variant="label">{TIER_COPY[tier].title}</AppText>
                      <AppText variant="caption" muted>
                        {TIER_COPY[tier].detail}
                      </AppText>
                    </View>
                  </View>
                );
              })}
              {nextTier && nextTier !== 'dna' && nextTier !== 'registry' && (
                <Button
                  label={`Verify with ${TIER_COPY[nextTier].title.toLowerCase()}`}
                  loading={verifying}
                  onPress={() => verify({ petId, tier: nextTier })}
                  leftIcon={<Icon name="scan-face" size={18} color="#fff" />}
                />
              )}
              {data.identity.verifiedBy && (
                <AppText variant="caption" muted>
                  Verified by {data.identity.verifiedBy} on {fmtDate(data.identity.verifiedAt)}
                </AppText>
              )}
            </Card>

            <View style={{ gap: 8 }}>
              <AppText variant="h3" accessibilityRole="header">
                Credentials
              </AppText>
              {data.credentials.length === 0 && (
                <AppText muted>No credentials issued yet.</AppText>
              )}
              {data.credentials.map((c) => (
                <Card key={c.id} className="flex-row items-center" style={{ gap: 12 }}>
                  <IconBadge name={c.type === 'insurance' ? 'shield' : c.type === 'vaccination' ? 'syringe' : 'cpu'} />
                  <View className="flex-1" style={{ gap: 2 }}>
                    <AppText variant="label">{c.title}</AppText>
                    <AppText variant="caption" muted>
                      {c.issuer}
                      {c.expiresAt ? `, valid to ${fmtDate(c.expiresAt)}` : ''}
                    </AppText>
                    <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
                      Signature {c.signatureFingerprint}
                    </AppText>
                  </View>
                  <VerificationChip status={c.status} />
                </Card>
              ))}
            </View>

            {requestsOn && (
              <Card style={{ gap: 12 }}>
                <View className="flex-row items-center justify-between">
                  <AppText variant="h3" accessibilityRole="header">
                    Verification
                  </AppText>
                  <Badge label={`${history.data?.length ?? 0} requests`} tone="neutral" />
                </View>
                {history.data?.slice(0, 2).map((v) => (
                  <View key={v.id} className="flex-row items-center justify-between">
                    <AppText variant="caption" className="capitalize">
                      {v.method} verification
                    </AppText>
                    <AppText variant="caption" muted>
                      {v.status.replace('_', ' ')}
                    </AppText>
                  </View>
                ))}
                <Button
                  label="Request verification"
                  variant="secondary"
                  onPress={() => nav.navigate('VerificationRequest', { petId })}
                />
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
