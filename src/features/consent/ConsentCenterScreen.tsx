import React, { useCallback } from 'react';
import { AccessibilityInfo, ScrollView, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import type { ConsentPurpose } from '@apptypes/platform';
import { AppText, Card, Icon, IconBadge } from '@components/ui';
import type { IconName } from '@components/ui';
import { ScreenHeader } from '@components/platform';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { updateConsent } from './consentThunks';
import { selectConsentProfile } from './consentSlice';

const PURPOSES: { key: ConsentPurpose; icon: IconName; title: string; detail: string }[] = [
  {
    key: 'health_data',
    icon: 'heart-pulse',
    title: 'Health records sharing',
    detail: 'Share records with vets and clinics you book. Revoke at any time.',
  },
  {
    key: 'insurance',
    icon: 'shield',
    title: 'Insurance data sharing',
    detail: 'Allow your insurer to receive claim evidence and health summaries.',
  },
  {
    key: 'device',
    icon: 'radio',
    title: 'Device telemetry',
    detail: 'Collect activity, sleep and feeding data from connected devices.',
  },
  {
    key: 'research',
    icon: 'brain',
    title: 'Anonymised research',
    detail: 'Contribute de-identified data to veterinary research cohorts.',
  },
  {
    key: 'brand',
    icon: 'gift',
    title: 'Brand offers',
    detail: 'Let brands send tailored offers. No raw data leaves your account.',
  },
];

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

type Purpose = (typeof PURPOSES)[number];

const ConsentRow = React.memo(function ConsentRow({
  purpose,
  granted,
  updatedAt,
  onToggle,
}: {
  purpose: Purpose;
  granted: boolean;
  updatedAt: string;
  onToggle: (key: ConsentPurpose, value: boolean) => void;
}) {
  return (
    <Card className="min-h-[64px] flex-row items-center" style={{ gap: 12 }}>
      <IconBadge name={purpose.icon} tone={granted ? 'primary' : 'neutral'} />
      <View className="flex-1" style={{ gap: 2 }}>
        <AppText variant="label">{purpose.title}</AppText>
        <AppText variant="caption" muted>
          {purpose.detail}
        </AppText>
        <AppText variant="caption" muted>
          Updated {fmt(updatedAt)}
        </AppText>
      </View>
      <Switch
        value={granted}
        onValueChange={(v) => onToggle(purpose.key, v)}
        accessibilityRole="switch"
        accessibilityLabel={purpose.title}
        accessibilityHint={purpose.detail}
        accessibilityState={{ checked: granted }}
      />
    </Card>
  );
});

export function ConsentCenterScreen() {
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectConsentProfile);

  const onToggle = useCallback(
    (key: ConsentPurpose, value: boolean) => {
      dispatch(updateConsent(key, value));
      const title = PURPOSES.find((p) => p.key === key)?.title ?? 'Consent';
      AccessibilityInfo.announceForAccessibility(`${title} ${value ? 'enabled' : 'disabled'}`);
    },
    [dispatch],
  );

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader title="Consent Center" subtitle={`Policy version ${profile.version}`} onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}>
        <Card className="flex-row items-center" style={{ gap: 12 }}>
          <Icon name="lock" size={20} color="#1865f5" />
          <AppText variant="caption" muted className="flex-1">
            Every share is purpose bound and recorded. Changes apply immediately to all connected services.
          </AppText>
        </Card>
        {PURPOSES.map((p) => {
          const grant = profile.grants[p.key];
          return (
            <ConsentRow
              key={p.key}
              purpose={p}
              granted={!!grant?.granted}
              updatedAt={grant?.updatedAt ?? new Date(0).toISOString()}
              onToggle={onToggle}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
