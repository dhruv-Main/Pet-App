import React from 'react';
import { View, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Button, Input } from '@components/ui';
import { AuthShell } from '../components/AuthShell';
import { signupSchema, SignupForm } from '../authSchemas';
import type { AuthStackParamList } from '@navigation/types';
import { SocialAuthRow } from '../components/SocialAuthRow';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export function SignupScreen() {
  const nav = useNavigation<Nav>();
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (_data: SignupForm) => {
    await new Promise((r) => setTimeout(r, 600));
    nav.navigate('OtpVerification', { phone: getValues('phone') });
  };

  return (
    <AuthShell image="community" compact title="Create account" subtitle="Join India's most loved pet community.">
      <View>
        <View style={{ gap: 16 }}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Full name" placeholder="Zohr Irani" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Phone" placeholder="+91 98765 43210" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.phone?.message} />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Password" placeholder="••••••••" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Confirm password" placeholder="••••••••" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message} />
            )}
          />
          <Button label="Continue" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth size="lg" />
        </View>

        <View className="my-6 flex-row items-center" style={{ gap: 12 }}>
          <View className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
          <AppText variant="caption" muted>
            or sign up with
          </AppText>
          <View className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
        </View>
        <SocialAuthRow onProvider={() => nav.navigate('OtpVerification', { phone: '+910000000000' })} />

        <View className="mt-8 flex-row justify-center">
          <AppText muted>Already registered? </AppText>
          <Pressable onPress={() => nav.navigate('Login')} accessibilityRole="link" accessibilityLabel="Sign in" className="min-h-[44px] justify-center">
            <AppText className="font-semibold text-primary-600 dark:text-primary-300">Sign in</AppText>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}
