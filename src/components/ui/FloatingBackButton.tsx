import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { elevation } from '@theme/tokens';

/** 44pt circular back control that stays legible over photos and gradients. */
export function BackCircle({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      accessibilityHint="Returns to the previous screen"
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.9)',
          opacity: pressed ? 0.75 : 1,
        },
        elevation.soft,
      ]}
    >
      <Icon name="back" size={20} color="#0b0f1a" />
    </Pressable>
  );
}

/** Back control overlaid on full-bleed hero screens. Renders nothing when there is nowhere to go back to. */
export function FloatingBackButton() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  if (!nav.canGoBack()) return null;
  return (
    <View style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 10 }}>
      <BackCircle onPress={() => nav.goBack()} />
    </View>
  );
}
