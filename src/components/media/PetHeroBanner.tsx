import React from 'react';
import { View } from 'react-native';
import type { Pet } from '@apptypes/domain';
import { AppText, Badge } from '@components/ui';
import { petHeroAsset } from '@services/media/imageService';
import { HeroImage } from './HeroImage';

/** Pet hero with photo (or blur-up surface), identity line and health score. */
export function PetHeroBanner({ pet }: { pet: Pet }) {
  const asset = petHeroAsset(pet.id, pet.name, pet.species === 'cat' ? 'cat' : 'dog');
  const years = Math.max(1, Math.round(pet.ageMonths / 12));
  return (
    <HeroImage
      asset={asset}
      aspectRatio={4 / 3}
      fallbackIcon={pet.species === 'cat' ? 'cat' : 'dog'}
      eyebrow={pet.breed}
      title={pet.name}
    >
      <View className="flex-row items-center" style={{ gap: 8, marginTop: 4 }}>
        <AppText variant="caption" className="text-white/85">
          {pet.gender} · {years} {years === 1 ? 'year' : 'years'} · {pet.weightKg} kg
        </AppText>
        <Badge label={`Health ${pet.healthScore}`} tone="success" />
      </View>
    </HeroImage>
  );
}
