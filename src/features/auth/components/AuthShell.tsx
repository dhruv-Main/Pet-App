import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AppText, Icon } from '@components/ui';
import type { IconName } from '@components/ui';
import { BackCircle } from '@components/ui/FloatingBackButton';
import { Glass, Reveal } from '@components/premium';
import { RemoteImage } from '@components/media';
import { bannerAsset } from '@services/media/imageService';
import { gradients } from '@theme/tokens';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { guestStarted } from '@features/auth/authSlice';

const INK = '#0b0f1a';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  /** Photo hero. When omitted, a gradient hero with a glass icon tile is used. */
  image?: 'dashboard' | 'shop' | 'services' | 'community' | 'prime';
  icon?: IconName;
  compact?: boolean;
  children: React.ReactNode;
}

/**
 * Shared frame for Login, Signup, OTP and Forgot Password: hero, always-visible back control,
 * and a rounded form sheet. Back never dead-ends.
 */
export function AuthShell({ title, subtitle, image, icon = 'paw', compact, children }: AuthShellProps) {
  const nav = useNavigation();
  const dispatch = useAppDispatch();
  const entry = useAppSelector((s) => s.auth.entry);
  const heroHeight = compact ? 232 : 296;

  const goBack = () => {
    if (nav.canGoBack()) nav.goBack();
    else if (entry === 'onboarding') (nav as unknown as { navigate: (n: string) => void }).navigate('Onboarding');
    else dispatch(guestStarted());
  };

  return (
    <View className="flex-1" style={{ backgroundColor: INK }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: heroHeight, backgroundColor: INK, overflow: 'hidden' }}>
          {image ? (
            <>
              <RemoteImage asset={bannerAsset(image, title)} fill priority="high" />
              <LinearGradient
                colors={['rgba(11,15,26,0.45)', 'rgba(11,15,26,0.15)', 'rgba(11,15,26,0.88)']}
                locations={[0, 0.4, 1]}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
            </>
          ) : (
            <LinearGradient
              colors={gradients.aurora}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <View style={{ position: 'absolute', right: -24, top: 24, opacity: 0.1 }}>
                <Icon name={icon} size={220} color="#ffffff" strokeWidth={1.25} />
              </View>
            </LinearGradient>
          )}
          <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              <BackCircle onPress={goBack} />
            </View>
            <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 52 }}>
              <Reveal>
                {!image && (
                  <View style={{ alignSelf: 'flex-start', marginBottom: 14 }}>
                    <Glass radius={20} intensity={50} style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={icon} size={26} color="#ffffff" />
                    </Glass>
                  </View>
                )}
                <AppText
                  accessibilityRole="header"
                  style={{ color: '#ffffff', fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.6 }}
                >
                  {title}
                </AppText>
                {subtitle ? (
                  <AppText style={{ color: 'rgba(255,255,255,0.78)', marginTop: 6 }}>{subtitle}</AppText>
                ) : null}
              </Reveal>
            </View>
          </SafeAreaView>
        </View>

        <View
          className="flex-1 bg-surface-light dark:bg-surface-dark"
          style={{
            marginTop: -28,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 40,
          }}
        >
          {children}
        </View>
      </ScrollView>
    </View>
  );
}
