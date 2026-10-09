import React from 'react';
import { View, Pressable } from 'react-native';
import { AppText } from '@components/ui';

const PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
  { id: 'facebook', label: 'Meta' },
];

/** Google / Apple / social sign-in row. Wire each to the respective SDK. */
export function SocialAuthRow({ onProvider }: { onProvider: (id: string) => void }) {
  return (
    <View className="flex-row justify-center" style={{ gap: 12 }}>
      {PROVIDERS.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityLabel={`Continue with ${p.label}`}
          onPress={() => onProvider(p.id)}
          className="h-[52px] flex-1 items-center justify-center rounded-full border border-neutral-200 bg-white dark:border-white/10 dark:bg-surface-dark-2"
        >
          <AppText variant="label">{p.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}
