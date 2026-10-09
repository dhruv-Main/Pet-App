import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'premium';

const toneMap: Record<Tone, string> = {
  primary: 'bg-primary-100 dark:bg-primary-500/20',
  success: 'bg-green-100 dark:bg-green-500/20',
  warning: 'bg-amber-100 dark:bg-amber-500/20',
  danger: 'bg-red-100 dark:bg-red-500/20',
  neutral: 'bg-neutral-100 dark:bg-white/10',
  premium: 'bg-amber-100 dark:bg-amber-400/20',
};

const textMap: Record<Tone, string> = {
  primary: 'text-primary-700 dark:text-primary-200',
  success: 'text-green-700 dark:text-green-300',
  warning: 'text-amber-700 dark:text-amber-300',
  danger: 'text-red-700 dark:text-red-300',
  neutral: 'text-neutral-700 dark:text-neutral-200',
  premium: 'text-amber-700 dark:text-amber-300',
};

export function Badge({
  label,
  tone = 'primary',
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: React.ReactNode;
}) {
  return (
    <View
      className={`flex-row items-center self-start rounded-full px-2.5 py-1 ${toneMap[tone]}`}
      style={{ gap: 4 }}
    >
      {icon}
      <AppText variant="caption" className={`font-semibold ${textMap[tone]}`}>
        {label}
      </AppText>
    </View>
  );
}
