import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { AgentAction, AgentRole } from '@apptypes/platform';
import { AppText, Badge, Button, Card, Icon, IconBadge } from '@components/ui';
import type { IconName } from '@components/ui';
import { useTheme } from '@theme/ThemeProvider';

const roleIcon: Record<AgentRole, IconName> = {
  triage: 'stethoscope',
  nutrition: 'utensils',
  commerce: 'cart',
  scheduling: 'calendar',
  claims: 'shield',
  emergency: 'siren',
};

const roleLabel: Record<AgentRole, string> = {
  triage: 'Triage agent',
  nutrition: 'Nutrition agent',
  commerce: 'Commerce agent',
  scheduling: 'Scheduling agent',
  claims: 'Claims agent',
  emergency: 'Emergency agent',
};

const classLabel: Record<AgentAction['actionClass'], string> = {
  read: 'Read only',
  reversible_write: 'Reversible change',
  financial_or_medical: 'Needs your approval',
  irreversible: 'Irreversible',
};

function useCountdown(deadline?: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);
  if (!deadline) return 0;
  return Math.max(0, Math.floor((new Date(deadline).getTime() - now) / 1000));
}

function fmt(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s.toString().padStart(2, '0')}s`;
}

interface Props {
  action: AgentAction;
  onApprove?: () => void;
  onReject?: () => void;
  onUndo?: () => void;
  compact?: boolean;
}

/** Explains an agent action: why, with which evidence, at what cost, and how to reverse it. */
export function AgentActionCard({ action, onApprove, onReject, onUndo, compact }: Props) {
  const { theme } = useTheme();
  const remaining = useCountdown(action.status === 'completed' ? action.undoDeadline : undefined);
  const canUndo = action.status === 'completed' && remaining > 0;
  const confPct = Math.round(action.confidence * 100);
  const stamp = new Date(action.executedAt ?? action.createdAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card style={{ gap: 12 }} accessible={false}>
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <IconBadge name={roleIcon[action.agent]} tone="primary" />
        <View className="flex-1">
          <AppText variant="caption" muted>
            {roleLabel[action.agent]} · {stamp}
          </AppText>
          <AppText variant="label">{action.title}</AppText>
        </View>
      </View>

      {!compact && (
        <>
          <AppText variant="caption" muted style={{ fontSize: 13, lineHeight: 19 }}>
            {action.rationale}
          </AppText>
          <View
            style={{ gap: 6 }}
            accessible
            accessibilityLabel={`Source: ${action.source}. Confidence ${confPct} percent.`}
          >
            <View className="flex-row items-center justify-between">
              <AppText variant="caption" muted className="font-semibold uppercase">
                Source
              </AppText>
              <AppText variant="caption" muted>
                Confidence {confPct}%
              </AppText>
            </View>
            <AppText variant="caption">{action.source}</AppText>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: theme.colors.surfaceAlt }}>
              <View
                style={{
                  width: `${confPct}%`,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: confPct >= 85 ? '#15803d' : confPct >= 70 ? theme.colors.primary : '#b45309',
                }}
              />
            </View>
          </View>
          <View style={{ gap: 4 }}>
            <AppText variant="caption" muted className="font-semibold uppercase">
              Evidence
            </AppText>
            {action.citations.map((c) => (
              <View key={c} className="flex-row items-center" style={{ gap: 6 }}>
                <Icon name="file" size={12} color={theme.colors.textMuted} />
                <AppText variant="caption" muted>
                  {c}
                </AppText>
              </View>
            ))}
          </View>
        </>
      )}

      <View className="flex-row flex-wrap items-center" style={{ gap: 8 }}>
        <Badge
          label={classLabel[action.actionClass]}
          tone={action.actionClass === 'reversible_write' ? 'neutral' : 'warning'}
          icon={<Icon name="lock" size={12} color={theme.colors.textMuted} />}
        />
        {action.cost && (
          <Badge label={`INR ${action.cost.amount.toLocaleString('en-IN')}`} tone="primary" />
        )}
        {action.undoWindowSec > 0 && action.status === 'proposed' && (
          <Badge label={`Undo for ${fmt(action.undoWindowSec)}`} tone="neutral" />
        )}
      </View>
      {action.cost?.note && !compact && (
        <AppText variant="caption" muted>
          {action.cost.note}
        </AppText>
      )}

      {action.status === 'proposed' && (
        <View className="flex-row" style={{ gap: 8 }}>
          <View className="flex-1">
            <Button label="Reject" variant="secondary" size="sm" onPress={onReject} accessibilityLabel={`Reject: ${action.title}`} />
          </View>
          <View className="flex-1">
            <Button label="Approve" size="sm" onPress={onApprove} accessibilityLabel={`Approve: ${action.title}`} />
          </View>
        </View>
      )}
      {action.status === 'executing' && (
        <Badge label="Executing" tone="primary" icon={<Icon name="clock" size={12} color="#1865f5" />} />
      )}
      {action.status === 'completed' && (
        <View className="flex-row items-center justify-between">
          <Badge label="Completed" tone="success" icon={<Icon name="check-circle" size={12} color="#16a34a" />} />
          {canUndo && (
            <Button
              label={`Undo (${fmt(remaining)})`}
              variant="ghost"
              size="sm"
              leftIcon={<Icon name="undo" size={14} color={theme.colors.primary} />}
              onPress={onUndo}
            />
          )}
        </View>
      )}
      {action.status === 'rejected' && <Badge label="Rejected" tone="neutral" />}
      {action.status === 'undone' && <Badge label="Reversed" tone="neutral" />}
      {action.status === 'failed' && <Badge label="Failed" tone="danger" />}
    </Card>
  );
}
