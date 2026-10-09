import React from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RiskLevel, VerificationStatus } from '@apptypes/platform';
import { AppText, Badge, Card, Icon, IconBadge, toneColor } from '@components/ui';
import type { IconName } from '@components/ui';
import { gradients } from '@theme/tokens';
import { useTheme } from '@theme/ThemeProvider';

type Tone = keyof typeof toneColor;

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row items-center px-4 pb-3"
      style={{ paddingTop: insets.top + 8, gap: 12 }}
    >
      {onBack && (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10"
        >
          <Icon name="back" size={20} />
        </Pressable>
      )}
      <View className="flex-1">
        <AppText variant="h2" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="caption" muted numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
      </View>
      {right}
    </View>
  );
}

/** Vector hero panel: navy gradient with a large watermark icon. No raster assets required. */
export function HeroPanel({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: IconName;
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={gradients.aurora}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 24, padding: 20, overflow: 'hidden' }}
    >
      <View style={{ position: 'absolute', right: -16, top: -16, opacity: 0.12 }}>
        <Icon name={icon} size={150} color="#ffffff" strokeWidth={1.25} />
      </View>
      {eyebrow && (
        <AppText variant="caption" className="font-semibold uppercase text-white/70">
          {eyebrow}
        </AppText>
      )}
      <AppText variant="h1" className="mt-1 text-white">
        {title}
      </AppText>
      {children}
    </LinearGradient>
  );
}

export function MetricTile({
  icon,
  label,
  value,
  hint,
  tone = 'primary',
}: {
  icon: IconName;
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <Card className="flex-1" style={{ gap: 10 }} accessible accessibilityLabel={`${label}: ${value}${hint ? `, ${hint}` : ''}`}>
      <IconBadge name={icon} tone={tone} size={40} />
      <View>
        <AppText variant="h3">{value}</AppText>
        <AppText variant="caption" muted>
          {label}
        </AppText>
        {hint && (
          <AppText variant="caption" muted>
            {hint}
          </AppText>
        )}
      </View>
    </Card>
  );
}

const riskTone: Record<RiskLevel, Tone> = {
  low: 'success',
  moderate: 'warning',
  elevated: 'warning',
  high: 'danger',
};

export const riskLabel: Record<RiskLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  elevated: 'Elevated',
  high: 'High',
};

export function RiskIndicator({
  level,
  score,
  label,
  confidence,
}: {
  level: RiskLevel;
  score: number;
  label: string;
  confidence?: number;
}) {
  const color = toneColor[riskTone[level]].fg;
  const { theme } = useTheme();
  return (
    <View
      style={{ gap: 6 }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}, ${riskLabel[level]} risk`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(score) }}
    >
      <View className="flex-row items-center justify-between">
        <AppText variant="label">{label}</AppText>
        <AppText variant="caption" style={{ color }}>
          {riskLabel[level]}
          {confidence !== undefined ? `  ${Math.round(confidence * 100)}% conf.` : ''}
        </AppText>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceAlt }}>
        <View
          style={{
            width: `${Math.max(4, Math.min(100, score))}%`,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

const verifyMap: Record<VerificationStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral'; icon: IconName }> = {
  verified: { label: 'Verified', tone: 'success', icon: 'shield' },
  pending: { label: 'Pending', tone: 'warning', icon: 'clock' },
  unverified: { label: 'Unverified', tone: 'neutral', icon: 'alert' },
  rejected: { label: 'Rejected', tone: 'danger', icon: 'x-circle' },
  expired: { label: 'Expired', tone: 'danger', icon: 'clock' },
};

export function VerificationChip({ status }: { status: VerificationStatus }) {
  const m = verifyMap[status];
  return (
    <Badge
      label={m.label}
      tone={m.tone}
      icon={<Icon name={m.icon} size={12} color={toneColor[m.tone].fg} />}
    />
  );
}
