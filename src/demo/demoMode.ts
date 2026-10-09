/**
 * Demo mode switch. When enabled the whole app reads from `demo-data.json`
 * and never calls a backend. Set `EXPO_PUBLIC_DEMO_MODE=false` to disable.
 */
export const DEMO_MODE: boolean = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';
