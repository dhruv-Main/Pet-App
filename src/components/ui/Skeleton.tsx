import React, { useEffect } from 'react';
import { View, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/ThemeProvider';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/**
 * Shimmer skeleton loader. Used across lists, cards and detail screens to
 * deliver perceived-performance wins during data fetches.
 */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const { mode } = useTheme();
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-220, 220]) }],
  }));

  const baseColor = mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const shimmer =
    mode === 'dark'
      ? ['transparent', 'rgba(255,255,255,0.12)', 'transparent']
      : ['transparent', 'rgba(255,255,255,0.7)', 'transparent'];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: baseColor, overflow: 'hidden' }, style]}
    >
      <Animated.View style={[{ width: 220, height: '100%' }, animatedStyle]}>
        <LinearGradient
          colors={shimmer as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View className="rounded-2xl bg-white p-4 dark:bg-surface-dark-2" style={{ gap: 12 }}>
      <Skeleton height={140} radius={16} />
      <Skeleton width="60%" height={18} />
      <Skeleton width="40%" height={14} />
    </View>
  );
}
