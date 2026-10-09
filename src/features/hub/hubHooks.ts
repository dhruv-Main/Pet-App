import { useMemo } from 'react';
import { useAppSelector } from '@store/hooks';
import { usePets } from '@services/data';

export interface RosterPet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | string;
  breed: string;
  ageMonths: number;
  weightKg?: number;
  extra: boolean;
}

/** The signed-in user's pets plus any added in this session. Guests always get an empty roster. */
export function useRoster(): RosterPet[] {
  const pets = usePets().data;
  const extra = useAppSelector((s) => s.hub.extraPets);
  return useMemo(
    () => [
      ...pets.map((p) => ({ id: p.id, name: p.name, species: p.species, breed: p.breed, ageMonths: p.ageMonths, weightKg: p.weightKg, extra: false })),
      ...extra.map((p) => ({ id: p.id, name: p.name, species: p.species, breed: p.breed, ageMonths: Math.round(p.ageYears * 12), weightKg: undefined, extra: true })),
    ],
    [pets, extra],
  );
}

export function useActiveRosterPet(): RosterPet | undefined {
  const roster = useRoster();
  const id = useAppSelector((s) => s.ui.activePetId);
  return roster.find((p) => p.id === id) ?? roster[0];
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
