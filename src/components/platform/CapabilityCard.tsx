import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Icon, IconBadge, toneColor } from '@components/ui';
import type { IconName } from '@components/ui';
import { useTheme } from '@theme/ThemeProvider';

type Tone = keyof typeof toneColor;

interface CapabilityCardProps {
  icon: IconName;
  title: string;
  status: string;
  tone?: Tone;
  onPress: () => void;
  /** Optional emphasis count (e.g. pending approvals). */
  count?: number;
}

/** Entry tile for a platform capability. Two per row on phones. */
export function CapabilityCard({
  icon,
  title,
  status,
  tone = 'primary',
  onPress,
  count,
}: CapabilityCardProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${status}${count ? `. ${count} need attention` : ''}`}
      className="rounded-2xl bg-white p-4 dark:bg-surface-dark-2"
      style={({ pressed }) => ({
        flexBasis: '48%',
        flexGrow: 1,
        minHeight: 120,
        gap: 12,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View className="flex-row items-center justify-between">
        <IconBadge name={icon} tone={tone} size={40} />
        <View className="flex-row items-center" style={{ gap: 6 }}>
          {!!count && count > 0 && (
            <View
              className="items-center justify-center rounded-full"
              style={{ minWidth: 22, height: 22, paddingHorizontal: 6, backgroundColor: toneColor.warning.bg }}
            >
              <AppText variant="caption" style={{ color: toneColor.warning.fg, fontWeight: '700' }}>
                {count}
              </AppText>
            </View>
          )}
          <Icon name="chevron" size={16} color={theme.colors.textMuted} />
        </View>
      </View>
      <View>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" muted numberOfLines={2}>
          {status}
        </AppText>
      </View>
    </Pressable>
  );
}
