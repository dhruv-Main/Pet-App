import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from './IconButton';
import { useNavigation } from '@react-navigation/native';

/** Full-screen wrapper for empty and error fallbacks that always keeps a visible way back. */
export function ScreenFallback({ children }: { children: React.ReactNode }) {
  const nav = useNavigation();
  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark" edges={['top', 'bottom']}>
      {nav.canGoBack() && (
        <View className="px-4 pt-2">
          <IconButton icon="back" label="Go back" onPress={() => nav.goBack()} />
        </View>
      )}
      {children}
    </SafeAreaView>
  );
}
