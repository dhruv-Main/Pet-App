import React, { useState } from 'react';
import { LayoutChangeEvent, PixelRatio, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@theme/tokens';
import {
  DEFAULT_CACHE_POLICY,
  MediaAsset,
  resolveImageUri,
} from '@services/media/imageService';

interface RemoteImageProps {
  asset: MediaAsset;
  /** Overrides the asset aspect ratio. */
  aspectRatio?: number;
  radius?: number;
  style?: ViewStyle;
  priority?: 'low' | 'normal' | 'high';
  /** Fills the parent absolutely instead of sizing by aspect ratio. */
  fill?: boolean;
  children?: React.ReactNode;
}

/**
 * Responsive image with blur-up placeholder, disk+memory caching and a graceful
 * gradient surface when the image is unavailable (no CDN, offline, or load error).
 */
export function RemoteImage({
  asset,
  aspectRatio,
  radius = 0,
  style,
  priority = 'normal',
  fill,
  children,
}: RemoteImageProps) {
  const [width, setWidth] = useState(0);
  const [failed, setFailed] = useState(false);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };

  const uri =
    width > 0 && !failed
      ? resolveImageUri(asset, { width, pixelRatio: PixelRatio.get() })
      : undefined;

  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={asset.alt}
      style={[
        fill
          ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius, overflow: 'hidden' }
          : { width: '100%', aspectRatio: aspectRatio ?? asset.aspectRatio, borderRadius: radius, overflow: 'hidden' },
        style,
      ]}
    >
      <LinearGradient
        colors={gradients.aurora}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {uri && (
        <Image
          source={{ uri }}
          placeholder={{ blurhash: asset.blurhash }}
          contentFit="cover"
          transition={280}
          cachePolicy={DEFAULT_CACHE_POLICY}
          priority={priority}
          recyclingKey={asset.key}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}
      {children}
    </View>
  );
}
