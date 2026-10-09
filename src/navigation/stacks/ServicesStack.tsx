import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ServicesStackParamList } from '../types';
import { ServicesHomeScreen } from '@features/services/ServicesHomeScreen';
import { ProviderDetailScreen } from '@features/services/ProviderDetailScreen';
import { BookingScreen } from '@features/services/BookingScreen';
import { guarded } from '@features/auth/AuthPrompt';

const Stack = createNativeStackNavigator<ServicesStackParamList>();
const GuardedBooking = guarded(BookingScreen, 'Sign in to book a provider.');

export function ServicesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="ServicesHome" component={ServicesHomeScreen} />
      <Stack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
      <Stack.Screen name="Booking" component={GuardedBooking} />
    </Stack.Navigator>
  );
}
