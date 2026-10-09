import React, { createContext, useContext, useMemo, useState } from 'react';

/**
 * Feature flag framework. Defaults are compiled in; a remote provider (LaunchDarkly,
 * Firebase Remote Config) can call `setOverrides` after fetch without touching call sites.
 */
export const DEFAULT_FLAGS = {
  passportScanner: true,
  verificationRequests: true,
  twinHistory: true,
  agentAutoApprove: false,
  dashboardCustomization: true,
  notificationCenter: true,
  spendingAnalytics: true,
  dnaVerification: true,
  vetVerification: true,
  microchipVerification: true,
} as const;

export type FlagKey = keyof typeof DEFAULT_FLAGS;
type Flags = Record<FlagKey, boolean>;

interface Ctx {
  flags: Flags;
  setOverrides: (o: Partial<Flags>) => void;
}

const FlagContext = createContext<Ctx>({ flags: { ...DEFAULT_FLAGS }, setOverrides: () => undefined });

export function FeatureFlagProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Partial<Flags>;
}) {
  const [flags, setFlags] = useState<Flags>({ ...DEFAULT_FLAGS, ...initial });
  const value = useMemo<Ctx>(
    () => ({ flags, setOverrides: (o) => setFlags((f) => ({ ...f, ...o })) }),
    [flags]
  );
  return <FlagContext.Provider value={value}>{children}</FlagContext.Provider>;
}

export const useFeatureFlag = (key: FlagKey) => useContext(FlagContext).flags[key];
export const useFeatureFlags = () => useContext(FlagContext);
