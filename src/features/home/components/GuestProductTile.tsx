import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { AppText, Icon } from '@components/ui';
import { RemoteImage } from '@components/media';
import { Glass } from '@components/premium';
import { productAsset } from '@services/media/imageService';
import { useAppDispatch } from '@store/hooks';
import { addItem } from '@features/cart/cartSlice';
import type { Product } from '@apptypes/domain';

export type TileBadge = 'ai' | 'best' | null;

/** Large editorial product tile with lift-on-hover, badges and one-tap add. */
export const GuestProductTile = React.memo(function GuestProductTile({
  product,
  badge,
  width = 220,
  onPress,
}: {
  product: Product;
  badge: TileBadge;
  width?: number;
  onPress: () => void;
}) {
  const dispatch = useAppDispatch();
  const [hover, setHover] = useState(false);
  const [added, setAdded] = useState(false);
  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const lift = (
    Platform.OS === 'web'
      ? {
          transform: [{ translateY: hover ? -6 : 0 }],
          boxShadow: hover ? '0 18px 40px rgba(17,24,39,0.18)' : '0 4px 14px rgba(17,24,39,0.08)',
          transitionProperty: 'transform, box-shadow',
          transitionDuration: '220ms',
        }
      : { shadowColor: '#111827', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 }
  ) as object;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      accessibilityRole="button"
      accessibilityLabel={`${product.title} by ${product.brand}, ${product.price} rupees`}
      style={[{ width, borderRadius: 26 }, lift]}
    >
      <View className="overflow-hidden bg-white dark:bg-neutral-900" style={{ borderRadius: 26 }}>
        <View>
          <RemoteImage asset={productAsset(product.id, product.title)} aspectRatio={0.9} radius={0} />
          {badge && (
            <View style={{ position: 'absolute', top: 12, left: 12 }}>
              <Glass radius={14} style={{ paddingHorizontal: 10, paddingVertical: 5 }}>
                <View className="flex-row items-center" style={{ gap: 5 }}>
                  <Icon name={badge === 'ai' ? 'sparkles' : 'trend-up'} size={12} color="#ffffff" />
                  <AppText variant="caption" style={{ color: '#ffffff', fontWeight: '700' }}>
                    {badge === 'ai' ? 'AI picked' : 'Bestseller'}
                  </AppText>
                </View>
              </Glass>
            </View>
          )}
          <Pressable
            onPress={() => {
              dispatch(addItem({ product }));
              setAdded(true);
              setTimeout(() => setAdded(false), 1400);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Quick add ${product.title}`}
            hitSlop={8}
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              height: 40,
              minWidth: 40,
              paddingHorizontal: added ? 14 : 0,
              borderRadius: 20,
              backgroundColor: added ? '#16a34a' : '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <Icon name={added ? 'check' : 'plus'} size={18} color={added ? '#ffffff' : '#111827'} />
            {added && (
              <AppText variant="caption" style={{ color: '#ffffff', fontWeight: '700' }}>
                Added
              </AppText>
            )}
          </Pressable>
        </View>
        <View className="p-4" style={{ gap: 4 }}>
          <AppText variant="caption" muted numberOfLines={1}>
            {product.brand}
          </AppText>
          <AppText variant="label" numberOfLines={2} style={{ minHeight: 38 }}>
            {product.title}
          </AppText>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-baseline" style={{ gap: 6 }}>
              <AppText variant="h3">₹{product.price}</AppText>
              {off > 0 && (
                <AppText variant="caption" muted style={{ textDecorationLine: 'line-through' }}>
                  ₹{product.mrp}
                </AppText>
              )}
            </View>
            <View className="flex-row items-center" style={{ gap: 3 }}>
              <Icon name="star" size={12} color="#111827" />
              <AppText variant="caption" style={{ fontWeight: '600' }}>
                {product.rating}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
});
