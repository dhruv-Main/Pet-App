import React from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
let ringSeq = 0;

interface GradientRingProps {
  /** 0 to 100 */
  value: number;
  size?: number;
  stroke?: number;
  colors?: readonly [string, string];
  track?: string;
  accessibilityLabel?: string;
  children?: React.ReactNode;
}

/** Progress ring with a gradient stroke and an animated sweep. Children render centred inside. */
export function GradientRing({
  value,
  size = 96,
  stroke = 10,
  colors = ['#34d399', '#22d3ee'],
  track = 'rgba(255,255,255,0.18)',
  accessibilityLabel = 'Progress',
  children,
}: GradientRingProps) {
  const id = React.useMemo(() => `gr-${++ringSeq}`, []);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(100, value)) / 100, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
