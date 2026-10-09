import React from 'react';
import { View } from 'react-native';
import { RemoteImage } from './RemoteImage';
import { avatarAsset } from '@services/media/imageService';

/** Circular user photo with a gradient fallback while loading or offline. */
export function Avatar({ userId, name, size = 40 }: { userId: string; name: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <RemoteImage asset={avatarAsset(userId, name)} aspectRatio={1} />
    </View>
  );
}
