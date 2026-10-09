import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CommunityStackParamList } from '../types';
import { FeedScreen } from '@features/community/FeedScreen';
import { PostDetailScreen } from '@features/community/PostDetailScreen';

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export function CommunityStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    </Stack.Navigator>
  );
}
