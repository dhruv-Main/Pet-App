import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { AppText } from './AppText';

interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Small count shown as a badge (e.g. unread). */
  badge?: number;
  color?: string;
  size?: number;
  selected?: boolean;
}

/** Icon-only control with a guaranteed 44pt target and a required accessible name. */
export function IconButton({
  icon,
  label,
  onPress,
  disabled,
  badge,
  color,
  size = 20,
  selected,
}: IconButtonProps) {
  const a11yLabel = badge && badge > 0 ? `${label}, ${badge} unread` : label;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ disabled: !!disabled, selected }}
      hitSlop={4}
      className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10"
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}
    >
      <Icon name={icon} size={size} color={color} />
      {!!badge && badge > 0 && (
        <View
          className="absolute items-center justify-center rounded-full bg-danger"
          style={{ top: 2, right: 2, minWidth: 18, height: 18, paddingHorizontal: 4 }}
        >
          <AppText variant="caption" className="font-semibold text-white" style={{ fontSize: 10, lineHeight: 14 }}>
            {badge > 9 ? '9+' : badge}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
