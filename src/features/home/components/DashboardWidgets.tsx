import React from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@components/ui';
import type { IconName } from '@components/ui';
import { PressableScale } from '@components/premium';

/** Soft-tinted rounded-square action, the way Apple Wallet and Uber present primary shortcuts. */
export const QuickAction = React.memo(function QuickAction({
  icon,
  label,
  hint,
  tint,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  tint: string;
  onPress?: () => void;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      hitSlop={6}
      scaleTo={0.92}
      onPress={onPress}
      style={{ alignItems: 'center', gap: 8, flex: 1 }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${tint}1f`,
        }}
      >
        <Icon name={icon} size={24} color={tint} />
      </View>
      <AppText variant="caption" center numberOfLines={1} importantForAccessibility="no" style={{ fontWeight: '600' }}>
        {label}
      </AppText>
    </PressableScale>
  );
});
