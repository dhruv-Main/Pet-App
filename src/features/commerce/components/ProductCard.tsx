import React from 'react';
import { View, Pressable } from 'react-native';
import { AppText, Badge, Card, Icon } from '@components/ui';
import type { IconName } from '@components/ui';
import { RemoteImage } from '@components/media';
import { productAsset } from '@services/media/imageService';
import { elevation } from '@theme/tokens';
import { Glass, PressableScale } from '@components/premium';
import { useAppDispatch } from '@store/hooks';
import { addItem } from '@features/cart/cartSlice';
import type { Product } from '@apptypes/domain';

export const categoryIcon: Record<string, IconName> = {
  food: 'utensils',
  treats: 'gift',
  supplements: 'pill',
  apparel: 'package',
  accessories: 'package',
  devices: 'cpu',
  toys: 'paw',
  healthcare: 'heart-pulse',
  grooming: 'scissors',
};

export const ProductCard = React.memo(function ProductCard({
  product,
  onPress,
  width,
}: {
  product: Product;
  onPress?: () => void;
  /** Fixed width for horizontal rails. Omit inside grids so the card fills its column. */
  width?: number;
}) {
  const dispatch = useAppDispatch();
  const [added, setAdded] = React.useState(false);
  const off = product.mrp > 0 ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const quickAdd = () => {
    dispatch(addItem({ product }));
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };
  return (
    <PressableScale
      onPress={onPress}
      style={width ? { width } : { flex: 1 }}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${product.brand}, ${product.price} rupees${off > 0 ? `, ${off} percent off` : ''}, rated ${product.rating}`}
      accessibilityHint="Opens product details"
    >
      <Card padded={false} style={[elevation.card]} className="overflow-hidden">
        <View>
          <RemoteImage asset={productAsset(product.id, product.title)} aspectRatio={1} />
          <View style={{ position: 'absolute', top: 10, left: 10 }}>
            <Glass radius={12} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Icon name="star" size={12} color="#fbbf24" />
                <AppText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
                  {product.rating}
                </AppText>
              </View>
            </Glass>
          </View>
          {off > 0 && (
            <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#111827', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
              <AppText variant="caption" style={{ color: '#fbbf24', fontWeight: '800' }}>
                -{off}%
              </AppText>
            </View>
          )}
          <Pressable
            onPress={quickAdd}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.title} to cart`}
            hitSlop={8}
            style={{ position: 'absolute', right: 10, bottom: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: added ? '#10b981' : '#1865f5', alignItems: 'center', justifyContent: 'center', ...elevation.soft }}
          >
            <Icon name={added ? 'check-circle' : 'plus'} size={20} color="#ffffff" />
          </Pressable>
        </View>
        <View className="p-3" style={{ gap: 4 }}>
          <AppText variant="eyebrow" muted numberOfLines={1}>
            {product.brand}
          </AppText>
          <AppText variant="label" numberOfLines={2} style={{ minHeight: 36 }}>
            {product.title}
          </AppText>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <AppText variant="h3">₹{product.price.toLocaleString('en-IN')}</AppText>
            <AppText variant="caption" muted style={{ textDecorationLine: 'line-through' }}>
              ₹{product.mrp.toLocaleString('en-IN')}
            </AppText>
          </View>
          {product.isSubscribable && <Badge label="Subscribe & save 10%" tone="premium" />}
        </View>
      </Card>
    </PressableScale>
  );
});
