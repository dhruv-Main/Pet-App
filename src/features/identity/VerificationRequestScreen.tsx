import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import type { VerificationMethod, VerificationRequestStatus } from '@apptypes/platform';
import { AppText, Badge, Button, Card, Icon, IconBadge, Input, Skeleton } from '@components/ui';
import type { IconName } from '@components/ui';
import { ScreenHeader } from '@components/platform';
import { useFeatureFlags } from '@platform/config/featureFlags';
import {
  useGetVerificationHistoryQuery,
  useSubmitVerificationRequestMutation,
} from '@services/api/platformApi';
import { usePet } from '@services/data';
import type { Pet } from '@apptypes/domain';
import { EmptyState, ScreenFallback } from '@components/ui';
import { verificationCatalog } from '@services/mock/platformFixtures';
import { useTheme } from '@theme/ThemeProvider';

const METHOD_ICON: Record<VerificationMethod, IconName> = {
  vet: 'stethoscope',
  microchip: 'cpu',
  dna: 'dna',
  biometric: 'scan-face',
};

const STATUS_TONE: Record<VerificationRequestStatus, 'primary' | 'warning' | 'success' | 'danger'> = {
  submitted: 'primary',
  in_review: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const STATUS_LABEL: Record<VerificationRequestStatus, string> = {
  submitted: 'Submitted',
  in_review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function VerificationRequestScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'VerificationRequest'>>();
  const pet = usePet(route.params?.petId).data;
  if (!pet) {
    return (
      <ScreenFallback>
        <EmptyState title="Pet not found" description="This pet is no longer available." />
      </ScreenFallback>
    );
  }
  return <VerificationRequestContent pet={pet} />;
}

function VerificationRequestContent({ pet }: { pet: Pet }) {
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const petId = pet.id;
  const { flags } = useFeatureFlags();
  const { theme } = useTheme();

  const methods = useMemo(
    () =>
      verificationCatalog.filter((m) => {
        if (m.method === 'vet') return flags.vetVerification;
        if (m.method === 'microchip') return flags.microchipVerification;
        if (m.method === 'dna') return flags.dnaVerification;
        return true;
      }),
    [flags],
  );

  const [selected, setSelected] = useState<VerificationMethod>(methods[0]?.method ?? 'biometric');
  const [note, setNote] = useState('');
  const history = useGetVerificationHistoryQuery({ petId });
  const [submit, { isLoading: submitting, error: submitError }] = useSubmitVerificationRequestMutation();

  const selectedDetail = methods.find((m) => m.method === selected);
  const conflict = (submitError as { status?: number } | undefined)?.status === 409;

  const onSubmit = async () => {
    const res = await submit({ petId, method: selected, note: note.trim() || undefined });
    if ('data' in res) setNote('');
  };

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader title="Request verification" subtitle={pet.name} onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
        <View style={{ gap: 10 }} accessibilityRole="radiogroup">
          <AppText variant="h3" accessibilityRole="header">
            Choose a method
          </AppText>
          {methods.map((m) => {
            const active = m.method === selected;
            return (
              <Pressable
                key={m.method}
                onPress={() => setSelected(m.method)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${m.title}. ${m.assurance} assurance. ${m.turnaround}.`}
              >
                <Card
                  className="flex-row items-center"
                  style={{
                    gap: 12,
                    borderWidth: 2,
                    borderColor: active ? theme.colors.primary : 'transparent',
                  }}
                >
                  <IconBadge name={METHOD_ICON[m.method]} tone={active ? 'primary' : 'neutral'} />
                  <View className="flex-1">
                    <AppText variant="label">{m.title}</AppText>
                    <AppText variant="caption" muted>
                      {m.assurance} assurance, {m.turnaround}
                    </AppText>
                  </View>
                  {active && <Icon name="check-circle" size={20} color={theme.colors.primary} />}
                </Card>
              </Pressable>
            );
          })}
        </View>

        {selectedDetail && (
          <Card style={{ gap: 10 }}>
            <AppText variant="label">What you will need</AppText>
            {selectedDetail.requirements.map((r) => (
              <View key={r} className="flex-row items-center" style={{ gap: 8 }}>
                <Icon name="check" size={14} color={theme.colors.textMuted} />
                <AppText variant="caption" muted className="flex-1">
                  {r}
                </AppText>
              </View>
            ))}
            <Input
              label="Note for the reviewer (optional)"
              value={note}
              onChangeText={setNote}
              maxLength={240}
              multiline
              placeholder="Anything that helps the review"
            />
            {conflict && (
              <AppText variant="caption" style={{ color: '#b91c1c' }} accessibilityRole="alert">
                A request for this method is already open.
              </AppText>
            )}
            <Button label="Submit request" loading={submitting} onPress={onSubmit} />
          </Card>
        )}

        <View style={{ gap: 10 }}>
          <AppText variant="h3" accessibilityRole="header">
            Verification history
          </AppText>
          {history.isLoading && <Skeleton height={72} radius={16} />}
          {history.data?.length === 0 && <AppText muted>No requests yet.</AppText>}
          {history.data?.map((v) => {
            const meta = verificationCatalog.find((m) => m.method === v.method);
            return (
              <Card key={v.id} style={{ gap: 6 }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Icon name={METHOD_ICON[v.method]} size={16} />
                    <AppText variant="label">{meta?.title ?? v.method}</AppText>
                  </View>
                  <Badge label={STATUS_LABEL[v.status]} tone={STATUS_TONE[v.status]} />
                </View>
                <AppText variant="caption" muted>
                  Submitted {fmtDate(v.submittedAt)}, updated {fmtDate(v.updatedAt)}
                  {v.reviewer ? `, reviewed by ${v.reviewer}` : ''}
                </AppText>
                {v.note && (
                  <AppText variant="caption" muted>
                    {v.note}
                  </AppText>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
