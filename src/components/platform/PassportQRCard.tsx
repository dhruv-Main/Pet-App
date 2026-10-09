import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import type { PetIdentity } from '@apptypes/platform';
import { AppText, Card, Icon } from '@components/ui';
import { VerificationChip } from './Primitives';

const tierLabel: Record<PetIdentity['tier'], string> = {
  self_declared: 'Self declared',
  biometric: 'Biometric verified',
  microchip: 'Microchip verified',
  dna: 'DNA verified',
  registry: 'Registry verified',
};

/** Shareable passport credential. The QR encodes a resolvable verification URI, never raw PII. */
export function PassportQRCard({ identity, petName }: { identity: PetIdentity; petName: string }) {
  const uri = `petos://verify/${identity.passportId}`;
  return (
    <Card style={{ gap: 16 }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Icon name="fingerprint" size={18} color="#1865f5" />
          <AppText variant="label">Pet Passport</AppText>
        </View>
        <VerificationChip status={identity.status} />
      </View>
      <View className="flex-row items-center" style={{ gap: 16 }}>
        <View className="rounded-xl bg-white p-2">
          <QRCode value={uri} size={104} />
        </View>
        <View className="flex-1" style={{ gap: 4 }}>
          <AppText variant="h3">{petName}</AppText>
          <AppText variant="caption" muted>
            {identity.passportId}
          </AppText>
          <AppText variant="caption" muted>
            {tierLabel[identity.tier]}
          </AppText>
          {identity.microchipId && (
            <AppText variant="caption" muted>
              Chip {identity.microchipId}
            </AppText>
          )}
        </View>
      </View>
    </Card>
  );
}
