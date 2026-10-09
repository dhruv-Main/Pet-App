import React from 'react';
import { Pressable, PressableProps, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  haptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const sizeMap: Record<Size, { py: number; px: number; text: 'label' | 'body' | 'h3' }> = {
  sm: { py: 12, px: 16, text: 'label' },
  md: { py: 14, px: 20, text: 'body' },
  lg: { py: 18, px: 24, text: 'h3' },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  leftIcon,
  rightIcon,
  haptic = true,
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const s = sizeMap[size];
  const isGradient = variant === 'primary' || variant === 'danger';

  const bgClass =
    variant === 'secondary'
      ? 'bg-primary-100 dark:bg-primary-500/15'
      : variant === 'ghost'
        ? 'bg-transparent'
        : variant === 'glass'
          ? 'bg-white/10 border border-white/20'
          : '';

  const textColor =
    variant === 'secondary'
      ? 'text-primary-700 dark:text-primary-300'
      : variant === 'ghost'
        ? 'text-primary-600 dark:text-primary-300'
        : 'text-white';

  const content = (
    <View
      className="flex-row items-center justify-center"
      style={{ paddingVertical: s.py, paddingHorizontal: s.px, gap: 8 }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#1865f5' : '#fff'} />
      ) : (
        <>
          {leftIcon}
          <AppText variant={s.text} className={`font-semibold ${textColor}`}>
            {label}
          </AppText>
          {rightIcon}
        </>
      )}
    </View>
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPressIn={(e) => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) {
          try {
            Promise.resolve(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)).catch(() => undefined);
          } catch {
            /* haptics unavailable (web) */
          }
        }
        onPress?.(e);
      }}
      style={[animatedStyle, { opacity: disabled ? 0.5 : 1, width: fullWidth ? '100%' : undefined }]}
      className={`overflow-hidden rounded-2xl ${bgClass}`}
      {...rest}
    >
      {isGradient ? (
        <LinearGradient
          colors={variant === 'danger' ? ['#dc2626', '#b91c1c'] : ['#114fe1', '#1865f5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </AnimatedPressable>
  );
}
