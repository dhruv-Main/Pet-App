import React, { useState } from 'react';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { AppText, Button, IconBadge, Input } from '@components/ui';
import { forgotPasswordSchema, ForgotPasswordForm } from '../authSchemas';
import { AuthShell } from '../components/AuthShell';

export function ForgotPasswordScreen() {
  const nav = useNavigation();
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  const onSubmit = async (_d: ForgotPasswordForm) => {
    await new Promise((r) => setTimeout(r, 600));
    setSent(true);
  };

  return (
    <AuthShell
      icon={sent ? 'mail' : 'key'}
      title={sent ? 'Check your inbox' : 'Reset password'}
      subtitle={sent ? undefined : "Enter your email and we'll send you a reset link."}
    >
      {sent ? (
        <View className="items-center" style={{ gap: 16 }}>
          <IconBadge name="check-circle" tone="success" size={64} />
          <AppText variant="body" muted center>
            If an account exists for that email, we've sent a reset link.
          </AppText>
          <Button label="Back to login" onPress={() => nav.goBack()} fullWidth size="lg" />
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} />
            )}
          />
          <Button label="Send reset link" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth size="lg" />
        </View>
      )}
    </AuthShell>
  );
}
