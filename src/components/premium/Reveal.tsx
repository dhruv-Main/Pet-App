import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

/** Staggered entrance: each section rises and fades in a beat after the previous one. */
export function Reveal({
  index = 0,
  style,
  children,
}: {
  index?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 70).duration(520)} style={style}>
      {children}
    </Animated.View>
  );
}
