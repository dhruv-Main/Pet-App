import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { AppText, Button, Card, IconButton } from '@components/ui';
import { ScreenHeader } from '@components/platform';
import { useFeatureFlags } from '@platform/config/featureFlags';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  layoutReset,
  selectDashboardHidden,
  selectDashboardOrder,
  widgetMoved,
  widgetToggled,
} from './dashboardSlice';
import { WIDGETS } from './widgets/registry';

/**
 * Reorder and show or hide dashboard widgets. Move controls are used instead of
 * drag handles so the screen is fully usable with a screen reader or switch control.
 */
export function DashboardLayoutScreen() {
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const dispatch = useAppDispatch();
  const order = useAppSelector(selectDashboardOrder);
  const hidden = useAppSelector(selectDashboardHidden);
  const { flags } = useFeatureFlags();

  const available = order.filter((id) => !WIDGETS[id].flag || flags[WIDGETS[id].flag as keyof typeof flags]);

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader
        title="Customise dashboard"
        subtitle="Order and visibility"
        onBack={() => nav.goBack()}
        right={<Button label="Reset" size="sm" variant="ghost" onPress={() => dispatch(layoutReset())} />}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 10 }}>
        {available.map((id, index) => {
          const w = WIDGETS[id];
          const isHidden = hidden.includes(id);
          return (
            <Card key={id} className="flex-row items-center" style={{ gap: 10, opacity: isHidden ? 0.6 : 1 }}>
              <View className="flex-1">
                <AppText variant="label">{w.title}</AppText>
                <AppText variant="caption" muted>
                  {isHidden ? 'Hidden' : w.description}
                </AppText>
              </View>
              <IconButton
                icon="arrow-up"
                label={`Move ${w.title} up`}
                disabled={index === 0}
                onPress={() => dispatch(widgetMoved({ id, direction: -1 }))}
              />
              <IconButton
                icon="arrow-down"
                label={`Move ${w.title} down`}
                disabled={index === available.length - 1}
                onPress={() => dispatch(widgetMoved({ id, direction: 1 }))}
              />
              <IconButton
                icon={isHidden ? 'eye-off' : 'eye'}
                label={isHidden ? `Show ${w.title}` : `Hide ${w.title}`}
                selected={!isHidden}
                onPress={() => dispatch(widgetToggled(id))}
              />
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}
