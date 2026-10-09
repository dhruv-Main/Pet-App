import React, { useEffect } from 'react';
import { View, ViewProps } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { AppText, Icon } from '@components/ui';
import type { IconName } from '@components/ui';

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export function dateIn(days: number, long = false) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', long ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Soft white card with hairline border used across cart, checkout and booking. */
export function Panel({ children, style, ...rest }: ViewProps & { children: React.ReactNode; style?: object }) {
  return (
    <View
      {...rest}
      className="bg-white dark:bg-surface-dark-2"
      style={[{ borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(107,115,144,0.14)' }, style]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View style={{ gap: 2, marginBottom: 12 }}>
      {eyebrow ? (
        <AppText variant="eyebrow" className="text-primary-600 dark:text-primary-300">
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="h2" accessibilityRole="header">
        {title}
      </AppText>
    </View>
  );
}

export function SummaryRow({ label, value, tone, strong, hint }: { label: string; value: string; tone?: 'success'; strong?: boolean; hint?: string }) {
  return (
    <View className="flex-row items-center justify-between" style={{ minHeight: 26 }}>
      <View style={{ flexShrink: 1 }}>
        <AppText variant={strong ? 'h3' : 'body'} muted={!strong}>
          {label}
        </AppText>
        {hint ? (
          <AppText variant="caption" muted>
            {hint}
          </AppText>
        ) : null}
      </View>
      <AppText variant={strong ? 'h2' : 'label'} style={tone === 'success' ? { color: '#16a34a' } : undefined}>
        {value}
      </AppText>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: 'rgba(107,115,144,0.14)', marginVertical: 8 }} />;
}

/** Row of three reassurance marks. */
export function TrustStrip() {
  const items: Array<[IconName, string, string]> = [
    ['lock', 'Secure payments', 'Encrypted checkout'],
    ['undo', 'Easy returns', '7-day free returns'],
    ['stethoscope', 'Vet approved', 'Reviewed by vets'],
  ];
  return (
    <View className="flex-row" style={{ gap: 8 }}>
      {items.map(([icon, t, s]) => (
        <View key={t} accessible accessibilityLabel={`${t}. ${s}`} style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 6, borderRadius: 20, backgroundColor: 'rgba(22,163,74,0.08)' }}>
          <Icon name={icon} size={20} color="#16a34a" />
          <AppText variant="caption" center style={{ fontWeight: '700' }}>
            {t}
          </AppText>
          <AppText variant="caption" muted center style={{ fontSize: 11 }}>
            {s}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** Vertical timeline. `done` steps are filled; the next step is highlighted. */
export function Timeline({ steps }: { steps: Array<{ title: string; body: string; done: boolean }> }) {
  const current = steps.findIndex((s) => !s.done);
  return (
    <View>
      {steps.map((s, i) => {
        const active = i === current;
        return (
          <View key={s.title} className="flex-row" style={{ gap: 14 }} accessible accessibilityLabel={`${s.title}. ${s.body}. ${s.done ? 'Done' : active ? 'Next' : 'Upcoming'}`}>
            <View style={{ alignItems: 'center', width: 26 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: s.done ? '#16a34a' : 'transparent',
                  borderWidth: s.done ? 0 : 2,
                  borderColor: active ? '#1865f5' : 'rgba(107,115,144,0.35)',
                }}
              >
                {s.done ? <Icon name="check" size={14} color="#ffffff" /> : active ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#1865f5' }} /> : null}
              </View>
              {i < steps.length - 1 && <View style={{ flex: 1, width: 2, minHeight: 26, backgroundColor: s.done ? '#16a34a' : 'rgba(107,115,144,0.25)' }} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 16 }}>
              <AppText variant="label" style={{ opacity: s.done || active ? 1 : 0.6 }}>
                {s.title}
              </AppText>
              <AppText variant="caption" muted>
                {s.body}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Animated success mark: ring pulses outward while the check springs in. */
export function SuccessBurst({ size = 88 }: { size?: number }) {
  const pop = useSharedValue(0);
  const ring = useSharedValue(0);
  useEffect(() => {
    pop.value = withDelay(80, withSpring(1, { damping: 9, stiffness: 140 }));
    ring.value = withSequence(withDelay(120, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })));
  }, [pop, ring]);
  const mark = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }], opacity: pop.value }));
  const halo = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - ring.value), transform: [{ scale: 1 + ring.value * 0.9 }] }));
  return (
    <View style={{ width: size * 1.8, height: size * 1.8, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: '#22c55e' }, halo]} />
      <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' }, mark]}>
        <Icon name="check" size={size * 0.46} color="#ffffff" strokeWidth={3} />
      </Animated.View>
    </View>
  );
}
