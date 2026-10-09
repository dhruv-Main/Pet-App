import React, { useId, useMemo, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { AppText } from '@components/ui';
import { useTheme } from '@theme/ThemeProvider';
import { areaPath, extent, formatCompact, scalePoints, smoothPath } from './chartMath';

export interface SeriesPoint {
  value: number;
  /** Axis label for this point; only shown at `xLabelEvery` intervals. */
  label?: string;
}

interface LineChartProps {
  data: SeriesPoint[];
  height?: number;
  color?: string;
  area?: boolean;
  /** Dashed horizontal reference line (e.g. a goal). */
  target?: number;
  domain?: [number, number];
  yTicks?: number;
  xLabelEvery?: number;
  format?: (n: number) => string;
  /** Spoken summary for screen readers. */
  summary: string;
}

/** Responsive SVG line/area chart with grid, axis labels, goal line and end marker. */
export function LineChart({
  data,
  height = 160,
  color = '#2563eb',
  area = true,
  target,
  domain,
  yTicks = 3,
  xLabelEvery = 7,
  format = formatCompact,
  summary,
}: LineChartProps) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const gradId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  const inset = { left: 34, right: 8, top: 8, bottom: 20 };

  const geometry = useMemo(() => {
    const values = data.map((d) => d.value);
    const dom = domain ?? extent(target !== undefined ? [...values, target] : values);
    const pts = scalePoints(values, width, height, dom, inset);
    const line = smoothPath(pts);
    return { dom, pts, line };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, height, domain, target]);

  const { dom, pts, line } = geometry;
  const baseline = height - inset.bottom;
  const ticks = Array.from({ length: yTicks }, (_, i) => dom[0] + ((dom[1] - dom[0]) * i) / (yTicks - 1));
  const yOf = (v: number) =>
    inset.top + (1 - (v - dom[0]) / (dom[1] - dom[0] || 1)) * (height - inset.top - inset.bottom);
  const last = pts[pts.length - 1];

  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={summary}
      style={{ height, width: '100%' }}
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.28} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {ticks.map((t, i) => (
            <React.Fragment key={i}>
              <Line
                x1={inset.left}
                x2={width - inset.right}
                y1={yOf(t)}
                y2={yOf(t)}
                stroke={theme.colors.border}
                strokeWidth={1}
              />
              <SvgText x={inset.left - 6} y={yOf(t) + 3} fontSize={10} fill={theme.colors.textMuted} textAnchor="end">
                {format(t)}
              </SvgText>
            </React.Fragment>
          ))}
          {target !== undefined && (
            <Line
              x1={inset.left}
              x2={width - inset.right}
              y1={yOf(target)}
              y2={yOf(target)}
              stroke={theme.colors.textMuted}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}
          {area && pts.length > 1 && <Path d={areaPath(line, pts, baseline)} fill={`url(#${gradId})`} />}
          <Path d={line} stroke={color} strokeWidth={2.25} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) =>
            d.label && i % xLabelEvery === 0 ? (
              <SvgText
                key={i}
                x={pts[i].x}
                y={height - 5}
                fontSize={10}
                fill={theme.colors.textMuted}
                textAnchor={i === 0 ? 'start' : 'middle'}
              >
                {d.label}
              </SvgText>
            ) : null,
          )}
          {last && (
            <>
              <Circle cx={last.x} cy={last.y} r={6} fill={color} opacity={0.18} />
              <Circle cx={last.x} cy={last.y} r={3.5} fill={color} />
            </>
          )}
        </Svg>
      )}
    </View>
  );
}

export function AreaChart(props: Omit<LineChartProps, 'area'>) {
  return <LineChart {...props} area />;
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 12 }}>
      {items.map((i) => (
        <View key={i.label} className="flex-row items-center" style={{ gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i.color }} />
          <AppText variant="caption" muted>
            {i.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}
