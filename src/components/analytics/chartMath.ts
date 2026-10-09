export interface Pt {
  x: number;
  y: number;
}

export function extent(values: number[], pad = 0.08): [number, number] {
  if (values.length === 0) return [0, 1];
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  return [min - span * pad, max + span * pad];
}

export function scalePoints(
  values: number[],
  width: number,
  height: number,
  domain: [number, number],
  inset: { left: number; right: number; top: number; bottom: number },
): Pt[] {
  const innerW = Math.max(1, width - inset.left - inset.right);
  const innerH = Math.max(1, height - inset.top - inset.bottom);
  const [min, max] = domain;
  const span = max - min || 1;
  return values.map((v, i) => ({
    x: inset.left + (values.length === 1 ? innerW / 2 : (i * innerW) / (values.length - 1)),
    y: inset.top + (1 - (v - min) / span) * innerH,
  }));
}

/** Catmull-Rom to cubic Bezier, clamped so the curve never overshoots the data range. */
export function smoothPath(pts: Pt[], tension = 0.18): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const clampY = (y: number) => Math.min(maxY, Math.max(minY, y));
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) * tension;
    const c1y = clampY(p1.y + (p2.y - p0.y) * tension);
    const c2x = p2.x - (p3.x - p1.x) * tension;
    const c2y = clampY(p2.y - (p3.y - p1.y) * tension);
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function areaPath(line: string, pts: Pt[], baseline: number): string {
  if (pts.length < 2) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${line} L${last.x.toFixed(1)} ${baseline} L${first.x.toFixed(1)} ${baseline} Z`;
}

export function percentDelta(series: number[]): number {
  if (series.length < 2 || series[0] === 0) return 0;
  return ((series[series.length - 1] - series[0]) / Math.abs(series[0])) * 100;
}

export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}
