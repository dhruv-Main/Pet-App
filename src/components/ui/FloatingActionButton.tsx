import React from 'react';
import { Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { gradients, elevation } from '@theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FABProps {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  bottom?: number;
  right?: number;
}

/** Floating action button with gradient fill, shadow and press spring. */
export function FloatingActionButton({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  bottom = 96,
  right = 20,
}: FABProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPressIn={() => (scale.value = withSpring(0.9))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={() => {
        try {
          Promise.resolve(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)).catch(() => undefined);
        } catch {
          /* haptics unavailable (web) */
        }
        onPress();
      }}
      style={[{ position: 'absolute', bottom, right }, style, elevation.floating]}
      hitSlop={8}
    >
      <LinearGradient
        importantForAccessibility="no-hide-descendants"
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}
      >
        {icon}
      </LinearGradient>
    </AnimatedPressable>
  );
}
