import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../types';
import { CatalogScreen } from '@features/commerce/CatalogScreen';
import { ProductDetailScreen } from '@features/commerce/ProductDetailScreen';
import { CartScreen } from '@features/cart/CartScreen';
import { CheckoutScreen } from '@features/cart/CheckoutScreen';
import { guarded } from '@features/auth/AuthPrompt';

const Stack = createNativeStackNavigator<ShopStackParamList>();
const GuardedCheckout = guarded(CheckoutScreen, 'Sign in to check out. Your cart is saved.');

export function ShopStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Catalog" component={CatalogScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={GuardedCheckout} />
    </Stack.Navigator>
  );
}
