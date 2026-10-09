import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { RiskFactorKey, TwinHistory, TwinHistoryPoint } from '@apptypes/platform';
import { AppText, Badge, Card, Icon, IconBadge, toneColor } from '@components/ui';
import {
  ActivityGraph,
  DeltaChip,
  HealthTrendGraph,
  LineChart,
  RangeSelector,
  SeriesPoint,
} from '@components/analytics';
import { percentDelta } from '@components/analytics/chartMath';

const FACTOR_LABEL: Record<RiskFactorKey, string> = {
  joint: 'Joint',
  obesity: 'Weight',
  dental: 'Dental',
  dermatologic: 'Skin',
  renal: 'Renal',
  cardiac: 'Cardiac',
};

const IMPACT_TONE = { low: 'neutral', medium: 'warning', high: 'danger' } as const;

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

function weeklySnapshots(points: TwinHistoryPoint[]) {
  const out: { label: string; wellness: number; steps: number; confidence: number }[] = [];
  for (let end = points.length; end > 0 && out.length < 4; end -= 7) {
    const chunk = points.slice(Math.max(0, end - 7), end);
    if (chunk.length === 0) break;
    const last = chunk[chunk.length - 1];
    out.push({
      label: `Week ending ${fmtDay(last.date)}`,
      wellness: last.wellness,
      steps: Math.round(chunk.reduce((s, p) => s + p.steps, 0) / chunk.length),
      confidence: last.confidence,
    });
  }
  return out;
}

/** Trend, trajectory, recommendation and snapshot sections that sit under the live Twin snapshot. */
export function TwinHistorySection({ history }: { history: TwinHistory }) {
  const { points, recommendations } = history;
  const factorKeys = useMemo(() => {
    const last = points[points.length - 1];
    if (!last) return [] as RiskFactorKey[];
    return (Object.keys(last.factorScores) as RiskFactorKey[])
      .sort((a, b) => last.factorScores[b] - last.factorScores[a])
      .slice(0, 3);
  }, [points]);
  const [factor, setFactor] = useState<RiskFactorKey>(factorKeys[0] ?? 'joint');

  const trajectory: SeriesPoint[] = points.map((p) => ({ label: fmtDay(p.date), value: p.factorScores[factor] }));
  const snapshots = useMemo(() => weeklySnapshots(points), [points]);
  const latestConfidence = points[points.length - 1]?.confidence ?? 0;
  const firstConfidence = points[0]?.confidence ?? 0;

  return (
    <View style={{ gap: 16 }}>
      <Card className="flex-row items-center" style={{ gap: 12 }}>
        <IconBadge name="cpu" tone="primary" />
        <View className="flex-1" accessible accessibilityLabel={`Model confidence ${Math.round(latestConfidence * 100)} percent`}>
          <AppText variant="label">Model confidence {Math.round(latestConfidence * 100)}%</AppText>
          <AppText variant="caption" muted>
            Up from {Math.round(firstConfidence * 100)}% as more telemetry accumulates.
          </AppText>
        </View>
        <DeltaChip pct={percentDelta(points.map((p) => p.confidence))} />
      </Card>

      <AppText variant="h3" accessibilityRole="header">
        Health trends
      </AppText>
      <HealthTrendGraph history={points} />
      <ActivityGraph history={points} />

      <AppText variant="h3" accessibilityRole="header">
        Risk trajectory
      </AppText>
      <Card style={{ gap: 12 }}>
        <RangeSelector
          options={factorKeys.map((k) => ({ label: FACTOR_LABEL[k], value: k }))}
          value={factor}
          onChange={setFactor}
        />
        <LineChart
          data={trajectory}
          color={toneColor.warning.fg}
          domain={[0, 100]}
          yTicks={3}
          summary={`${FACTOR_LABEL[factor]} risk score over ${points.length} days, now ${trajectory[trajectory.length - 1]?.value ?? 0} of 100`}
        />
        <AppText variant="caption" muted>
          Higher is worse. Scores are model estimates, not a diagnosis.
        </AppText>
      </Card>

      <AppText variant="h3" accessibilityRole="header">
        30 day change by factor
      </AppText>
      <Card style={{ gap: 12 }}>
        {(Object.keys(points[0]?.factorScores ?? {}) as RiskFactorKey[]).map((k) => {
          const start = points[0].factorScores[k];
          const end = points[points.length - 1].factorScores[k];
          const delta = end - start;
          const tone = delta > 3 ? 'warning' : delta < -3 ? 'success' : 'neutral';
          return (
            <View
              key={k}
              className="flex-row items-center justify-between"
              accessible
              accessibilityLabel={`${FACTOR_LABEL[k]} risk from ${start} to ${end}`}
            >
              <AppText variant="label">{FACTOR_LABEL[k]}</AppText>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <AppText variant="caption" muted>
                  {start} to {end}
                </AppText>
                <Badge label={`${delta > 0 ? '+' : ''}${delta}`} tone={tone} />
              </View>
            </View>
          );
        })}
      </Card>

      <AppText variant="h3" accessibilityRole="header">
        Recommendations
      </AppText>
      {recommendations.map((r) => (
        <Card key={r.id} style={{ gap: 8 }}>
          <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
            <AppText variant="label" className="flex-1">
              {r.title}
            </AppText>
            <Badge label={`${r.impact} impact`} tone={IMPACT_TONE[r.impact]} />
          </View>
          <AppText variant="caption" muted>
            {r.detail}
          </AppText>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Icon name="file" size={12} />
            <AppText variant="caption" muted>
              {r.source}, confidence {Math.round(r.confidence * 100)}%
            </AppText>
          </View>
        </Card>
      ))}

      <AppText variant="h3" accessibilityRole="header">
        Historical snapshots
      </AppText>
      <Card style={{ gap: 12 }}>
        {snapshots.map((s) => (
          <View
            key={s.label}
            className="flex-row items-center justify-between"
            accessible
            accessibilityLabel={`${s.label}. Wellness ${s.wellness}. ${s.steps} average steps. Confidence ${Math.round(s.confidence * 100)} percent.`}
          >
            <View>
              <AppText variant="label">{s.label}</AppText>
              <AppText variant="caption" muted>
                {s.steps.toLocaleString('en-IN')} avg steps, {Math.round(s.confidence * 100)}% confidence
              </AppText>
            </View>
            <AppText variant="h3">{s.wellness}</AppText>
          </View>
        ))}
      </Card>
    </View>
  );
}
