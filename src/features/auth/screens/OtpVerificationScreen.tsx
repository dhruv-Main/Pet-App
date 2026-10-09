import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppText, Button } from '@components/ui';
import { useAppDispatch } from '@store/hooks';
import { credentialsReceived } from '@features/auth/authSlice';
import { mockUser } from '@services/mock/fixtures';
import type { AuthStackParamList } from '@navigation/types';
import { AuthShell } from '../components/AuthShell';

const LENGTH = 6;
const RESEND_SECONDS = 30;

function mask(phone: string) {
  const d = phone.replace(/\s/g, '');
  return d.length > 4 ? `${d.slice(0, 3)} ••••• ${d.slice(-4)}` : phone;
}

export function OtpVerificationScreen() {
  const route = useRoute<RouteProp<AuthStackParamList, 'OtpVerification'>>();
  const nav = useNavigation();
  const dispatch = useAppDispatch();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const [focused, setFocused] = useState(0);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/[^0-9]/g, '');
    const copy = [...digits];
    if (clean.length > 1) {
      clean
        .slice(0, LENGTH - i)
        .split('')
        .forEach((c, k) => (copy[i + k] = c));
      setDigits(copy);
      refs.current[Math.min(LENGTH - 1, i + clean.length)]?.focus();
      return;
    }
    copy[i] = clean;
    setDigits(copy);
    if (clean && i < LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const verify = () => {
    dispatch(
      credentialsReceived({ user: mockUser, accessToken: 'demo.jwt.token', refreshToken: 'demo.refresh' })
    );
  };

  const complete = digits.every((d) => d);
  const clock = `0:${String(seconds).padStart(2, '0')}`;

  return (
    <AuthShell
      icon="shield"
      title="Verify your number"
      subtitle={`Enter the 6-digit code sent to ${mask(route.params.phone)}`}
    >
      <View className="flex-row" style={{ gap: 8 }} accessibilityRole="none">
        {digits.map((d, i) => {
          const active = focused === i;
          return (
            <TextInput
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={d}
              onChangeText={(v) => setDigit(i, v)}
              onFocus={() => setFocused(i)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
              }}
              autoFocus={i === 0}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              maxLength={i === 0 ? LENGTH : 1}
              selectTextOnFocus
              className={`flex-1 rounded-xl bg-white text-center text-neutral-900 dark:bg-surface-dark-2 dark:text-white ${
                active ? 'border-primary-500' : d ? 'border-primary-200 dark:border-primary-500/40' : 'border-neutral-200 dark:border-white/10'
              }`}
              style={[
                { height: 64, borderRadius: 18, borderWidth: active ? 2 : 1.5, fontSize: 26, fontWeight: '700' },
                Platform.OS === 'web' ? ({ outlineStyle: 'none', minWidth: 0 } as object) : null,
              ]}
              accessibilityLabel={`Digit ${i + 1} of ${LENGTH}`}
            />
          );
        })}
      </View>

      <View style={{ marginTop: 32 }}>
        <Button label="Verify & continue" onPress={verify} disabled={!complete} fullWidth size="lg" />
      </View>

      <View className="items-center" style={{ marginTop: 20, gap: 4 }}>
        {seconds > 0 ? (
          <AppText muted>
            Didn't receive it? <AppText className="font-semibold text-primary-600 dark:text-primary-300">Resend in {clock}</AppText>
          </AppText>
        ) : (
          <Pressable
            onPress={() => setSeconds(RESEND_SECONDS)}
            accessibilityRole="button"
            accessibilityLabel="Resend code"
            className="min-h-[44px] justify-center"
          >
            <AppText className="font-semibold text-primary-600 dark:text-primary-300">Resend code</AppText>
          </Pressable>
        )}
        <Pressable
          onPress={() => nav.goBack()}
          accessibilityRole="link"
          accessibilityLabel="Change phone number"
          className="min-h-[44px] justify-center"
        >
          <AppText variant="label" muted>
            Wrong number? Change it
          </AppText>
        </Pressable>
      </View>
    </AuthShell>
  );
}
