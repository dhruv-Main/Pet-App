import React from 'react';
import { View, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './AppText';

/**
 * Reusable gradient hero header used by dashboards and detail screens.
 */
export function GradientHeader({
  colors,
  height = 220,
  children,
  style,
}: {
  colors: readonly [string, string, ...string[]];
  height?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ height, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }, style]}
    >
      {children}
    </LinearGradient>
  );
}

export function SectionHeader({
  title,
  eyebrow,
  actionLabel,
  onAction,
}: {
  title: string;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-end justify-between px-5 pb-3 pt-8">
      <View style={{ flex: 1, gap: 2 }}>
        {eyebrow && (
          <AppText variant="eyebrow" className="text-primary-600 dark:text-primary-300">
            {eyebrow}
          </AppText>
        )}
        <AppText variant="h2" numberOfLines={1}>
          {title}
        </AppText>
      </View>
      {actionLabel && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={10}
          className="min-h-[32px] flex-row items-center justify-center rounded-full bg-primary-50 px-3 dark:bg-primary-500/15"
        >
          <AppText variant="label" className="text-primary-600 dark:text-primary-300">
            {actionLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}
