import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassProps {
  tint?: 'dark' | 'light';
  intensity?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** Frosted surface for use over imagery. Native blur on devices, backdrop-filter on web. */
export function Glass({ tint = 'dark', intensity = 40, radius = 20, style, children }: GlassProps) {
  const base: ViewStyle = {
    borderRadius: radius,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: tint === 'dark' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.7)',
  };
  if (Platform.OS === 'web') {
    const web = {
      backgroundColor: tint === 'dark' ? 'rgba(11,15,26,0.42)' : 'rgba(255,255,255,0.62)',
      backdropFilter: `blur(${Math.round(intensity / 2)}px) saturate(170%)`,
      WebkitBackdropFilter: `blur(${Math.round(intensity / 2)}px) saturate(170%)`,
    } as ViewStyle;
    return <View style={[base, web, style]}>{children}</View>;
  }
  return (
    <BlurView intensity={intensity} tint={tint} style={[base, style]}>
      {children}
    </BlurView>
  );
}
