import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@theme/ThemeProvider';
import { useAppSelector } from '@store/hooks';
import { analytics, crash } from '@platform/observability';
import { linking } from '@platform/linking';
import type { RootStackParamList } from './types';
import { AuthStackNavigator } from './stacks/AuthStack';
import { TabNavigator } from './TabNavigator';
import { AuthPromptModal } from '@features/auth/AuthPrompt';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { theme, mode } = useTheme();
  const isAuthenticated = useAppSelector((s) => s.auth.status === 'authenticated' || s.auth.guest);
  const userId = useAppSelector((s) => s.auth.user?.id ?? null);
  const navRef = useNavigationContainerRef<RootStackParamList>();
  const routeName = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    analytics.identify(userId);
    crash.setUser(userId);
  }, [userId]);

  const navTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      primary: theme.colors.primary,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationContainer
      theme={navTheme}
      linking={linking}
      ref={navRef}
      onReady={() => {
        routeName.current = navRef.getCurrentRoute()?.name;
      }}
      onStateChange={() => {
        const current = navRef.getCurrentRoute()?.name;
        if (current && current !== routeName.current) {
          analytics.screen(current);
          crash.breadcrumb(`screen:${current}`);
        }
        routeName.current = current;
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
      <AuthPromptModal />
    </NavigationContainer>
  );
}
