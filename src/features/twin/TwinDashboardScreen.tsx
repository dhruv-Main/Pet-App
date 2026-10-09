import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import type { InsightKind } from '@apptypes/platform';
import { AppText, Card, ErrorState, Icon, IconBadge, Skeleton } from '@components/ui';
import type { IconName } from '@components/ui';
import {
  BarChart,
  MetricTile,
  RiskIndicator,
  ScoreRing,
  ScreenHeader,
  Sparkline,
  riskLabel,
} from '@components/platform';
import { useGetTwinHistoryQuery, useGetTwinSnapshotQuery } from '@services/api/platformApi';
import { useFeatureFlag } from '@platform/config/featureFlags';
import { TwinHistorySection } from './TwinHistorySection';
import { usePet } from '@services/data';
import type { Pet } from '@apptypes/domain';
import { EmptyState, ScreenFallback } from '@components/ui';

const insightIcon: Record<InsightKind, IconName> = {
  health: 'heart-pulse',
  nutrition: 'utensils',
  commerce: 'cart',
  lifestage: 'paw',
  behavior: 'activity',
};

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

export function TwinDashboardScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'TwinDashboard'>>();
  const pet = usePet(route.params?.petId).data;
  if (!pet) {
    return (
      <ScreenFallback>
        <EmptyState title="Pet not found" description="This pet is no longer available." />
      </ScreenFallback>
    );
  }
  return <TwinDashboardContent pet={pet} />;
}

function TwinDashboardContent({ pet }: { pet: Pet }) {
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const petId = pet.id;
  const { data, isLoading, isError, refetch } = useGetTwinSnapshotQuery({ petId });
  const historyOn = useFeatureFlag('twinHistory');
  const history = useGetTwinHistoryQuery({ petId }, { skip: !historyOn });

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader title="Digital Twin" subtitle={`${pet.name}, ${pet.breed}`} onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
        {isLoading && (
          <View style={{ gap: 12 }}>
            <Skeleton height={150} radius={16} />
            <Skeleton height={200} radius={16} />
            <Skeleton height={120} radius={16} />
          </View>
        )}
        {isError && <ErrorState message="Twin data is unavailable." onRetry={refetch} />}
        {data && (
          <>
            <Card className="flex-row items-center" style={{ gap: 16 }}>
              <ScoreRing value={data.risk.overall} label="Wellness" />
              <View className="flex-1" style={{ gap: 4 }}>
                <AppText variant="h3">{riskLabel[data.risk.level]} overall risk</AppText>
                <AppText variant="caption" muted>
                  Model {data.risk.modelVersion}, confidence {Math.round(data.risk.confidence * 100)}%
                </AppText>
                <AppText variant="caption" muted>
                  Updated {new Date(data.capturedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </AppText>
              </View>
            </Card>

            <View className="flex-row" style={{ gap: 12 }}>
              <MetricTile icon="footprints" label="Avg steps" value={Math.round(avg(data.weeklySteps)).toLocaleString('en-IN')} />
              <MetricTile
                icon="moon"
                label="Avg sleep"
                value={`${(avg(data.weeklySleepMinutes) / 60).toFixed(1)} h`}
                tone="neutral"
              />
            </View>

            <Card style={{ gap: 10 }}>
              <AppText variant="h3">Activity, last 7 days</AppText>
              <BarChart data={data.weeklySteps} />
            </Card>

            <Card style={{ gap: 10 }}>
              <View className="flex-row items-center justify-between">
                <AppText variant="h3">Sleep trend</AppText>
                <Sparkline data={data.weeklySleepMinutes} />
              </View>
            </Card>

            <Card style={{ gap: 14 }}>
              <AppText variant="h3">Risk factors</AppText>
              {data.risk.factors.map((f) => (
                <View key={f.key} style={{ gap: 4 }}>
                  <RiskIndicator level={f.level} score={f.score} label={f.label} confidence={f.confidence} />
                  <AppText variant="caption" muted>
                    {f.drivers.join(' | ')}
                  </AppText>
                </View>
              ))}
            </Card>

            <Card style={{ gap: 10 }}>
              <AppText variant="h3">Nutrition</AppText>
              <BarChart data={data.nutrition.weeklyIntakeKcal} target={data.nutrition.targetKcal} />
              <AppText variant="caption" muted>
                Today {data.nutrition.actualKcal} kcal of {data.nutrition.targetKcal} kcal. Protein {data.nutrition.proteinPct}%, fat{' '}
                {data.nutrition.fatPct}%, carbs {data.nutrition.carbPct}%.
              </AppText>
            </Card>

            <Card style={{ gap: 8 }}>
              <AppText variant="h3">Life stage: {data.lifeStage.stage}</AppText>
              <AppText variant="caption" muted>
                Next: {data.lifeStage.nextMilestone}
              </AppText>
              {data.lifeStage.guidance.map((g) => (
                <View key={g} className="flex-row items-center" style={{ gap: 8 }}>
                  <Icon name="check" size={14} color="#16a34a" />
                  <AppText variant="caption">{g}</AppText>
                </View>
              ))}
            </Card>

            <AppText variant="h3">Predictive insights</AppText>
            {data.insights.map((i) => (
              <Card key={i.id} className="flex-row" style={{ gap: 12 }}>
                <IconBadge name={insightIcon[i.kind]} />
                <View className="flex-1" style={{ gap: 2 }}>
                  <AppText variant="label">{i.title}</AppText>
                  <AppText variant="caption" muted>
                    {i.summary}
                  </AppText>
                  <AppText variant="caption" muted>
                    Confidence {Math.round(i.confidence * 100)}%, horizon {i.horizonDays} days
                  </AppText>
                </View>
              </Card>
            ))}

            {historyOn && history.isLoading && <Skeleton height={220} radius={16} />}
            {historyOn && history.data && <TwinHistorySection history={history.data} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}
