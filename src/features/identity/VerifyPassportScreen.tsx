import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { AppText, Button, Card, ErrorState, Icon, IconBadge, Skeleton } from '@components/ui';
import { PassportQRCard, ScreenHeader, VerificationChip } from '@components/platform';
import { useLookupPassportQuery } from '@services/api/platformApi';

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/** Result of resolving a scanned or shared passport code. Read-only view of public credentials. */
export function VerifyPassportScreen() {
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { code } = useRoute<RouteProp<HomeStackParamList, 'VerifyPassport'>>().params;
  const { data, isLoading, isError, error, refetch } = useLookupPassportQuery({ code });

  const notFound = isError && (error as { status?: number } | undefined)?.status === 404;
  const trusted = data?.identity.status === 'verified';

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader title="Passport check" subtitle={code} onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
        {isLoading && (
          <View style={{ gap: 12 }}>
            <Skeleton height={96} radius={16} />
            <Skeleton height={170} radius={16} />
          </View>
        )}

        {notFound && (
          <Card style={{ gap: 12 }} accessibilityRole="alert">
            <IconBadge name="x-circle" tone="danger" size={44} />
            <AppText variant="h3">Passport not recognised</AppText>
            <AppText muted>
              No passport matches this code. It may be mistyped, revoked, or not issued by Pet OS. Do not rely on it as proof of identity.
            </AppText>
            <Button label="Scan again" onPress={() => nav.replace('QRScanner')} />
          </Card>
        )}

        {isError && !notFound && <ErrorState message="Could not reach the verification service." onRetry={refetch} />}

        {data && (
          <>
            <Card
              style={{ gap: 12 }}
              accessible
              accessibilityRole="summary"
              accessibilityLabel={`${trusted ? 'Verified' : 'Not fully verified'} passport for ${data.petName}`}
            >
              <View className="flex-row items-center" style={{ gap: 12 }}>
                <IconBadge name={trusted ? 'shield' : 'alert'} tone={trusted ? 'success' : 'warning'} size={48} />
                <View className="flex-1">
                  <AppText variant="h3">{trusted ? 'Verified passport' : 'Not fully verified'}</AppText>
                  <AppText variant="caption" muted>
                    {data.identity.verifiedBy
                      ? `${data.identity.verifiedBy}, ${fmtDate(data.identity.verifiedAt)}`
                      : 'No verifier on record'}
                  </AppText>
                </View>
                <VerificationChip status={data.identity.status} />
              </View>
            </Card>

            <PassportQRCard identity={data.identity} petName={data.petName} />

            <View style={{ gap: 8 }}>
              <AppText variant="h3" accessibilityRole="header">
                Public credentials
              </AppText>
              {data.credentials.length === 0 && <AppText muted>No credentials shared.</AppText>}
              {data.credentials.map((c) => (
                <Card key={c.id} className="flex-row items-center" style={{ gap: 12 }}>
                  <Icon name={c.type === 'vaccination' ? 'syringe' : c.type === 'insurance' ? 'shield' : 'file'} size={20} />
                  <View className="flex-1">
                    <AppText variant="label">{c.title}</AppText>
                    <AppText variant="caption" muted>
                      {c.issuer}
                      {c.expiresAt ? `, valid to ${fmtDate(c.expiresAt)}` : ''}
                    </AppText>
                  </View>
                  <VerificationChip status={c.status} />
                </Card>
              ))}
            </View>
            <AppText variant="caption" muted>
              Owner contact details and medical records are never shown on a public check.
            </AppText>
          </>
        )}
      </ScrollView>
    </View>
  );
}
