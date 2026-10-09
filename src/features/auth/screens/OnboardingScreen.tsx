import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Icon } from '@components/ui';
import type { IconName } from '@components/ui';
import { RemoteImage } from '@components/media';
import { Glass, PressableScale } from '@components/premium';
import type { MediaAsset } from '@services/media/imageService';
import { blurhash } from '@services/media/imageService';
import { useAppDispatch } from '@store/hooks';
import { guestStarted } from '@features/auth/authSlice';
import { useDemoLogin } from '@features/auth/useDemoLogin';
import type { AuthStackParamList } from '@navigation/types';

interface Slide {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: IconName;
  accent: string;
  image: MediaAsset;
  chips: string[];
}

const photo = (key: string, alt: string): MediaAsset => ({ key, blurhash: blurhash.warm, aspectRatio: 3 / 4, alt });

const SLIDES: Slide[] = [
  {
    key: 'health',
    eyebrow: 'Pet Health',
    title: 'Know how they feel, every day',
    description: 'Vaccines, vet visits and daily vitals in one place, with a health score you can trust.',
    icon: 'heart-pulse',
    accent: '#34d399',
    image: photo('pets/p1/hero.jpg', 'A happy golden retriever outdoors'),
    chips: ['Health score', 'Vaccine reminders'],
  },
  {
    key: 'passport',
    eyebrow: 'Pet Passport',
    title: 'One verified identity for life',
    description: 'Records, microchip and vet-verified credentials, ready to share at the clinic, kennel or border.',
    icon: 'fingerprint',
    accent: '#60a5fa',
    image: photo('pets/p3/hero.jpg', 'A calm cat looking at the camera'),
    chips: ['Verified records', 'Share with a tap'],
  },
  {
    key: 'twin',
    eyebrow: 'Digital Twin',
    title: 'See problems before they start',
    description: 'A living model of your pet spots early risk from activity, diet and history.',
    icon: 'cpu',
    accent: '#a78bfa',
    image: photo('pets/p2/hero.jpg', 'A dog resting in warm light'),
    chips: ['Early risk alerts', 'Trends over time'],
  },
  {
    key: 'ai',
    eyebrow: 'AI Assistant',
    title: 'A vet-smart answer, instantly',
    description: 'Ask anything, day or night. Your assistant knows your pet and can book, reorder and remind.',
    icon: 'sparkles',
    accent: '#f472b6',
    image: photo('pets/p4/hero.jpg', 'A puppy with bright eyes'),
    chips: ['24x7 guidance', 'You approve every action'],
  },
  {
    key: 'commerce',
    eyebrow: 'Shop and Services',
    title: 'Everything they need, delivered',
    description: 'Premium food, trusted vets, groomers and walkers, with Pet Prime savings built in.',
    icon: 'package',
    accent: '#fbbf24',
    image: photo('banners/shop/banner.jpg', 'A dog with a toy and treats'),
    chips: ['Subscribe and save', 'Verified providers'],
  },
];

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

function SlideView({
  slide,
  index,
  scrollX,
  width,
  height,
}: {
  slide: Slide;
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  height: number;
}) {
  const input = [(index - 1) * width, index * width, (index + 1) * width];
  const compact = height < 720;
  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(scrollX.value, input, [width * 0.25, 0, -width * 0.25], Extrapolation.CLAMP) },
      { scale: interpolate(scrollX.value, input, [1.15, 1.04, 1.15], Extrapolation.CLAMP) },
    ],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, input, [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(scrollX.value, input, [width * 0.35, 0, -width * 0.35], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={{ width, height, backgroundColor: '#0b0f1a', overflow: 'hidden' }}>
      <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
        <RemoteImage asset={slide.image} fill priority="high" />
      </Animated.View>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(11,15,26,0.55)', 'rgba(11,15,26,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180 }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(11,15,26,0)', 'rgba(11,15,26,0.7)', 'rgba(11,15,26,0.96)']}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '66%' }}
      />
      <Animated.View style={[{ position: 'absolute', left: 28, right: 28, bottom: compact ? 200 : 240, gap: compact ? 8 : 14 }, textStyle]}>
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <Glass radius={18} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={slide.icon} size={18} color={slide.accent} />
          </Glass>
          <AppText variant="eyebrow" style={{ color: slide.accent }}>
            Pet OS · {slide.eyebrow}
          </AppText>
        </View>
        <AppText variant="hero" style={{ color: '#ffffff', ...(compact ? { fontSize: 26, lineHeight: 30 } : {}) }}>
          {slide.title}
        </AppText>
        <AppText variant="h3" numberOfLines={compact ? 2 : undefined} style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '400', lineHeight: 22, fontSize: compact ? 15 : 17 }}>
          {slide.description}
        </AppText>
        {!compact && (
        <View className="flex-row flex-wrap" style={{ gap: 8, marginTop: 4 }}>
          {slide.chips.map((c) => (
            <Glass key={c} radius={14} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <AppText variant="caption" style={{ color: '#ffffff', fontWeight: '600' }}>
                {c}
              </AppText>
            </Glass>
          ))}
        </View>
        )}
      </Animated.View>
    </View>
  );
}

function ProgressSegment({ i, scrollX, width }: { i: number; scrollX: SharedValue<number>; width: number }) {
  const fill = useAnimatedStyle(() => ({
    width: `${interpolate(scrollX.value, [(i - 1) * width, i * width], [0, 100], Extrapolation.CLAMP)}%`,
  }));
  return (
    <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden' }}>
      <Animated.View style={[{ height: 4, backgroundColor: '#ffffff', borderRadius: 2 }, fill]} />
    </View>
  );
}

export function OnboardingScreen() {
  const nav = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const demoLogin = useDemoLogin();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<Animated.FlatList<Slide>>(null);
  const scrollX = useSharedValue(0);
  const last = index === SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
    runOnJS(setIndex)(Math.round(e.contentOffset.x / width));
  });

  const goTo = useCallback(
    (i: number) => {
      listRef.current?.scrollToOffset({ offset: i * width, animated: true });
      setIndex(i);
    },
    [width],
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0f1a' }}>
      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }) => (
          <SlideView slide={item} index={i} scrollX={scrollX} width={width} height={height} />
        )}
      />

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + 14, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 16 }}
      >
        <View className="flex-row" style={{ gap: 6, flex: 1 }}>
          {SLIDES.map((s, i) => (
            <ProgressSegment key={s.key} i={i} scrollX={scrollX} width={width} />
          ))}
        </View>
        {!last && (
          <Pressable onPress={() => goTo(SLIDES.length - 1)} accessibilityRole="button" accessibilityLabel="Skip introduction" hitSlop={12}>
            <AppText variant="label" style={{ color: '#ffffff' }}>
              Skip
            </AppText>
          </Pressable>
        )}
      </View>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 24, right: 24, bottom: Math.max(insets.bottom, 16) + (height < 720 ? 0 : 12), gap: height < 720 ? 8 : 12 }}
      >
        {height >= 720 && (
        <View className="flex-row items-center" style={{ gap: 8, marginBottom: 6 }}>
          <Icon name="paw" size={16} color="#ffffff" />
          <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Pet OS · the operating system for pet life
          </AppText>
        </View>
        )}

        {!last ? (
          <PressableScale
            onPress={() => goTo(index + 1)}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            style={{ height: 58, borderRadius: 29, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
          >
            <AppText variant="h3" style={{ color: '#0b0f1a' }}>
              Continue
            </AppText>
            <Icon name="chevron" size={20} color="#0b0f1a" />
          </PressableScale>
        ) : (
          <>
            <PressableScale
              onPress={() => nav.navigate('Login')}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              style={{ height: 56, borderRadius: 28, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}
            >
              <AppText variant="h3" style={{ color: '#0b0f1a' }}>
                Sign In
              </AppText>
            </PressableScale>
            <PressableScale
              onPress={demoLogin}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              style={{ height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center' }}
            >
              <AppText variant="h3" style={{ color: '#ffffff' }}>
                Continue with Google
              </AppText>
            </PressableScale>
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => nav.navigate('Signup')}
                accessibilityRole="button"
                accessibilityLabel="Create account"
                hitSlop={8}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <AppText variant="label" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Create account
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => dispatch(guestStarted())}
                accessibilityRole="button"
                accessibilityLabel="Explore as Guest"
                hitSlop={8}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <AppText variant="label" style={{ color: '#ffffff' }}>
                  Explore as Guest
                </AppText>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
