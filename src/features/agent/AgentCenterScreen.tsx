import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import type { AgentAction, AuditEntry } from '@apptypes/platform';
import { AppText, Badge, Card, EmptyState, IconBadge } from '@components/ui';
import type { IconName } from '@components/ui';
import { AgentActionCard, ScreenHeader } from '@components/platform';
import { RangeSelector } from '@components/analytics';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { approveAction, rejectAction, undoAction } from './agentThunks';
import { selectAgentActions, selectAgentAudit, selectPendingActions } from './agentSelectors';

type Tab = 'queue' | 'timeline' | 'history' | 'audit';

const EVENT_ICON: Record<AuditEntry['event'], IconName> = {
  proposed: 'sparkles',
  approved: 'check',
  rejected: 'x-circle',
  executed: 'check-circle',
  failed: 'alert',
  undone: 'undo',
};

const EVENT_LABEL: Record<AuditEntry['event'], string> = {
  proposed: 'Proposed',
  approved: 'Approved',
  rejected: 'Rejected',
  executed: 'Executed',
  failed: 'Failed',
  undone: 'Undone',
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function AgentCenterScreen() {
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const dispatch = useAppDispatch();
  const pending = useAppSelector(selectPendingActions);
  const all = useAppSelector(selectAgentActions);
  const audit = useAppSelector(selectAgentAudit);
  const [tab, setTab] = useState<Tab>('queue');

  const byId = useMemo(() => new Map(all.map((a) => [a.id, a])), [all]);
  const completed = all.filter((a) => a.status === 'completed');
  const rejected = all.filter((a) => a.status === 'rejected');
  const reversed = all.filter((a) => a.status === 'undone' || a.status === 'failed');
  const undoable = completed.filter((a) => a.undoDeadline && new Date(a.undoDeadline).getTime() > Date.now());
  const suggestions = [...all]
    .filter((a) => a.status === 'proposed')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const act = (a: AgentAction) => ({
    onApprove: () => dispatch(approveAction(a.id)),
    onReject: () => dispatch(rejectAction(a.id)),
    onUndo: () => dispatch(undoAction(a.id)),
  });

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader
        title="Agent Center"
        subtitle={`${pending.length} awaiting your approval`}
        onBack={() => nav.goBack()}
      />
      <View className="px-4 pb-2">
        <RangeSelector
          options={[
            { label: 'Queue', value: 'queue' as const },
            { label: 'Timeline', value: 'timeline' as const },
            { label: 'History', value: 'history' as const },
            { label: 'Audit', value: 'audit' as const },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}>
        {tab === 'queue' && (
          <>
            <AppText variant="h3" accessibilityRole="header">
              Needs approval
            </AppText>
            {pending.length === 0 && (
              <Card>
                <EmptyState title="Nothing to review" description="Agents will propose actions here when needed." />
              </Card>
            )}
            {pending.map((a) => (
              <AgentActionCard key={a.id} action={a} {...act(a)} />
            ))}

            {undoable.length > 0 && (
              <>
                <AppText variant="h3" accessibilityRole="header">
                  Can still be undone
                </AppText>
                {undoable.map((a) => (
                  <AgentActionCard key={a.id} action={a} compact {...act(a)} />
                ))}
              </>
            )}
          </>
        )}

        {tab === 'timeline' && (
          <>
            <AppText variant="h3" accessibilityRole="header">
              Suggested actions
            </AppText>
            {suggestions.length === 0 && <AppText muted>No open suggestions.</AppText>}
            <Card style={{ gap: 14 }}>
              {suggestions.map((a, i) => (
                <TimelineRow
                  key={a.id}
                  icon="sparkles"
                  title={a.title}
                  meta={`${fmtTime(a.createdAt)} \u00b7 ${Math.round(a.confidence * 100)}% confidence`}
                  detail={a.source}
                  last={i === suggestions.length - 1}
                />
              ))}
            </Card>

            <AppText variant="h3" accessibilityRole="header">
              Undo window
            </AppText>
            {undoable.length === 0 && <AppText muted>No actions can be undone right now.</AppText>}
            <Card style={{ gap: 14 }}>
              {undoable.map((a, i) => (
                <TimelineRow
                  key={a.id}
                  icon="undo"
                  title={a.title}
                  meta={`Undo until ${fmtTime(a.undoDeadline as string)}`}
                  last={i === undoable.length - 1}
                />
              ))}
            </Card>
          </>
        )}

        {tab === 'history' && (
          <>
            <View className="flex-row" style={{ gap: 8 }}>
              <Badge label={`${completed.length} completed`} tone="success" />
              <Badge label={`${rejected.length} rejected`} tone="neutral" />
              <Badge label={`${reversed.length} reversed`} tone="neutral" />
            </View>
            {all.filter((a) => a.status !== 'proposed').length === 0 && (
              <Card>
                <EmptyState title="No history yet" description="Completed and rejected actions will appear here." />
              </Card>
            )}
            {[...completed, ...rejected, ...reversed].map((a) => (
              <AgentActionCard key={a.id} action={a} compact {...act(a)} />
            ))}
          </>
        )}

        {tab === 'audit' && (
          <>
            <AppText variant="caption" muted>
              Every proposal, approval and execution is recorded. Entries cannot be edited.
            </AppText>
            <Card style={{ gap: 14 }}>
              {audit.length === 0 && <AppText muted>No audit entries.</AppText>}
              {audit.slice(0, 40).map((e, i) => (
                <TimelineRow
                  key={e.id}
                  icon={EVENT_ICON[e.event]}
                  title={`${EVENT_LABEL[e.event]} by ${e.actor}`}
                  meta={fmtTime(e.at)}
                  detail={byId.get(e.actionId)?.title ?? e.actionId}
                  last={i === Math.min(audit.length, 40) - 1}
                />
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function TimelineRow({
  icon,
  title,
  meta,
  detail,
  last,
}: {
  icon: IconName;
  title: string;
  meta: string;
  detail?: string;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row"
      style={{ gap: 12 }}
      accessible
      accessibilityLabel={`${title}. ${meta}${detail ? `. ${detail}` : ''}`}
    >
      <View style={{ alignItems: 'center' }}>
        <IconBadge name={icon} tone="neutral" size={28} />
        {!last && <View style={{ flex: 1, width: 1, marginTop: 4, backgroundColor: 'rgba(107,115,144,0.3)' }} />}
      </View>
      <View className="flex-1" style={{ paddingBottom: last ? 0 : 6 }}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" muted>
          {meta}
        </AppText>
        {detail && (
          <AppText variant="caption" muted numberOfLines={2}>
            {detail}
          </AppText>
        )}
      </View>
    </View>
  );
}
