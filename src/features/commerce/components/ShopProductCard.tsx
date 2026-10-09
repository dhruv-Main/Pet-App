import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { AppText, Icon } from '@components/ui';
import { RemoteImage } from '@components/media';
import { Glass } from '@components/premium';
import { productAsset } from '@services/media/imageService';
import { useAppDispatch } from '@store/hooks';
import { addItem } from '@features/cart/cartSlice';
import { wishlistStore } from '../recentlyViewed';
import type { Product } from '@apptypes/domain';

/** Premium shop tile: large image, discount and subscription badges, wishlist, floating quick add, optional AI match. */
export const ShopProductCard = React.memo(function ShopProductCard({
  product,
  width,
  onPress,
  match,
  reason,
  aspectRatio = 0.95,
}: {
  product: Product;
  width: number;
  onPress: () => void;
  /** 0-100 AI match score. */
  match?: number;
  reason?: string;
  aspectRatio?: number;
}) {
  const dispatch = useAppDispatch();
  const [hover, setHover] = useState(false);
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(wishlistStore.has(product.id));
  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const lift = (
    Platform.OS === 'web'
      ? {
          transform: [{ translateY: hover ? -6 : 0 }],
          boxShadow: hover ? '0 20px 44px rgba(17,24,39,0.20)' : '0 6px 18px rgba(17,24,39,0.08)',
          transitionProperty: 'transform, box-shadow',
          transitionDuration: '220ms',
        }
      : { shadowColor: '#111827', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 }
  ) as object;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      accessibilityRole="button"
      accessibilityLabel={`${product.title} by ${product.brand}, ${product.price} rupees${off ? `, ${off} percent off` : ''}${match ? `, ${match} percent match` : ''}`}
      style={[{ width, borderRadius: 26 }, lift]}
    >
      <View className="overflow-hidden bg-white dark:bg-neutral-900" style={{ borderRadius: 26 }}>
        <View>
          <RemoteImage asset={productAsset(product.id, product.title)} aspectRatio={aspectRatio} radius={0} />
          {off > 0 && (
            <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#111827', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 }}>
              <AppText variant="caption" style={{ color: '#fbbf24', fontWeight: '800' }}>
                Save {off}%
              </AppText>
            </View>
          )}
          <Pressable
            onPress={() => setLiked(wishlistStore.toggle(product.id))}
            accessibilityRole="button"
            accessibilityLabel={liked ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
            hitSlop={8}
            style={{ position: 'absolute', top: 10, right: 10 }}
          >
            <Glass radius={18} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="heart" size={17} color={liked ? '#f43f5e' : '#ffffff'} />
            </Glass>
          </Pressable>
          {product.isSubscribable && (
            <View style={{ position: 'absolute', left: 12, bottom: 12 }}>
              <Glass radius={14} style={{ paddingHorizontal: 9, paddingVertical: 5 }}>
                <View className="flex-row items-center" style={{ gap: 5 }}>
                  <Icon name="repeat" size={12} color="#ffffff" />
                  <AppText variant="caption" style={{ color: '#ffffff', fontWeight: '700' }}>
                    Subscribe
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
              height: 42,
              minWidth: 42,
              paddingHorizontal: added ? 14 : 0,
              borderRadius: 21,
              backgroundColor: added ? '#16a34a' : '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
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
        <View style={{ padding: 14, gap: 4 }}>
          {match != null && (
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <Icon name="sparkles" size={12} color="#7c3aed" />
              <AppText variant="caption" style={{ color: '#7c3aed', fontWeight: '800' }}>
                {match}% match
              </AppText>
            </View>
          )}
          <AppText variant="caption" muted numberOfLines={1}>
            {product.brand}
          </AppText>
          <AppText variant="label" numberOfLines={2} style={{ minHeight: 38 }}>
            {product.title}
          </AppText>
          {reason ? (
            <AppText variant="caption" muted numberOfLines={2} style={{ minHeight: 32 }}>
              {reason}
            </AppText>
          ) : null}
          <View className="flex-row items-center justify-between" style={{ marginTop: 2 }}>
            <View className="flex-row items-baseline" style={{ gap: 6 }}>
              <AppText variant="h3">₹{product.price.toLocaleString('en-IN')}</AppText>
              {off > 0 && (
                <AppText variant="caption" muted style={{ textDecorationLine: 'line-through' }}>
                  ₹{product.mrp.toLocaleString('en-IN')}
                </AppText>
              )}
            </View>
            <View className="flex-row items-center" style={{ gap: 3 }}>
              <Icon name="star" size={12} color="#f59e0b" />
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
