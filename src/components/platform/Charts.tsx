import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { AppText } from '@components/ui';
import { useTheme } from '@theme/ThemeProvider';

export function ScoreRing({
  value,
  size = 112,
  stroke = 10,
  color = '#2563eb',
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const { theme } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.colors.surfaceAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <AppText variant="h1">{Math.round(value)}</AppText>
      {label && (
        <AppText variant="caption" muted>
          {label}
        </AppText>
      )}
    </View>
  );
}

export function Sparkline({
  data,
  width = 140,
  height = 44,
  color = '#2563eb',
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 3;
  const pts = data.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / (data.length - 1);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last[0]} cy={last[1]} r={3} fill={color} />
    </Svg>
  );
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function BarChart({
  data,
  height = 90,
  color = '#2563eb',
  target,
}: {
  data: number[];
  height?: number;
  color?: string;
  target?: number;
}) {
  const { theme } = useTheme();
  const max = Math.max(...data, target ?? 0) || 1;
  const barArea = height - 18;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ height: barArea, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        {data.map((v, i) => (
          <View key={i} style={{ flex: 1, height: barArea, justifyContent: 'flex-end' }}>
            <View
              style={{
                height: Math.max(4, (v / max) * barArea),
                borderRadius: 6,
                backgroundColor: i === data.length - 1 ? color : theme.colors.primaryMuted,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {DAYS.slice(0, data.length).map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <AppText variant="caption" muted>
              {d}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

export function DividerLine() {
  const { theme } = useTheme();
  return (
    <Svg width="100%" height={1}>
      <Rect width="100%" height={1} fill={theme.colors.border} />
    </Svg>
  );
}
