import React from 'react';
import { Text, TextProps } from 'react-native';
import { typography } from '@theme/tokens';

type Variant = keyof typeof typography;

interface AppTextProps extends TextProps {
  variant?: Variant;
  muted?: boolean;
  center?: boolean;
}

/**
 * Typography primitive. Pairs design-system font metrics with Tailwind color
 * utilities so screens stay consistent and theme-aware.
 */
export function AppText({
  variant = 'body',
  muted,
  center,
  className = '',
  style,
  ...rest
}: AppTextProps) {
  const t = typography[variant];
  const colorClass = muted
    ? 'text-neutral-500 dark:text-neutral-400'
    : 'text-neutral-900 dark:text-neutral-50';

  return (
    <Text
      allowFontScaling
      accessibilityRole={
        variant === 'hero' || variant === 'display' || variant === 'h1' || variant === 'h2' ? 'header' : undefined
      }
      maxFontSizeMultiplier={variant === 'hero' || variant === 'display' || variant === 'h1' ? 1.3 : 1.6}
      className={`${colorClass} ${center ? 'text-center' : ''} ${className}`}
      style={[
        {
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          fontWeight: t.fontWeight,
          letterSpacing: t.letterSpacing,
          textTransform: t.textTransform,
        },
        style,
      ]}
      {...rest}
    />
  );
}
