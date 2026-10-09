import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText, Card, Icon, IconBadge, toneColor } from '@components/ui';
import type { IconName } from '@components/ui';
import { useTheme } from '@theme/ThemeProvider';
import { LineChart, ChartLegend, SeriesPoint } from './LineChart';
import { formatCompact, percentDelta } from './chartMath';
import type { TwinHistoryPoint } from '@apptypes/platform';
import type { SpendingCategory, SubscriptionSummary } from '@services/mock/platformFixtures';

type Tone = keyof typeof toneColor;

// ---------- Delta chip ----------
export function DeltaChip({ pct, goodWhenUp = true }: { pct: number; goodWhenUp?: boolean }) {
  const up = pct >= 0;
  const good = up === goodWhenUp;
  const tone: Tone = Math.abs(pct) < 0.5 ? 'neutral' : good ? 'success' : 'warning';
  const t = toneColor[tone];
  return (
    <View
      className="flex-row items-center rounded-full"
      style={{ backgroundColor: t.bg, paddingHorizontal: 8, paddingVertical: 3, gap: 4 }}
      accessible
      accessibilityLabel={`${up ? 'Up' : 'Down'} ${Math.abs(pct).toFixed(1)} percent`}
    >
      <Icon name={up ? 'trend-up' : 'trend-down'} size={12} color={t.fg} />
      <AppText variant="caption" style={{ color: t.fg, fontWeight: '600' }}>
        {Math.abs(pct).toFixed(1)}%
      </AppText>
    </View>
  );
}

// ---------- MetricCard ----------
export function MetricCard({
  icon,
  label,
  value,
  unit,
  delta,
  goodWhenUp,
  tone = 'primary',
}: {
  icon: IconName;
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  goodWhenUp?: boolean;
  tone?: Tone;
}) {
  return (
    <Card className="flex-1" style={{ gap: 10, minWidth: 140 }}>
      <View className="flex-row items-center justify-between">
        <IconBadge name={icon} tone={tone} size={32} />
        {delta !== undefined && <DeltaChip pct={delta} goodWhenUp={goodWhenUp} />}
      </View>
      <View>
        <View className="flex-row items-baseline" style={{ gap: 4 }}>
          <AppText variant="h2">{value}</AppText>
          {unit && (
            <AppText variant="caption" muted>
              {unit}
            </AppText>
          )}
        </View>
        <AppText variant="caption" muted>
          {label}
        </AppText>
      </View>
    </Card>
  );
}

// ---------- Range selector ----------
export function RangeSelector<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      className="flex-row rounded-full"
      style={{ backgroundColor: theme.colors.surfaceAlt, padding: 3 }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            style={{
              minHeight: 32,
              minWidth: 44,
              paddingHorizontal: 12,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? theme.colors.surface : 'transparent',
            }}
          >
            <AppText variant="caption" style={{ fontWeight: active ? '700' : '500' }}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- TrendCard ----------
export function TrendCard({
  title,
  value,
  unit,
  series,
  color,
  goodWhenUp = true,
  target,
  summaryNoun,
  height = 140,
  right,
}: {
  title: string;
  value: string;
  unit?: string;
  series: SeriesPoint[];
  color?: string;
  goodWhenUp?: boolean;
  target?: number;
  summaryNoun: string;
  height?: number;
  right?: React.ReactNode;
}) {
  const delta = percentDelta(series.map((s) => s.value));
  const first = series[0]?.value ?? 0;
  const last = series[series.length - 1]?.value ?? 0;
  return (
    <Card style={{ gap: 12 }}>
      <View className="flex-row items-start justify-between" style={{ gap: 12 }}>
        <View style={{ gap: 2 }}>
          <AppText variant="label" muted>
            {title}
          </AppText>
          <View className="flex-row items-baseline" style={{ gap: 4 }}>
            <AppText variant="h1">{value}</AppText>
            {unit && (
              <AppText variant="caption" muted>
                {unit}
              </AppText>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <DeltaChip pct={delta} goodWhenUp={goodWhenUp} />
          {right}
        </View>
      </View>
      <LineChart
        data={series}
        height={height}
        color={color}
        target={target}
        summary={`${summaryNoun} trend, from ${formatCompact(first)} to ${formatCompact(last)} over ${series.length} points`}
      />
    </Card>
  );
}

// ---------- ActivityGraph ----------
export function ActivityGraph({
  history,
  goal = 10000,
}: {
  history: TwinHistoryPoint[];
  goal?: number;
}) {
  const [range, setRange] = useState<7 | 14 | 30>(14);
  const { theme } = useTheme();
  const slice = useMemo(() => history.slice(-range), [history, range]);
  const max = Math.max(goal, ...slice.map((p) => p.steps));
  const barArea = 110;
  const avg = Math.round(slice.reduce((s, p) => s + p.steps, 0) / Math.max(1, slice.length));
  const daysAtGoal = slice.filter((p) => p.steps >= goal).length;
  const goalTop = barArea - (goal / max) * barArea;

  return (
    <Card style={{ gap: 12 }}>
      <View className="flex-row items-center justify-between">
        <View>
          <AppText variant="label" muted>
            Daily activity
          </AppText>
          <AppText variant="h2">{avg.toLocaleString('en-IN')} steps avg</AppText>
        </View>
        <RangeSelector
          options={[
            { label: '7D', value: 7 as const },
            { label: '14D', value: 14 as const },
            { label: '30D', value: 30 as const },
          ]}
          value={range}
          onChange={setRange}
        />
      </View>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Steps per day for ${range} days. Goal met on ${daysAtGoal} days.`}
        style={{ height: barArea }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: range > 14 ? 2 : 4, height: barArea }}>
          {slice.map((p, i) => (
            <View
              key={p.date}
              style={{
                flex: 1,
                height: Math.max(3, (p.steps / max) * barArea),
                borderRadius: 3,
                backgroundColor: p.steps >= goal ? theme.colors.primary : theme.colors.primaryMuted,
                opacity: i === slice.length - 1 ? 1 : 0.9,
              }}
            />
          ))}
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: goalTop,
            borderTopWidth: 1,
            borderStyle: 'dashed',
            borderColor: theme.colors.textMuted,
          }}
        />
      </View>
      <View className="flex-row items-center justify-between">
        <ChartLegend
          items={[
            { label: 'Goal met', color: theme.colors.primary },
            { label: 'Below goal', color: theme.colors.primaryMuted },
          ]}
        />
        <AppText variant="caption" muted>
          Goal {goal.toLocaleString('en-IN')}
        </AppText>
      </View>
    </Card>
  );
}

// ---------- HealthTrendGraph ----------
type HealthMetric = 'wellness' | 'weight' | 'sleep';

export function HealthTrendGraph({ history }: { history: TwinHistoryPoint[] }) {
  const [range, setRange] = useState<7 | 14 | 30>(30);
  const [metric, setMetric] = useState<HealthMetric>('wellness');
  const slice = useMemo(() => history.slice(-range), [history, range]);

  const series: SeriesPoint[] = slice.map((p, i) => ({
    label: new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    value:
      metric === 'wellness' ? p.wellness : metric === 'weight' ? p.weightKg : Number((p.sleepMinutes / 60).toFixed(1)),
  }));
  const last = series[series.length - 1]?.value ?? 0;
  const cfg = {
    wellness: { title: 'Wellness score', unit: 'of 100', color: '#16a34a', goodWhenUp: true, value: `${last}` },
    weight: { title: 'Weight', unit: 'kg', color: '#2563eb', goodWhenUp: false, value: last.toFixed(1) },
    sleep: { title: 'Sleep', unit: 'hours', color: '#7c3aed', goodWhenUp: true, value: last.toFixed(1) },
  }[metric];
  const confidence = slice[slice.length - 1]?.confidence ?? 0;

  return (
    <View style={{ gap: 10 }}>
      <View className="flex-row items-center justify-between">
        <RangeSelector
          options={[
            { label: 'Wellness', value: 'wellness' as const },
            { label: 'Weight', value: 'weight' as const },
            { label: 'Sleep', value: 'sleep' as const },
          ]}
          value={metric}
          onChange={setMetric}
        />
        <RangeSelector
          options={[
            { label: '7D', value: 7 as const },
            { label: '30D', value: 30 as const },
          ]}
          value={range === 14 ? 30 : range}
          onChange={setRange}
        />
      </View>
      <TrendCard
        title={cfg.title}
        value={cfg.value}
        unit={cfg.unit}
        series={series}
        color={cfg.color}
        goodWhenUp={cfg.goodWhenUp}
        summaryNoun={cfg.title}
        right={
          <AppText variant="caption" muted>
            Model confidence {Math.round(confidence * 100)}%
          </AppText>
        }
      />
    </View>
  );
}

// ---------- Donut ----------
const CATEGORY_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];

export function DonutChart({
  slices,
  size = 120,
  stroke = 16,
  centerLabel,
  centerValue,
}: {
  slices: { key: string; label: string; value: number }[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const { theme } = useTheme();
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.colors.surfaceAlt} strokeWidth={stroke} fill="none" />
        {slices.map((s, i) => {
          const len = (s.value / total) * c;
          const gap = slices.length > 1 ? 3 : 0;
          const el = (
            <Circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += len;
          return el;
        })}
      </Svg>
      {centerValue && <AppText variant="h3">{centerValue}</AppText>}
      {centerLabel && (
        <AppText variant="caption" muted>
          {centerLabel}
        </AppText>
      )}
    </View>
  );
}

// ---------- SpendingAnalytics ----------
export function SpendingAnalytics({
  monthly,
  categories,
}: {
  monthly: { label: string; amount: number }[];
  categories: SpendingCategory[];
}) {
  const { theme } = useTheme();
  const total = categories.reduce((s, c) => s + c.amount, 0);
  const series: SeriesPoint[] = monthly.map((m) => ({ label: m.label, value: m.amount }));
  const delta = percentDelta(monthly.map((m) => m.amount));
  return (
    <Card style={{ gap: 16 }}>
      <View className="flex-row items-start justify-between">
        <View>
          <AppText variant="label" muted>
            This month
          </AppText>
          <AppText variant="h1">INR {total.toLocaleString('en-IN')}</AppText>
        </View>
        <DeltaChip pct={delta} goodWhenUp={false} />
      </View>
      <LineChart
        data={series}
        height={120}
        color={theme.colors.primary}
        xLabelEvery={1}
        yTicks={3}
        summary={`Monthly spending from ${monthly[0]?.label} to ${monthly[monthly.length - 1]?.label}`}
      />
      <View className="flex-row items-center" style={{ gap: 16 }}>
        <DonutChart
          slices={categories.map((c) => ({ key: c.key, label: c.label, value: c.amount }))}
          centerValue={formatCompact(total)}
          centerLabel="INR"
        />
        <View className="flex-1" style={{ gap: 8 }}>
          {categories.map((c, i) => (
            <View key={c.key} className="flex-row items-center justify-between" style={{ gap: 8 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                  }}
                />
                <AppText variant="caption">{c.label}</AppText>
              </View>
              <AppText variant="caption" muted>
                {Math.round((c.amount / (total || 1)) * 100)}%
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

// ---------- SubscriptionAnalytics ----------
export function SubscriptionAnalytics({ subscriptions }: { subscriptions: SubscriptionSummary[] }) {
  const active = subscriptions.filter((s) => s.status === 'active');
  const monthly = active.reduce((s, x) => s + x.amount, 0);
  const savings = Math.round(monthly * 0.1);
  return (
    <View className="flex-row" style={{ gap: 12 }}>
      <MetricCard
        icon="repeat"
        label="Active subscriptions"
        value={`${active.length}`}
        unit={`of ${subscriptions.length}`}
        tone="primary"
      />
      <MetricCard
        icon="wallet"
        label={`Monthly, saving INR ${savings.toLocaleString('en-IN')}`}
        value={`INR ${monthly.toLocaleString('en-IN')}`}
        tone="success"
      />
    </View>
  );
}
