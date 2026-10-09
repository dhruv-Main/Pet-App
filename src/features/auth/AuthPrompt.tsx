import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText, Button, Icon } from '@components/ui';
import { RemoteImage } from '@components/media';
import { bannerAsset } from '@services/media/imageService';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { authPromptDismissed, guestExited } from './authSlice';
import { useDemoLogin } from './useDemoLogin';

const BENEFITS = ['Pet passport and health records', 'Book vets, groomers and trainers', 'Orders, rewards and reminders'];

/** Premium sign-in card shared by the modal prompt and the screen-level guard. */
export function AuthPromptCard({ reason, onNotNow }: { reason: string; onNotNow: () => void }) {
  const dispatch = useAppDispatch();
  const demoLogin = useDemoLogin();
  return (
    <View className="overflow-hidden rounded-3xl bg-white dark:bg-neutral-900" style={{ width: '100%', maxWidth: 420 }}>
      <RemoteImage asset={bannerAsset('community', 'Happy pets')} aspectRatio={16 / 8} radius={0} />
      <View className="p-6" style={{ gap: 14 }}>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-900">
          <Icon name="lock" size={20} color="#ffffff" />
        </View>
        <View style={{ gap: 4 }}>
          <AppText variant="h2" accessibilityRole="header">
            Sign in to continue
          </AppText>
          <AppText muted>{reason}</AppText>
        </View>
        <View style={{ gap: 8 }}>
          {BENEFITS.map((b) => (
            <View key={b} className="flex-row items-center" style={{ gap: 8 }}>
              <Icon name="check-circle" size={16} color="#111827" />
              <AppText variant="caption">{b}</AppText>
            </View>
          ))}
        </View>
        <View style={{ gap: 10 }}>
          <Button label="Sign in" size="lg" fullWidth onPress={() => dispatch(guestExited('login'))} />
          <Button label="Continue with Google" variant="secondary" size="lg" fullWidth onPress={demoLogin} />
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => dispatch(guestExited('signup'))}
              accessibilityRole="button"
              className="min-h-[44px] justify-center"
            >
              <AppText variant="label" className="text-primary-600">
                Create account
              </AppText>
            </Pressable>
            <Pressable onPress={onNotNow} accessibilityRole="button" className="min-h-[44px] justify-center">
              <AppText variant="label" muted>
                Not now
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

/** Mounted once at the root; opens when a guest triggers a member-only action. */
export function AuthPromptModal() {
  const dispatch = useAppDispatch();
  const prompt = useAppSelector((s) => s.auth.prompt);
  const close = () => dispatch(authPromptDismissed());
  return (
    <Modal visible={prompt !== null} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View className="flex-1 items-center justify-center p-5" style={{ backgroundColor: 'rgba(10,10,15,0.6)' }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={close} accessibilityLabel="Dismiss" />
        <AuthPromptCard reason={prompt ?? ''} onNotNow={close} />
      </View>
    </Modal>
  );
}

/** Wraps a member-only screen so guests (including deep links) see the prompt instead of data. */
export function guarded<P extends object>(Screen: React.ComponentType<P>, reason: string): React.ComponentType<P> {
  function Guarded(props: P) {
    const member = useAppSelector((s) => s.auth.status === 'authenticated');
    const nav = useNavigation();
    if (member) return <Screen {...props} />;
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-950 p-5">
        <AuthPromptCard
          reason={reason}
          onNotNow={() => {
            if (nav.canGoBack()) nav.goBack();
            else (nav as unknown as { navigate: (n: string) => void }).navigate('HomeTab');
          }}
        />
      </SafeAreaView>
    );
  }
  Guarded.displayName = `Guarded(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return Guarded;
}
