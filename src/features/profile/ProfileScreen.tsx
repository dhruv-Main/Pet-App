import React, { useCallback } from 'react';
import { ScrollView, View, Pressable, Switch, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AppText, Card, Badge, Button, Icon, IconBadge } from '@components/ui';
import type { IconName } from '@components/ui';
import { Avatar, RemoteImage } from '@components/media';
import { Glass, PressableScale, Reveal } from '@components/premium';
import { bannerAsset } from '@services/media/imageService';
import { useDemoLogin } from '@features/auth/useDemoLogin';
import type { HomeStackParamList, TabParamList } from '@navigation/types';
import { gradients } from '@theme/tokens';
import { useTheme } from '@theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { guestExited, logout } from '@features/auth/authSlice';
import { confirmAction } from '@platform/confirmAction';
import { useCurrentUser, usePets } from '@services/data';
import { DEMO_MODE } from '@/demo/demoMode';
import { NETWORK_MODES, NetworkSimulator, useNetworkState } from '@/demo/NetworkSimulator';
import type { NetworkMode } from '@/demo/NetworkSimulator';

type HomeRoute = 'Passport' | 'ConsentCenter' | 'TwinDashboard' | 'AgentCenter' | 'Notifications' | 'Orders' | 'PetProfile' | 'Hub' | 'HubActivity';

interface MenuItem {
  label: string;
  icon: IconName;
  route: HomeRoute;
}

const MENU: MenuItem[] = [
  { label: 'My Pets', icon: 'paw', route: 'PetProfile' },
  { label: 'Pet Passport', icon: 'fingerprint', route: 'Passport' },
  { label: 'Digital Twin', icon: 'activity', route: 'TwinDashboard' },
  { label: 'Agent Center', icon: 'bot', route: 'AgentCenter' },
  { label: 'Orders and rewards', icon: 'package', route: 'Orders' },
  { label: 'Pet services hub', icon: 'layout', route: 'Hub' },
  { label: 'My activity and saved', icon: 'bookmark', route: 'HubActivity' },
  { label: 'Notifications', icon: 'bell', route: 'Notifications' },
  { label: 'Consent Center', icon: 'lock', route: 'ConsentCenter' },
];

const NETWORK_LABEL: Record<NetworkMode, string> = {
  fast: 'Fast',
  normal: 'Normal',
  slow: 'Slow',
  offline: 'Offline',
  error: 'Error',
};

type TabNav = BottomTabNavigationProp<TabParamList>;

const INK = '#0b0f1a';

const MenuRow = React.memo(function MenuRow({
  item,
  onOpen,
}: {
  item: MenuItem;
  onOpen: (route: HomeRoute) => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.label} onPress={() => onOpen(item.route)}>
      <Card className="my-1 min-h-[56px] flex-row items-center" style={{ gap: 12 }}>
        <IconBadge name={item.icon} size={36} />
        <AppText variant="label" style={{ flex: 1 }}>
          {item.label}
        </AppText>
        <Icon name="chevron" size={18} color={theme.colors.textMuted} />
      </Card>
    </Pressable>
  );
});

function NetworkModeCard() {
  const { mode } = useNetworkState();
  return (
    <Card style={{ gap: 10 }} className="my-1">
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <IconBadge name="wifi" tone="neutral" size={36} />
        <View style={{ flex: 1 }}>
          <AppText variant="label">Network simulator</AppText>
          <AppText variant="caption" muted>
            Demo mode: test loading, offline and error states
          </AppText>
        </View>
      </View>
      <View className="flex-row flex-wrap" style={{ gap: 8 }} accessibilityRole="radiogroup">
        {NETWORK_MODES.map((m) => {
          const selected = m === mode;
          return (
            <Pressable
              key={m}
              onPress={() => NetworkSimulator.setMode(m)}
              accessibilityRole="radio"
              accessibilityLabel={`${NETWORK_LABEL[m]} network`}
              accessibilityState={{ selected, checked: selected }}
              className={`min-h-[44px] items-center justify-center rounded-full px-4 ${selected ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-white/10'}`}
            >
              <AppText variant="label" className={selected ? 'text-white' : ''}>
                {NETWORK_LABEL[m]}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

export function ProfileScreen() {
  const isGuest = useAppSelector((s) => s.auth.guest && s.auth.status !== 'authenticated');
  return isGuest ? <GuestProfile /> : <MemberProfile />;
}

const FEATURES: { icon: IconName; title: string; copy: string; colors: [string, string] }[] = [
  { icon: 'brain', title: 'Digital Twin', copy: 'Predict health trends and risks.', colors: ['#1f1147', '#6d28d9'] },
  { icon: 'fingerprint', title: 'Pet Passport', copy: 'Verified identity and records.', colors: ['#0f172a', '#1d4ed8'] },
  { icon: 'bot', title: 'AI Assistant', copy: '24/7 smart pet care support.', colors: ['#042f2e', '#0f766e'] },
  { icon: 'siren', title: 'Emergency SOS', copy: 'Help when it matters most.', colors: ['#3b0a1e', '#e11d48'] },
];

const STATS = [
  { value: '100K+', label: 'Pet Parents' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '24/7', label: 'Vet Support' },
];

function SettingsRow({
  icon,
  label,
  detail,
  onPress,
  right,
  last,
}: {
  icon: IconName;
  label: string;
  detail?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  last?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !right}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(128,128,128,0.15)' }}
    >
      <View className="flex-row items-center" style={{ gap: 12, minHeight: 28 }}>
        <Icon name={icon} size={20} />
        <AppText variant="label" style={{ flex: 1 }}>
          {label}
        </AppText>
        {right ?? (onPress ? <Icon name="chevron" size={18} color={theme.colors.textMuted} /> : null)}
      </View>
      {detail ? (
        <AppText variant="caption" muted style={{ marginTop: 8, marginLeft: 32 }}>
          {detail}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function GuestProfile() {
  const { mode, toggle } = useTheme();
  const dispatch = useAppDispatch();
  const nav = useNavigation<TabNav>();
  const demoLogin = useDemoLogin();
  const heroH = Math.round(Math.min(Math.max(useWindowDimensions().height * 0.72, 520), 680));
  const [open, setOpen] = React.useState<'a11y' | 'about' | null>(null);
  const signup = () => dispatch(guestExited('signup'));
  const SHADOW = { boxShadow: '0 14px 36px rgba(17,24,39,0.14)' } as never;

  return (
    <View className="flex-1 bg-white dark:bg-surface-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ height: heroH, backgroundColor: INK }}>
          <RemoteImage asset={bannerAsset('community', 'Happy pets')} fill priority="high" />
          <LinearGradient
            colors={['rgba(11,15,26,0.3)', 'rgba(11,15,26,0)', 'rgba(11,15,26,0.92)']}
            locations={[0, 0.3, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <SafeAreaView edges={['top']} style={{ flex: 1, justifyContent: 'space-between' }}>
            <View className="flex-row items-center px-5 pt-2" style={{ gap: 8 }}>
              <Glass radius={20} style={{ paddingHorizontal: 14, height: 40, justifyContent: 'center' }}>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Icon name="lock" size={14} color="#ffffff" />
                  <AppText variant="label" style={{ color: '#ffffff' }}>
                    Guest
                  </AppText>
                </View>
              </Glass>
            </View>
            <Reveal style={{ paddingHorizontal: 16, paddingBottom: 28 }}>
              <Glass radius={32} intensity={55} style={{ padding: 22, gap: 8 }}>
                <AppText accessibilityRole="header" style={{ color: '#ffffff', fontSize: 28, lineHeight: 33, fontWeight: '700', letterSpacing: -0.5 }}>
                  Unlock Your Pet’s Digital Life
                </AppText>
                <AppText style={{ color: 'rgba(255,255,255,0.82)', fontSize: 17, lineHeight: 24 }}>
                  {'Passport.  Health.  AI.  Care.\nAll in one place.'}
                </AppText>
                <View style={{ gap: 10, marginTop: 14 }}>
                  <PressableScale
                    onPress={demoLogin}
                    accessibilityRole="button"
                    accessibilityLabel="Continue with Google"
                    style={{ height: 54, borderRadius: 27, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <AppText variant="h3" style={{ color: INK }}>
                      Continue with Google
                    </AppText>
                  </PressableScale>
                  <PressableScale onPress={signup} accessibilityRole="button" accessibilityLabel="Create Account">
                    <View style={{ height: 54, borderRadius: 27, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                      <AppText variant="h3" style={{ color: '#ffffff' }}>
                        Create Account
                      </AppText>
                    </View>
                  </PressableScale>
                </View>
              </Glass>
            </Reveal>
          </SafeAreaView>
        </View>
        <Pressable onPress={() => dispatch(guestExited('login'))} accessibilityRole="button" className="min-h-[48px] items-center justify-center" style={{ marginTop: 8 }}>
          <AppText variant="label">Already a member? Sign in</AppText>
        </Pressable>

        {/* Features */}
        <View style={{ paddingHorizontal: 20, marginTop: 32, marginBottom: 14 }}>
          <AppText variant="eyebrow" muted>
            Included with Pet OS
          </AppText>
          <AppText variant="h2">Everything in one place</AppText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 14 }}>
          {FEATURES.map((f, i) => (
            <Animated.View key={f.title} entering={FadeInRight.delay(i * 90).duration(450)}>
              <PressableScale onPress={signup} accessibilityRole="button" accessibilityLabel={`${f.title}. Create an account to unlock`}>
                <LinearGradient colors={f.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ width: 232, height: 260, borderRadius: 30, overflow: 'hidden', padding: 20, justifyContent: 'space-between' }, SHADOW]}>
                  <View style={{ position: 'absolute', right: -24, top: -16, opacity: 0.14 }}>
                    <Icon name={f.icon} size={150} color="#ffffff" strokeWidth={1.2} />
                  </View>
                  <Glass radius={24} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={f.icon} size={22} color="#ffffff" />
                  </Glass>
                  <View style={{ gap: 6 }}>
                    <AppText variant="h2" style={{ color: '#ffffff' }}>
                      {f.title}
                    </AppText>
                    <AppText style={{ color: 'rgba(255,255,255,0.8)' }}>{f.copy}</AppText>
                    <View className="flex-row items-center" style={{ gap: 6, marginTop: 6 }}>
                      <Icon name="lock" size={12} color="#ffffff" />
                      <AppText variant="caption" style={{ color: '#ffffff', fontWeight: '700' }}>
                        Unlock with an account
                      </AppText>
                    </View>
                  </View>
                </LinearGradient>
              </PressableScale>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Social proof */}
        <View className="flex-row" style={{ paddingHorizontal: 20, marginTop: 28, gap: 12 }}>
          {STATS.map((s) => (
            <View
              key={s.label}
              accessible
              accessibilityLabel={`${s.value} ${s.label}`}
              style={[{ flex: 1, borderRadius: 26, paddingVertical: 22, alignItems: 'center', backgroundColor: INK }, SHADOW]}
            >
              <AppText style={{ color: '#ffffff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>{s.value}</AppText>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                {s.label}
              </AppText>
            </View>
          ))}
        </View>

        {/* Settings */}
        <View style={{ paddingHorizontal: 20, marginTop: 40, marginBottom: 12 }}>
          <AppText variant="eyebrow" muted>
            Settings
          </AppText>
        </View>
        <View style={{ marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', backgroundColor: mode === 'dark' ? '#171a24' : '#f5f6f8' }}>
          <SettingsRow
            icon="moon"
            label="Appearance"
            detail={mode === 'dark' ? 'Dark' : 'Light'}
            right={<Switch value={mode === 'dark'} onValueChange={toggle} accessibilityRole="switch" accessibilityLabel="Dark mode" />}
          />
          <SettingsRow icon="bell" label="Notifications" onPress={() => nav.navigate('HomeTab', { screen: 'Notifications' } as never)} />
          <SettingsRow
            icon="eye"
            label="Accessibility"
            detail={open === 'a11y' ? 'Controls carry screen-reader labels and at least 44pt touch targets.' : undefined}
            onPress={() => setOpen(open === 'a11y' ? null : 'a11y')}
          />
          <SettingsRow
            icon="paw"
            label="About"
            detail={open === 'about' ? 'Pet OS. Care, identity and community for your pet.' : undefined}
            onPress={() => setOpen(open === 'about' ? null : 'about')}
            last
          />
        </View>
        {DEMO_MODE && (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <NetworkModeCard />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MemberProfile() {
  const { mode, toggle } = useTheme();
  const nav = useNavigation<TabNav>();
  const dispatch = useAppDispatch();
  const user = useCurrentUser();
  const pets = usePets().data;
  const petCount = pets.length;

  const openHomeRoute = useCallback(
    (route: HomeRoute) => {
      const params = route === 'PetProfile' ? { petId: pets[0]?.id } : undefined;
      nav.navigate('HomeTab', { screen: route, params } as never);
    },
    [nav, pets],
  );

  const confirmLogout = useCallback(() => {
    confirmAction({
      title: 'Log out',
      message: 'You will need to sign in again to see your pets and orders.',
      confirmLabel: 'Log out',
      destructive: true,
      onConfirm: () => dispatch(logout()),
    });
  }, [dispatch]);

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={gradients.aurora} style={{ paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <SafeAreaView edges={['top']} className="items-center px-5 pt-4" style={{ gap: 8 }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' }}>
              <Avatar userId={user.id} name={user.name} size={90} />
            </View>
            <AppText variant="h2" className="text-white" center accessibilityRole="header">
              {user.name}
            </AppText>
            <AppText className="text-white/80" center>
              {user.email}
            </AppText>
            {user.isPrime && (
              <Badge label="Pet Prime Member" tone="premium" icon={<Icon name="star" size={12} color="#b45309" />} />
            )}
          </SafeAreaView>
        </LinearGradient>

        <View className="flex-row px-5 pt-4" style={{ gap: 12 }}>
          <Card className="flex-1 items-center" accessible accessibilityLabel={`${user.loyaltyPoints} points`}>
            <AppText variant="h2">{user.loyaltyPoints}</AppText>
            <AppText variant="caption" muted>
              Points
            </AppText>
          </Card>
          <Card className="flex-1 items-center" accessible accessibilityLabel={`${petCount} pets`}>
            <AppText variant="h2">{petCount}</AppText>
            <AppText variant="caption" muted>
              Pets
            </AppText>
          </Card>
        </View>

        <View className="px-5 pt-4" style={{ gap: 2 }}>
          {MENU.map((m) => (
            <MenuRow key={m.label} item={m} onOpen={openHomeRoute} />
          ))}

          <Card className="my-1 min-h-[56px] flex-row items-center" style={{ gap: 12 }}>
            <IconBadge name="moon" tone="neutral" size={36} />
            <AppText variant="label" style={{ flex: 1 }}>
              Dark mode
            </AppText>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggle}
              accessibilityRole="switch"
              accessibilityLabel="Dark mode"
              accessibilityState={{ checked: mode === 'dark' }}
            />
          </Card>
          {DEMO_MODE && <NetworkModeCard />}
        </View>

        <View className="px-5 pt-4">
          <Button label="Log out" variant="danger" fullWidth onPress={confirmLogout} />
        </View>
      </ScrollView>
    </View>
  );
}
