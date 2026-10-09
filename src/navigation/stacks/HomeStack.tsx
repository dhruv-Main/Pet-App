import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types';
import { DashboardScreen } from '@features/home/DashboardScreen';
import { PetProfileScreen } from '@features/pets/PetProfileScreen';
import { ProductDetailScreen } from '@features/commerce/ProductDetailScreen';
import { AiAssistantScreen } from '@features/ai/AiAssistantScreen';
import { PassportScreen } from '@features/identity/PassportScreen';
import { ConsentCenterScreen } from '@features/consent/ConsentCenterScreen';
import { TwinDashboardScreen } from '@features/twin/TwinDashboardScreen';
import { AgentCenterScreen } from '@features/agent/AgentCenterScreen';
import { NotificationCenterScreen } from '@features/notifications/NotificationCenterScreen';
import { QRScannerScreen } from '@features/identity/QRScannerScreen';
import { VerifyPassportScreen } from '@features/identity/VerifyPassportScreen';
import { VerificationRequestScreen } from '@features/identity/VerificationRequestScreen';
import { DashboardLayoutScreen } from '@features/home/DashboardLayoutScreen';
import { OrdersScreen } from '@features/orders/OrdersScreen';
import { GuestHomeScreen } from '@features/home/GuestHomeScreen';
import { guarded } from '@features/auth/AuthPrompt';
import { HubScreen, HubListScreen, HubEntryScreen, HubActionScreen, HubActivityScreen } from '@features/hub/HubScreens';
import { HubToolScreen } from '@features/hub/HubTools';
import { useAppSelector } from '@store/hooks';

const Stack = createNativeStackNavigator<HomeStackParamList>();

function HomeEntry() {
  const member = useAppSelector((s) => s.auth.status === 'authenticated');
  return member ? <DashboardScreen /> : <GuestHomeScreen />;
}

const G = {
  PetProfile: guarded(PetProfileScreen, 'Sign in to view your pet profile and health records.'),
  AiAssistant: guarded(AiAssistantScreen, 'Sign in to chat with the Pet OS assistant about your pet.'),
  Passport: guarded(PassportScreen, 'Sign in to open your pet passport.'),
  ConsentCenter: guarded(ConsentCenterScreen, 'Sign in to manage data consent.'),
  TwinDashboard: guarded(TwinDashboardScreen, 'Sign in to see your pet digital twin.'),
  AgentCenter: guarded(AgentCenterScreen, 'Sign in to use the Agent Center.'),
  Notifications: guarded(NotificationCenterScreen, 'Sign in to see your notifications.'),
  QRScanner: guarded(QRScannerScreen, 'Sign in to scan and verify passports.'),
  VerifyPassport: guarded(VerifyPassportScreen, 'Sign in to verify a passport.'),
  VerificationRequest: guarded(VerificationRequestScreen, 'Sign in to request verification.'),
  Orders: guarded(OrdersScreen, 'Sign in to see your orders.'),
  DashboardLayout: guarded(DashboardLayoutScreen, 'Sign in to customise your dashboard.'),
  HubActivity: guarded(HubActivityScreen, 'Sign in to see your requests and saved items.'),
};

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Dashboard" component={HomeEntry} />
      <Stack.Screen name="PetProfile" component={G.PetProfile} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen
        name="AiAssistant"
        component={G.AiAssistant}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Passport" component={G.Passport} />
      <Stack.Screen name="ConsentCenter" component={G.ConsentCenter} />
      <Stack.Screen name="TwinDashboard" component={G.TwinDashboard} />
      <Stack.Screen name="AgentCenter" component={G.AgentCenter} />
      <Stack.Screen name="Notifications" component={G.Notifications} />
      <Stack.Screen name="QRScanner" component={G.QRScanner} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="VerifyPassport" component={G.VerifyPassport} />
      <Stack.Screen name="VerificationRequest" component={G.VerificationRequest} />
      <Stack.Screen name="Orders" component={G.Orders} />
      <Stack.Screen name="DashboardLayout" component={G.DashboardLayout} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Hub" component={HubScreen} />
      <Stack.Screen name="HubList" component={HubListScreen} />
      <Stack.Screen name="HubEntry" component={HubEntryScreen} />
      <Stack.Screen name="HubAction" component={HubActionScreen} />
      <Stack.Screen name="HubActivity" component={G.HubActivity} />
      <Stack.Screen name="HubTool" component={HubToolScreen} />
    </Stack.Navigator>
  );
}
