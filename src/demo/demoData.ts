import raw from './demo-data.json';
import type { DemoData } from './demoTypes';

/** Typed view over the bundled demo dataset. */
export const demoData = raw as unknown as DemoData;

const IST_OFFSET_MIN = 330;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const shifted = (iso: string) => new Date(new Date(iso).getTime() + IST_OFFSET_MIN * 60000);
const dayKey = (d: Date) => Math.floor(d.getTime() / 86400000);

/** "Today, 5:30 PM", "Tomorrow, 11:00 AM" or "Oct 15, 6:30 PM" in the demo timezone (IST). */
export function formatWhen(iso: string): string {
  const d = shifted(iso);
  const diff = dayKey(d) - dayKey(shifted(demoData.meta.now));
  const h = d.getUTCHours();
  const time = `${h % 12 === 0 ? 12 : h % 12}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  const date = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return `${date}, ${time}`;
}

/** "Oct 12" in the demo timezone. */
export function formatDay(iso: string): string {
  const d = shifted(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "Oct 12, 2026" in the demo timezone. */
export function formatFullDate(iso: string): string {
  const d = shifted(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** Demo "now" so relative labels stay consistent with the dataset. */
export const demoNow = (): Date => new Date(demoData.meta.now);
