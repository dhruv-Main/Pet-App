import React from 'react';
import { Pressable } from 'react-native';
import { AppText } from './AppText';

interface SelectChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Spoken name when it differs from the visible label. */
  accessibilityLabel?: string;
  icon?: React.ReactNode;
  radius?: 'full' | 'xl';
}

/** Single-select option with a 44pt target and exposed selected state. */
export const SelectChip = React.memo(function SelectChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
  icon,
  radius = 'full',
}: SelectChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, checked: selected }}
      className={`min-h-[44px] flex-row items-center justify-center px-4 ${radius === 'full' ? 'rounded-full' : 'rounded-2xl'} ${
        selected ? 'bg-primary-700' : 'bg-white dark:bg-surface-dark-2'
      }`}
      style={{ gap: 6 }}
    >
      {icon}
      <AppText variant="label" className={selected ? 'text-white' : ''}>
        {label}
      </AppText>
    </Pressable>
  );
});
