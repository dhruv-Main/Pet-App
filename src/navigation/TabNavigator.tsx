import React from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { View, Platform, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { elevation } from '@theme/tokens';
import { useTheme } from '@theme/ThemeProvider';
import { AppText, Icon } from '@components/ui';
import type { IconName } from '@components/ui';
import type { TabParamList } from './types';
import { HomeStackNavigator } from './stacks/HomeStack';
import { ShopStackNavigator } from './stacks/ShopStack';
import { ServicesStackNavigator } from './stacks/ServicesStack';
import { CommunityStackNavigator } from './stacks/CommunityStack';
import { ProfileScreen } from '@features/profile/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

/** Screens with their own sticky footer, text input or camera hide the floating tab bar so nothing is covered. */
const HIDE_TAB_BAR = new Set([
  'AiAssistant',
  'QRScanner',
  'DashboardLayout',
  'VerificationRequest',
  'ProductDetail',
  'Cart',
  'Checkout',
  'ProviderDetail',
  'Booking',
  'PostDetail',
  'HubEntry',
  'HubAction',
]);

const ICONS: Record<keyof TabParamList, IconName> = {
  HomeTab: 'home',
  ShopTab: 'shop',
  ServicesTab: 'stethoscope',
  CommunityTab: 'users',
  ProfileTab: 'user',
};

const LABELS: Record<keyof TabParamList, string> = {
  HomeTab: 'Home',
  ShopTab: 'Shop',
  ServicesTab: 'Services',
  CommunityTab: 'Community',
  ProfileTab: 'Profile',
};

/** Floating glass pill with a sliding active indicator. */
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = React.useState(0);
  const count = state.routes.length;
  const slot = barWidth > 0 ? (barWidth - 12) / count : 0;
  const x = useSharedValue(0);
  React.useEffect(() => {
    x.value = withSpring(state.index * slot, { damping: 18, stiffness: 220 });
  }, [state.index, slot, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const focusedRoute = state.routes[state.index];
  if (HIDE_TAB_BAR.has(getFocusedRouteNameFromRoute(focusedRoute) ?? '')) return null;

  const dark = mode === 'dark';
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12) }}>
      <View
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        style={{
          borderRadius: 32,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
          backgroundColor:
            Platform.OS === 'web' ? (dark ? 'rgba(20,24,38,0.82)' : 'rgba(255,255,255,0.86)') : 'transparent',
          ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(24px) saturate(180%)' } as object) : {}),
          ...elevation.floating,
        }}
      >
        {Platform.OS !== 'web' && <BlurView intensity={70} tint={mode} style={StyleSheet.absoluteFill} />}
        <View className="flex-row" style={{ padding: 6 }}>
          {slot > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                { position: 'absolute', top: 6, left: 6, width: slot, height: 56, borderRadius: 26, backgroundColor: dark ? 'rgba(24,101,245,0.28)' : 'rgba(24,101,245,0.12)' },
                indicator,
              ]}
            />
          )}
          {state.routes.map((route, i) => {
            const focused = state.index === i;
            const name = route.name as keyof TabParamList;
            const color = focused ? theme.colors.primary : theme.colors.textMuted;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={LABELS[name]}
                accessibilityState={{ selected: focused }}
                onPress={() => {
                  const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !e.defaultPrevented) navigation.navigate(route.name as never);
                }}
                style={{ flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', gap: 2 }}
              >
                <Icon name={ICONS[name]} size={focused ? 22 : 21} color={color} />
                <AppText variant="caption" maxFontSizeMultiplier={1.2} numberOfLines={1} style={{ color, fontSize: 10, lineHeight: 12, fontWeight: focused ? '700' : '500' }}>
                  {LABELS[name]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="ShopTab" component={ShopStackNavigator} />
      <Tab.Screen name="ServicesTab" component={ServicesStackNavigator} />
      <Tab.Screen name="CommunityTab" component={CommunityStackNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
