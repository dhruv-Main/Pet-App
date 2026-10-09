import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppText, Button, Icon, SelectChip } from '@components/ui';
import { ScreenHeader } from '@components/platform';
import { RemoteImage } from '@components/media';
import { hubAsset } from '@services/media/imageService';
import { Panel } from '@features/shared/CommerceKit';
import { LinearGradient } from 'expo-linear-gradient';
import type { IconName } from '@components/ui';

export const MAX_W = 920;

/** Standard hub page: header, centred scroll body and an optional sticky footer. */
export function Page({
  title,
  subtitle,
  children,
  footer,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const nav = useNavigation();
  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        right={right}
        onBack={onBack ?? (() => (nav.canGoBack() ? nav.goBack() : (nav as unknown as { navigate: (n: string) => void }).navigate('Dashboard')))}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: footer ? 150 : 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: MAX_W, alignSelf: 'center', paddingHorizontal: 20, gap: 16 }}>{children}</View>
      </ScrollView>
      {footer ? (
        <View
          className="bg-white dark:bg-surface-dark-2"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, borderColor: 'rgba(107,115,144,0.16)' }}
        >
          <View style={{ width: '100%', maxWidth: MAX_W, alignSelf: 'center' }}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}

export function HubImage({ id, alt, height = 180, radius = 22 }: { id: string; alt: string; height?: number; radius?: number }) {
  return (
    <View style={{ height, borderRadius: radius, overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
      <RemoteImage asset={hubAsset(id, alt)} fill />
    </View>
  );
}

export function Banner({ img, icon, eyebrow, title, body }: { img: string; icon: IconName; eyebrow: string; title: string; body: string }) {
  return (
    <View style={{ height: 210, borderRadius: 28, overflow: 'hidden', backgroundColor: '#0b0f1a' }}>
      <RemoteImage asset={hubAsset(img, title, 16 / 9)} fill priority="high" />
      <LinearGradient colors={['rgba(11,15,26,0.1)', 'rgba(11,15,26,0.9)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', left: 18, right: 18, bottom: 16, gap: 4 }}>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <Icon name={icon} size={14} color="#ffffff" />
          <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {eyebrow}
          </AppText>
        </View>
        <AppText variant="h1" style={{ color: '#fff' }}>
          {title}
        </AppText>
        <AppText variant="label" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '400' }}>
          {body}
        </AppText>
      </View>
    </View>
  );
}

export function Chips({ options, value, onChange, all }: { options: string[]; value: string | null; onChange: (v: string | null) => void; all?: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {all ? <SelectChip label={all} selected={value === null} onPress={() => onChange(null)} /> : null}
      {options.map((o) => (
        <SelectChip key={o} label={o} selected={value === o} onPress={() => onChange(value === o && all ? null : o)} />
      ))}
    </ScrollView>
  );
}

/** Wrapping choice group used by forms. */
export function ChoiceGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string | undefined; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="label">{label}</AppText>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {options.map((o) => (
          <SelectChip key={o} label={o} selected={value === o} onPress={() => onChange(o)} />
        ))}
      </View>
    </View>
  );
}

export function Stat({ label, value, icon }: { label: string; value: string; icon?: IconName }) {
  return (
    <Panel style={{ flexGrow: 1, flexBasis: '45%', padding: 14, gap: 4 }} accessible accessibilityLabel={`${label}: ${value}`}>
      <View className="flex-row items-center" style={{ gap: 6 }}>
        {icon ? <Icon name={icon} size={14} /> : null}
        <AppText variant="caption" muted>
          {label}
        </AppText>
      </View>
      <AppText variant="label">{value}</AppText>
    </Panel>
  );
}

export function Row({ icon, title, body, right, onPress }: { icon: IconName; title: string; body?: string; right?: React.ReactNode; onPress?: () => void }) {
  const inner = (
    <View className="flex-row items-center" style={{ gap: 12 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(24,101,245,0.1)' }}>
        <Icon name={icon} size={18} color="#1865f5" />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="label">{title}</AppText>
        {body ? (
          <AppText variant="caption" muted>
            {body}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={{ minHeight: 48, justifyContent: 'center' }}>
      {inner}
    </Pressable>
  ) : (
    <View style={{ minHeight: 48, justifyContent: 'center' }}>{inner}</View>
  );
}

export function Empty({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <Panel style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
      <AppText variant="h3" center>
        {title}
      </AppText>
      <AppText muted center>
        {body}
      </AppText>
      {action && onAction ? <Button label={action} variant="secondary" onPress={onAction} /> : null}
    </Panel>
  );
}
