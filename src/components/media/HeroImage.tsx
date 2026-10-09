import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { MediaAsset } from '@services/media/imageService';
import { AppText, Icon } from '@components/ui';
import type { IconName } from '@components/ui';
import { RemoteImage } from './RemoteImage';

interface HeroImageProps {
  asset: MediaAsset;
  eyebrow?: string;
  title?: string;
  /** Watermark shown only when the photo is not available. */
  fallbackIcon?: IconName;
  aspectRatio?: number;
  radius?: number;
  children?: React.ReactNode;
}

/** Image with a legibility scrim and an overlaid text block. */
export function HeroImage({
  asset,
  eyebrow,
  title,
  fallbackIcon,
  aspectRatio,
  radius = 24,
  children,
}: HeroImageProps) {
  return (
    <RemoteImage asset={asset} aspectRatio={aspectRatio} radius={radius} priority="high">
      {fallbackIcon && (
        <View style={{ position: 'absolute', right: -12, top: -12, opacity: 0.1 }}>
          <Icon name={fallbackIcon} size={160} color="#ffffff" strokeWidth={1.25} />
        </View>
      )}
      <LinearGradient
        colors={['rgba(11,15,26,0)', 'rgba(11,15,26,0.72)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' }}
        pointerEvents="none"
      />
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, gap: 4 }}>
        {eyebrow && (
          <AppText variant="caption" className="font-semibold uppercase text-white/80">
            {eyebrow}
          </AppText>
        )}
        {title && (
          <AppText variant="h1" className="text-white" numberOfLines={2}>
            {title}
          </AppText>
        )}
        {children}
      </View>
    </RemoteImage>
  );
}
