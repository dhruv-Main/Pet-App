import React from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@components/ui';
import { RemoteImage } from '@components/media';
import { PressableScale } from '@components/premium';
import { providerAsset } from '@services/media/imageService';
import type { ServiceProvider, ServiceType } from '@apptypes/domain';

export const TYPE_LABEL: Record<ServiceType, string> = {
  vet_teleconsult: 'Teleconsult',
  vet_clinic: 'Vet clinic',
  grooming: 'Grooming',
  training: 'Training',
  walking: 'Dog walking',
  boarding: 'Boarding',
  pet_sitting: 'Pet sitting',
  taxi: 'Pet taxi',
  relocation: 'Relocation',
  ambulance: 'Pet ambulance',
};

/** Stable demo distance (km) derived from the provider id. */
export function demoDistanceKm(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 997;
  return Math.round((0.6 + (h % 58) / 10) * 10) / 10;
}

export const isAvailableToday = (p: ServiceProvider) => /^today/i.test(p.nextAvailable);

interface Props {
  provider: ServiceProvider;
  variant?: 'row' | 'tile';
  onPress: () => void;
  onBook: () => void;
}

function Meta({ p }: { p: ServiceProvider }) {
  const today = isAvailableToday(p);
  return (
    <View style={{ gap: 4 }}>
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <View className="flex-row items-center" style={{ gap: 3 }}>
          <Icon name="star" size={12} color="#111827" />
          <AppText variant="caption" style={{ fontWeight: '600' }}>
            {p.rating}
          </AppText>
          <AppText variant="caption" muted>
            ({p.reviewCount})
          </AppText>
        </View>
        <View className="flex-row items-center" style={{ gap: 3 }}>
          <Icon name="pin" size={12} color="#6b7280" />
          <AppText variant="caption" muted>
            {demoDistanceKm(p.id)} km
          </AppText>
        </View>
      </View>
      <View className="flex-row items-center" style={{ gap: 6 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: today ? '#16a34a' : '#9ca3af' }} />
        <AppText variant="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>
          {today ? `Available ${p.nextAvailable.replace(/^today,?\s*/i, '')}` : `Next ${p.nextAvailable}`}
        </AppText>
      </View>
    </View>
  );
}

function VerifiedPill() {
  return (
    <View
      className="flex-row items-center rounded-full bg-white px-2 py-1"
      style={{ gap: 4, position: 'absolute', top: 8, left: 8 }}
    >
      <Icon name="shield" size={11} color="#111827" />
      <AppText variant="caption" style={{ color: '#111827', fontWeight: '600', fontSize: 11 }}>
        Verified
      </AppText>
    </View>
  );
}

function BookButton({ onBook, name }: { onBook: () => void; name: string }) {
  return (
    <PressableScale
      onPress={onBook}
      accessibilityRole="button"
      accessibilityLabel={`Book ${name}`}
      style={{ height: 36, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }}
    >
      <AppText variant="label" style={{ color: '#ffffff' }}>
        Book
      </AppText>
    </PressableScale>
  );
}

export const ProviderCard = React.memo(function ProviderCard({ provider: p, variant = 'row', onPress, onBook }: Props) {
  const specialty = p.specialties?.[0] ?? TYPE_LABEL[p.type];
  const label = `${p.name}, ${specialty}, rated ${p.rating}${p.verified ? ', verified' : ''}`;

  if (variant === 'tile') {
    return (
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{ width: 250 }}
      >
        <View className="overflow-hidden rounded-3xl bg-white dark:bg-neutral-900" style={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
          <View>
            <RemoteImage asset={providerAsset(p.id, p.name)} aspectRatio={4 / 3} radius={0} />
            {p.verified && <VerifiedPill />}
          </View>
          <View className="p-3" style={{ gap: 8 }}>
            <View>
              <AppText variant="label" numberOfLines={1}>
                {p.name}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                {specialty}
              </AppText>
            </View>
            <Meta p={p} />
            <View className="flex-row items-center justify-between">
              <AppText variant="label">
                ₹{p.pricePerSession}
                <AppText variant="caption" muted>
                  {' '}
                  / session
                </AppText>
              </AppText>
              <BookButton onBook={onBook} name={p.name} />
            </View>
          </View>
        </View>
      </PressableScale>
    );
  }

  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View
        className="flex-row overflow-hidden rounded-3xl bg-white p-3 dark:bg-neutral-900"
        style={{ gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}
      >
        <View style={{ width: 96 }}>
          <RemoteImage asset={providerAsset(p.id, p.name)} aspectRatio={1} radius={18} />
          {p.verified && (
            <View className="absolute bottom-1 right-1 h-6 w-6 items-center justify-center rounded-full bg-white">
              <Icon name="shield" size={13} color="#111827" />
            </View>
          )}
        </View>
        <View style={{ flex: 1, gap: 6, justifyContent: 'space-between' }}>
          <View>
            <AppText variant="label" numberOfLines={1}>
              {p.name}
            </AppText>
            <AppText variant="caption" muted numberOfLines={1}>
              {specialty}
              {p.verified ? ' · Verified' : ''}
            </AppText>
          </View>
          <Meta p={p} />
          <View className="flex-row items-center justify-between">
            <AppText variant="label">₹{p.pricePerSession}</AppText>
            <BookButton onBook={onBook} name={p.name} />
          </View>
        </View>
      </View>
    </PressableScale>
  );
});
