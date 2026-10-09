import React from 'react';
import { View, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Button, Input } from '@components/ui';
import { AuthShell } from '../components/AuthShell';
import { useAppDispatch } from '@store/hooks';
import { credentialsReceived } from '@features/auth/authSlice';
import { mockUser } from '@services/mock/fixtures';
import { loginSchema, LoginForm } from '../authSchemas';
import type { AuthStackParamList } from '@navigation/types';
import { SocialAuthRow } from '../components/SocialAuthRow';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const nav = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: 'aarav@petco.app', password: 'demopass1' } });

  const onSubmit = async (_data: LoginForm) => {
    // TODO: replace with RTK Query auth mutation.
    await new Promise((r) => setTimeout(r, 700));
    dispatch(
      credentialsReceived({ user: mockUser, accessToken: 'demo.jwt.token', refreshToken: 'demo.refresh' })
    );
  };

  return (
    <AuthShell image="dashboard" title="Welcome back" subtitle="Sign in to continue caring for your pets.">
      <View>
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={{ gap: 16 }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />
          <Pressable onPress={() => nav.navigate('ForgotPassword')} accessibilityRole="link" accessibilityLabel="Forgot password" className="min-h-[44px] justify-center self-end">
            <AppText variant="label" className="text-primary-600 dark:text-primary-300">
              Forgot password?
            </AppText>
          </Pressable>

          <Button label="Sign in" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth size="lg" />
        </Animated.View>

        <View className="my-6 flex-row items-center" style={{ gap: 12 }}>
          <View className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
          <AppText variant="caption" muted>
            or continue with
          </AppText>
          <View className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
        </View>

        <SocialAuthRow onProvider={() => onSubmit({ email: 'demo@petco.app', password: 'demopass1' })} />

        <View className="mt-auto flex-row justify-center pt-8">
          <AppText muted>New here? </AppText>
          <Pressable onPress={() => nav.navigate('Signup')} accessibilityRole="link" accessibilityLabel="Create account" className="min-h-[44px] justify-center">
            <AppText className="font-semibold text-primary-600 dark:text-primary-300">Create account</AppText>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}
