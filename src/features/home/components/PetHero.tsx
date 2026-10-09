import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Pet } from '@apptypes/domain';
import { AppText, Icon } from '@components/ui';
import type { IconName } from '@components/ui';
import { RemoteImage } from '@components/media';
import { Glass, GradientRing, PressableScale } from '@components/premium';
import { petHeroAsset } from '@services/media/imageService';

export const HERO_HEIGHT = 470;
/** How far the content sheet overlaps the hero. */
export const SHEET_OVERLAP = 40;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function GlassIconButton({
  icon,
  label,
  badge,
  onPress,
}: {
  icon: IconName;
  label: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} unread` : label}
      hitSlop={6}
    >
      <Glass radius={22} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color="#ffffff" />
      </Glass>
      {!!badge && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 4,
            backgroundColor: '#ef4444',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: 'rgba(11,15,26,0.9)',
          }}
        >
          <AppText variant="caption" style={{ color: '#fff', fontSize: 10, lineHeight: 12, fontWeight: '800' }}>
            {badge > 9 ? '9+' : badge}
          </AppText>
        </View>
      )}
    </PressableScale>
  );
}

interface PetHeroProps {
  pet: Pet;
  pets: Pet[];
  firstName: string;
  scrollY: SharedValue<number>;
  healthScore: number;
  vaccineLabel: string;
  vaccineTone: 'success' | 'warning' | 'danger';
  unread: number;
  showLayout: boolean;
  showBell: boolean;
  onSelectPet: (id: string) => void;
  onOpenProfile: () => void;
  onOpenLayout: () => void;
  onOpenNotifications: () => void;
}

const toneDot = { success: '#34d399', warning: '#fbbf24', danger: '#f87171' } as const;

/** Full-bleed pet banner: photo with parallax, glass chrome, identity and a health ring. */
export function PetHero({
  pet,
  pets,
  firstName,
  scrollY,
  healthScore,
  vaccineLabel,
  vaccineTone,
  unread,
  showLayout,
  showBell,
  onSelectPet,
  onOpenProfile,
  onOpenLayout,
  onOpenNotifications,
}: PetHeroProps) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const heroH = Math.min(HERO_HEIGHT, Math.max(380, Math.round(winH * 0.58)));
  const species = pet.species === 'cat' ? 'cat' : 'dog';
  const years = Math.max(1, Math.round(pet.ageMonths / 12));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-HERO_HEIGHT, 0, HERO_HEIGHT],
          [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.35],
          Extrapolation.CLAMP,
        ),
      },
      { scale: interpolate(scrollY.value, [-HERO_HEIGHT, 0], [2.2, 1], Extrapolation.CLAMP) },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HERO_HEIGHT * 0.5], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, HERO_HEIGHT], [0, -40], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={{ height: heroH, overflow: 'hidden', backgroundColor: '#0b0f1a' }}>
      <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
        <RemoteImage asset={petHeroAsset(pet.id, pet.name, species)} fill priority="high" />
      </Animated.View>

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(11,15,26,0.62)', 'rgba(11,15,26,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(11,15,26,0)', 'rgba(11,15,26,0.55)', 'rgba(11,15,26,0.92)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '68%' }}
      />

      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        <View
          className="flex-row items-center justify-between px-5"
          style={{ paddingTop: insets.top + 12 }}
        >
          <Glass radius={22} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.72)' }}>
              {greeting()}
            </AppText>
            <AppText variant="h3" style={{ color: '#ffffff' }} numberOfLines={1}>
              {firstName}
            </AppText>
          </Glass>
          <View className="flex-row" style={{ gap: 10 }}>
            {showLayout && <GlassIconButton icon="layout" label="Customise dashboard" onPress={onOpenLayout} />}
            {showBell && (
              <GlassIconButton icon="bell" label="Notifications" badge={unread} onPress={onOpenNotifications} />
            )}
          </View>
        </View>

        {pets.length > 1 && (
          <View
            className="flex-row px-5"
            style={{ gap: 10, marginTop: 16 }}
            accessibilityRole="tablist"
          >
            {pets.map((p) => {
              const selected = p.id === pet.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => onSelectPet(p.id)}
                  accessibilityRole="tab"
                  accessibilityLabel={`${p.name}, ${p.breed}`}
                  accessibilityState={{ selected }}
                  hitSlop={4}
                  style={{ opacity: selected ? 1 : 0.7 }}
                >
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      padding: 2,
                      borderWidth: 2,
                      borderColor: selected ? '#ffffff' : 'rgba(255,255,255,0.28)',
                    }}
                  >
                    <View style={{ flex: 1, borderRadius: 21, overflow: 'hidden' }}>
                      <RemoteImage asset={petHeroAsset(p.id, p.name, p.species === 'cat' ? 'cat' : 'dog')} fill />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ flex: 1 }} />

        <View style={{ paddingHorizontal: 20, paddingBottom: SHEET_OVERLAP + 20, gap: 14 }}>
          <View className="flex-row items-end justify-between" style={{ gap: 12 }}>
            <Pressable
              onPress={onOpenProfile}
              accessibilityRole="button"
              accessibilityLabel={`Open ${pet.name}'s profile`}
              style={{ flex: 1, gap: 6 }}
            >
              <View style={{ alignSelf: 'flex-start' }}>
                <Glass radius={12} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
                  <AppText variant="eyebrow" style={{ color: '#ffffff' }} numberOfLines={1}>
                    {pet.breed}
                  </AppText>
                </Glass>
              </View>
              <AppText variant="hero" style={{ color: '#ffffff' }} numberOfLines={1} adjustsFontSizeToFit>
                {pet.name}
              </AppText>
              <AppText style={{ color: 'rgba(255,255,255,0.82)' }} numberOfLines={1}>
                {pet.gender} · {years} {years === 1 ? 'year' : 'years'}
                {pet.weightKg ? ` · ${pet.weightKg} kg` : ''}
              </AppText>
            </Pressable>

            <Glass radius={30} intensity={50} style={{ padding: 10 }}>
              <GradientRing
                value={healthScore}
                size={86}
                stroke={9}
                colors={healthScore >= 75 ? ['#34d399', '#22d3ee'] : healthScore >= 50 ? ['#fbbf24', '#f59e0b'] : ['#f87171', '#fb923c']}
                accessibilityLabel={`${pet.name}'s health score`}
              >
                <AppText variant="metric" style={{ color: '#ffffff' }}>
                  {Math.round(healthScore)}
                </AppText>
                <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>
                  Health
                </AppText>
              </GradientRing>
            </Glass>
          </View>

          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Glass radius={16} style={{ paddingHorizontal: 12, paddingVertical: 7 }}>
              <View className="flex-row items-center" style={{ gap: 7 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: toneDot[vaccineTone] }} />
                <AppText variant="label" style={{ color: '#ffffff' }}>
                  {vaccineLabel}
                </AppText>
              </View>
            </Glass>
            <Pressable
              onPress={onOpenProfile}
              accessibilityRole="button"
              accessibilityLabel={`Open ${pet.name}'s profile`}
              hitSlop={8}
              className="flex-row items-center"
              style={{ gap: 2 }}
            >
              <AppText variant="label" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Full profile
              </AppText>
              <Icon name="chevron" size={16} color="rgba(255,255,255,0.9)" />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
