import type { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import type { RootStackParamList } from '@navigation/types';

/**
 * Deep link map. Examples:
 *   petos://passport/p1          open a passport
 *   petos://verify/PP-IN-7F3A    resolve a scanned or shared passport credential
 *   petos://agent                open the Agent Center
 *   petos://notifications        open notifications
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'petos://'],
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: {
            screens: {
              Dashboard: 'home',
              PetProfile: 'pet/:petId',
              Passport: 'passport/:petId?',
              VerifyPassport: 'verify/:code',
              TwinDashboard: 'twin/:petId?',
              AgentCenter: 'agent',
              ConsentCenter: 'consent',
              Notifications: 'notifications',
              VerificationRequest: 'verification/:petId?',
            },
          },
          ShopTab: 'shop',
          ServicesTab: 'services',
          CommunityTab: 'community',
          ProfileTab: 'profile',
        },
      },
    },
  },
};

/** Extracts the passport id from a `petos://verify/<id>` payload (QR content). */
export function parsePassportCode(raw: string): string | null {
  const m = /^petos:\/\/verify\/([A-Za-z0-9-]{6,40})$/.exec(raw.trim());
  return m ? m[1] : null;
}
