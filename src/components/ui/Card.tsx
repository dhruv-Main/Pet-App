import React from 'react';
import { View, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@theme/ThemeProvider';
import { elevation } from '@theme/tokens';

interface CardProps extends ViewProps {
  variant?: 'solid' | 'glass' | 'outline';
  elevated?: boolean;
  padded?: boolean;
}

/**
 * Surface container implementing Material 3 + glassmorphism.
 * `glass` uses a native blur on iOS/Android and a translucent fallback on web.
 */
export function Card({
  variant = 'solid',
  elevated = true,
  padded = true,
  className = '',
  style,
  children,
  ...rest
}: CardProps) {
  const { mode } = useTheme();
  const base = `rounded-3xl ${padded ? 'p-4' : ''}`;
  const hairline = { borderWidth: 1, borderColor: mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(11,15,26,0.05)' };

  if (variant === 'glass' && Platform.OS !== 'web') {
    return (
      <View
        className={`overflow-hidden rounded-3xl ${className}`}
        style={[elevated && elevation.card, style]}
        {...rest}
      >
        <BlurView intensity={40} tint={mode} style={{ flex: 1 }}>
          <View className={padded ? 'p-4' : ''}>{children}</View>
        </BlurView>
      </View>
    );
  }

  const variantClass =
    variant === 'glass'
      ? 'bg-white/70 dark:bg-surface-dark-2/60 border border-white/30 dark:border-white/10'
      : variant === 'outline'
        ? 'bg-transparent border border-neutral-200 dark:border-white/10'
        : 'bg-white dark:bg-surface-dark-2';

  return (
    <View
      className={`${base} ${variantClass} ${className}`}
      style={[variant === 'solid' && hairline, elevated && variant === 'solid' && mode === 'light' && elevation.card, style]}
      {...rest}
    >
      {children}
    </View>
  );
}
