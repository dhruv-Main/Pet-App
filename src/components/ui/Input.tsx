import React, { useEffect, useState } from 'react';
import { View, TextInput, TextInputProps, Pressable, AccessibilityInfo } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';
import { AppText } from './AppText';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPressRightIcon?: () => void;
  rightIconLabel?: string;
}

/**
 * Accessible, theme-aware text field with animated focus state and inline
 * validation messaging. Designed to pair with react-hook-form Controllers.
 */
export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onPressRightIcon,
  rightIconLabel,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (error) AccessibilityInfo.announceForAccessibility(label ? `${label}: ${error}` : error);
  }, [error, label]);

  const borderClass = error
    ? 'border-danger-500'
    : focused
      ? 'border-primary-500'
      : 'border-neutral-200 dark:border-white/10';

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <AppText variant="label" className="text-neutral-700 dark:text-neutral-300">
          {label}
        </AppText>
      )}
      <View
        className={`flex-row items-center rounded-2xl border bg-white px-4 dark:bg-surface-dark-2 ${borderClass}`}
        style={{ minHeight: 52, gap: 10 }}
      >
        {leftIcon}
        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          className="flex-1 text-neutral-900 dark:text-neutral-50"
          style={{ fontSize: 15, paddingVertical: 12 }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          {...rest}
        />
        {rightIcon && (
          <Pressable
            onPress={onPressRightIcon}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={rightIconLabel ?? 'Field action'}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            {rightIcon}
          </Pressable>
        )}
      </View>
      {error ? (
        <AppText variant="caption" className="text-red-700 dark:text-red-300" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" muted>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
