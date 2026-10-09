import React, { useCallback, useRef, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { AppText, Button, Card, Icon, Input } from '@components/ui';
import { ScreenHeader } from '@components/platform';
import { parsePassportCode } from '@platform/linking';
import { analytics } from '@platform/observability';

/** Scans a passport QR (petos://verify/<id>) or accepts a manually typed passport id. */
export function QRScannerScreen() {
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const locked = useRef(false);

  const resolve = useCallback(
    (code: string) => {
      analytics.track('passport_scan_resolved', { ok: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      nav.replace('VerifyPassport', { code });
    },
    [nav],
  );

  const onScan = useCallback(
    ({ data }: { data: string }) => {
      if (locked.current) return;
      locked.current = true;
      const code = parsePassportCode(data);
      if (!code) {
        analytics.track('passport_scan_resolved', { ok: false });
        setError('This QR code is not a Pet OS passport.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setTimeout(() => {
          locked.current = false;
        }, 1800);
        return;
      }
      setError(null);
      resolve(code);
    },
    [resolve],
  );

  const submitManual = () => {
    const code = manual.trim();
    if (!/^[A-Za-z0-9-]{6,40}$/.test(code)) {
      setError('Enter a valid passport id, for example PP-IN-7F3A-9C21.');
      return;
    }
    setError(null);
    resolve(code);
  };

  const granted = permission?.granted;
  const canAskAgain = permission?.canAskAgain ?? true;

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader title="Scan passport" subtitle="Verify a pet's credentials" onBack={() => nav.goBack()} />
      <View className="px-4" style={{ gap: 16 }}>
        <View
          style={{ aspectRatio: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0b0f1a' }}
          accessible
          accessibilityLabel="Camera viewfinder for scanning a passport QR code"
        >
          {granted ? (
            <>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onScan}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: '18%',
                  left: '18%',
                  right: '18%',
                  bottom: '18%',
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.85)',
                }}
              />
            </>
          ) : (
            <View className="flex-1 items-center justify-center px-8" style={{ gap: 12 }}>
              <Icon name="camera" size={32} color="#ffffff" />
              <AppText variant="label" center className="text-white">
                {permission ? 'Camera access is needed to scan' : 'Checking camera access'}
              </AppText>
              {permission && canAskAgain && <Button label="Allow camera" size="sm" onPress={requestPermission} />}
              {permission && !canAskAgain && Platform.OS !== 'web' && (
                <Button label="Open settings" size="sm" variant="glass" onPress={() => Linking.openSettings()} />
              )}
            </View>
          )}
        </View>

        {error && (
          <Card accessibilityRole="alert" accessibilityLiveRegion="polite" className="flex-row items-center" style={{ gap: 10 }}>
            <Icon name="alert" size={18} color="#b45309" />
            <AppText variant="caption" className="flex-1">
              {error}
            </AppText>
          </Card>
        )}

        <Card style={{ gap: 12 }}>
          <AppText variant="label">Enter passport id manually</AppText>
          <Input
            value={manual}
            onChangeText={setManual}
            placeholder="PP-IN-7F3A-9C21"
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Passport id"
            returnKeyType="go"
            onSubmitEditing={submitManual}
          />
          <Button label="Verify passport" variant="secondary" onPress={submitManual} disabled={manual.trim().length === 0} />
        </Card>
      </View>
    </View>
  );
}
