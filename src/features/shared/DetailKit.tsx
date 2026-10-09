import React from 'react';
import { ScrollView, View } from 'react-native';
import { AppText, Icon, IconBadge } from '@components/ui';
import type { IconName } from '@components/ui';
import { RemoteImage } from '@components/media';
import type { MediaAsset } from '@services/media/imageService';

export function hashOf(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Titled block used by the product and provider detail pages. */
export function DetailSection({
  eyebrow,
  title,
  right,
  children,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={{ paddingTop: 32 }}>
      <View className="flex-row items-end justify-between" style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
        <View style={{ flex: 1, gap: 2 }}>
          {eyebrow ? (
            <AppText variant="eyebrow" className="text-primary-600 dark:text-primary-300">
              {eyebrow}
            </AppText>
          ) : null}
          <AppText variant="h2" accessibilityRole="header">
            {title}
          </AppText>
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function HRail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
      {children}
    </ScrollView>
  );
}

/** Soft surface used for grouped detail content. */
export function Surface({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View
      className="bg-white dark:bg-surface-dark-2"
      style={[{ borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(107,115,144,0.14)' }, style]}
    >
      {children}
    </View>
  );
}

export function FactTile({
  icon,
  label,
  value,
  tone = 'primary',
}: {
  icon: IconName;
  label: string;
  value: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      className="bg-white dark:bg-surface-dark-2"
      style={{ flexGrow: 1, flexBasis: '47%', borderRadius: 20, padding: 14, gap: 10, borderWidth: 1, borderColor: 'rgba(107,115,144,0.14)' }}
    >
      <IconBadge name={icon} tone={tone} size={36} />
      <View style={{ gap: 2 }}>
        <AppText variant="caption" muted>
          {label}
        </AppText>
        <AppText variant="label" numberOfLines={2}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export function InfoRow({ icon, title, body, tone = 'primary' }: { icon: IconName; title: string; body: string; tone?: 'primary' | 'success' | 'warning' | 'neutral' }) {
  return (
    <View className="flex-row" style={{ gap: 14, alignItems: 'flex-start' }}>
      <IconBadge name={icon} tone={tone} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" muted style={{ lineHeight: 18 }}>
          {body}
        </AppText>
      </View>
    </View>
  );
}

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <View className="flex-row" style={{ gap: 2 }} accessible accessibilityLabel={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} color={i <= Math.round(value) ? '#f59e0b' : '#d1d5db'} />
      ))}
    </View>
  );
}

/** Rating summary: big average plus a 5-to-1 distribution derived from the average. */
export function RatingSummary({ rating, count }: { rating: number; count: number }) {
  const w = [5, 4, 3, 2, 1].map((s) => Math.max(0.02, Math.exp(-Math.pow(s - Math.min(5, rating + 0.35), 2) / 1.2)));
  const total = w.reduce((a, b) => a + b, 0);
  return (
    <View className="flex-row items-center" style={{ gap: 20 }}>
      <View style={{ alignItems: 'center', gap: 4, minWidth: 84 }}>
        <AppText style={{ fontSize: 44, lineHeight: 48, fontWeight: '800', letterSpacing: -1.2 }}>{rating.toFixed(1)}</AppText>
        <Stars value={rating} />
        <AppText variant="caption" muted>
          {count.toLocaleString('en-IN')} reviews
        </AppText>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        {[5, 4, 3, 2, 1].map((s, i) => (
          <View key={s} className="flex-row items-center" style={{ gap: 8 }}>
            <AppText variant="caption" muted style={{ width: 10 }}>
              {s}
            </AppText>
            <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(107,115,144,0.18)', overflow: 'hidden' }}>
              <View style={{ width: `${Math.round((w[i] / total) * 100)}%`, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export interface ReviewItem {
  name: string;
  when: string;
  rating: number;
  title: string;
  body: string;
  tag?: string;
  photos?: MediaAsset[];
}

export function ReviewCard({ r, width }: { r: ReviewItem; width?: number }) {
  const initials = r.name
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2);
  return (
    <View
      className="bg-white dark:bg-surface-dark-2"
      style={{ width, borderRadius: 22, padding: 16, gap: 10, borderWidth: 1, borderColor: 'rgba(107,115,144,0.14)' }}
    >
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(24,101,245,0.12)', alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="label" className="text-primary-700 dark:text-primary-300">
            {initials}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="label">{r.name}</AppText>
          <AppText variant="caption" muted>
            {r.when}
            {r.tag ? ` · ${r.tag}` : ''}
          </AppText>
        </View>
        <Stars value={r.rating} size={12} />
      </View>
      <AppText variant="label">{r.title}</AppText>
      <AppText variant="caption" muted style={{ lineHeight: 18 }}>
        {r.body}
      </AppText>
      {r.photos && r.photos.length > 0 && (
        <View className="flex-row" style={{ gap: 8 }}>
          {r.photos.map((p, i) => (
            <View key={i} style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden' }}>
              <RemoteImage asset={p} fill />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function Pill({ label, icon, tone = 'neutral' }: { label: string; icon?: IconName; tone?: 'neutral' | 'primary' | 'success' }) {
  const bg = tone === 'primary' ? 'rgba(24,101,245,0.1)' : tone === 'success' ? 'rgba(34,197,94,0.14)' : 'rgba(107,115,144,0.12)';
  const fg = tone === 'primary' ? '#1d4ed8' : tone === 'success' ? '#15803d' : '#4a5170';
  return (
    <View className="flex-row items-center self-start" style={{ gap: 5, backgroundColor: bg, borderRadius: 16, paddingHorizontal: 11, height: 30 }}>
      {icon ? <Icon name={icon} size={13} color={fg} /> : null}
      <AppText variant="label" style={{ color: fg }}>
        {label}
      </AppText>
    </View>
  );
}
