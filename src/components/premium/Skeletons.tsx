import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@components/ui';

/** Product card placeholder matching the real card proportions so nothing jumps on load. */
export function ProductCardSkeleton({ width }: { width?: number }) {
  return (
    <View style={[{ gap: 10 }, width ? { width } : { flex: 1 }]}>
      <Skeleton height={width ? width * 1.1 : 190} radius={24} />
      <Skeleton width="45%" height={10} />
      <Skeleton width="85%" height={14} />
      <Skeleton width="55%" height={16} />
    </View>
  );
}

export function ProviderCardSkeleton() {
  return (
    <View className="rounded-3xl bg-white p-4 dark:bg-surface-dark-2" style={{ gap: 14 }}>
      <View className="flex-row items-center" style={{ gap: 14 }}>
        <Skeleton width={64} height={64} radius={32} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <View className="flex-row" style={{ gap: 8 }}>
        <Skeleton width={80} height={26} radius={13} />
        <Skeleton width={96} height={26} radius={13} />
        <Skeleton width={70} height={26} radius={13} />
      </View>
      <Skeleton height={44} radius={16} />
    </View>
  );
}

export function WidgetSkeleton({ height = 120 }: { height?: number }) {
  return (
    <View className="px-5">
      <Skeleton height={height} radius={28} />
    </View>
  );
}
