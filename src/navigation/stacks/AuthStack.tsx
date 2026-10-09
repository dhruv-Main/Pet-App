import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types';
import { useAppSelector } from '@store/hooks';
import { OnboardingScreen } from '@features/auth/screens/OnboardingScreen';
import { LoginScreen } from '@features/auth/screens/LoginScreen';
import { SignupScreen } from '@features/auth/screens/SignupScreen';
import { OtpVerificationScreen } from '@features/auth/screens/OtpVerificationScreen';
import { ForgotPasswordScreen } from '@features/auth/screens/ForgotPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStackNavigator() {
  const entry = useAppSelector((s) => s.auth.entry);
  const initialRouteName = entry === 'login' ? 'Login' : entry === 'signup' ? 'Signup' : 'Onboarding';
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
