import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Badge, Button, Icon, IconBadge, Input, Skeleton } from '@components/ui';
import { ErrorState } from '@components/ui';
import { PressableScale } from '@components/premium';
import { useNetworkState } from '@/demo/NetworkSimulator';
import { useIsMember, useSimulated } from '@services/data';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { useRequireAuth } from '@features/auth/useRequireAuth';
import { Panel, SectionTitle, SuccessBurst, Timeline } from '@features/shared/CommerceKit';
import type { HomeStackParamList } from '@navigation/types';
import { activityAdded, activityCancelled, savedToggled } from './hubSlice';
import type { ActivityRecord } from './hubSlice';
import { hubFeatures, hubGroups, hubListings, listingEntry, refCode } from './hubData';
import type { HubEntry } from './hubData';
import { useHubNav } from './hubNav';
import { useRoster, shortDate } from './hubHooks';
import { Banner, Chips, ChoiceGroup, Empty, HubImage, Page, Row, Stat } from './HubKit';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

/* ------------------------------------------------------------------ Hub home */

export function HubScreen() {
  const { openFeature, openActivity } = useHubNav();
  const { width } = useWindowDimensions();
  const member = useIsMember();
  const activity = useAppSelector((s) => s.hub.activity);
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const cols = width >= 820 ? 4 : width >= 560 ? 3 : 2;
  const gap = 12;
  const cardW = Math.floor((Math.min(width, 920) - 40 - gap * (cols - 1)) / cols);

  const groups = useMemo(
    () =>
      hubGroups
        .map((g) => ({
          ...g,
          items: hubFeatures.filter((f) => f.group === g.id && (!query || `${f.title} ${f.tagline}`.toLowerCase().includes(query))),
        }))
        .filter((g) => g.items.length > 0),
    [query],
  );

  return (
    <Page title="Pet commerce hub" subtitle="Everything for your pet, in one place">
      <Banner img="dashboard" icon="sparkles" eyebrow="Pet OS" title="All services, one app" body="Shop, book, track and care from a single hub." />
      <View
        className="flex-row items-center bg-neutral-100 dark:bg-neutral-800"
        style={{ height: 52, borderRadius: 26, paddingHorizontal: 16, gap: 10 }}
      >
        <Icon name="search" size={18} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search all 65 features"
          placeholderTextColor="#9ca3af"
          accessibilityLabel="Search hub features"
          style={{ flex: 1, fontSize: 15, color: '#111827', outlineStyle: 'none' } as object}
        />
        {q ? (
          <Pressable onPress={() => setQ('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10}>
            <Icon name="x-circle" size={18} />
          </Pressable>
        ) : null}
      </View>

      {member ? (
        <Panel style={{ gap: 4 }}>
          <Row
            icon="history"
            title="My activity"
            body={activity.length ? `${activity.length} item${activity.length === 1 ? '' : 's'} so far` : 'Enquiries, bookings and requests will appear here'}
            onPress={openActivity}
            right={<Icon name="chevron" size={18} />}
          />
        </Panel>
      ) : null}

      {groups.length === 0 ? <Empty title="No matching features" body="Try a different word, such as food, vet or tracker." action="Clear search" onAction={() => setQ('')} /> : null}

      {groups.map((g) => (
        <View key={g.id} style={{ gap: 12 }}>
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <IconBadge name={g.icon} tone="primary" />
            <View style={{ flex: 1 }}>
              <AppText variant="h3" accessibilityRole="header">
                {g.title}
              </AppText>
              <AppText variant="caption" muted>
                {g.blurb}
              </AppText>
            </View>
          </View>
          <View className="flex-row flex-wrap" style={{ gap }}>
            {g.items.map((f) => (
              <PressableScale key={f.key} onPress={() => openFeature(f)} accessibilityRole="button" accessibilityLabel={`${f.title}. ${f.tagline}`} style={{ width: cardW }}>
                <View className="bg-white dark:bg-surface-dark-2" style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(107,115,144,0.14)' }}>
                  <HubImage id={f.img} alt={f.title} height={Math.round(cardW * 0.62)} radius={0} />
                  <View style={{ padding: 12, gap: 6, minHeight: 112 }}>
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Icon name={f.icon} size={15} color="#1865f5" />
                      <AppText variant="caption" muted>
                        {f.n}
                      </AppText>
                    </View>
                    <AppText variant="label" numberOfLines={2}>
                      {f.title}
                    </AppText>
                    <AppText variant="caption" muted numberOfLines={2}>
                      {f.tagline}
                    </AppText>
                  </View>
                </View>
              </PressableScale>
            ))}
          </View>
        </View>
      ))}
    </Page>
  );
}

/* ------------------------------------------------------------------ Listing */

function useStatusFor(listing: string, id: string): ActivityRecord | undefined {
  const activity = useAppSelector((s) => s.hub.activity);
  return activity.find((a) => a.listing === listing && a.entryId === id && !a.cancelled);
}

function EntryCard({ listing, entry, onPress }: { listing: string; entry: HubEntry; onPress: () => void }) {
  const status = useStatusFor(listing, entry.id);
  const saved = useAppSelector((s) => s.hub.saved.includes(`${listing}:${entry.id}`));
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={`${entry.title}. ${entry.subtitle}`}>
      <Panel style={{ padding: 10 }}>
        <View className="flex-row" style={{ gap: 12 }}>
          <View style={{ width: 104 }}>
            <HubImage id={entry.img} alt={entry.title} height={104} radius={18} />
          </View>
          <View style={{ flex: 1, gap: 4, justifyContent: 'center' }}>
            <View className="flex-row items-center" style={{ gap: 6, flexWrap: 'wrap' }}>
              {status ? <Badge label={status.status} tone="success" /> : entry.badge ? <Badge label={entry.badge} tone="primary" /> : null}
              {entry.verified ? <Badge label="Verified" tone="success" /> : null}
              {saved ? <Icon name="bookmark" size={14} color="#1865f5" /> : null}
            </View>
            <AppText variant="label" numberOfLines={2}>
              {entry.title}
            </AppText>
            <AppText variant="caption" muted numberOfLines={2}>
              {entry.subtitle}
            </AppText>
            {entry.rating ? (
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Icon name="star" size={13} color="#f59e0b" />
                <AppText variant="caption">
                  {entry.rating.toFixed(1)}
                  {entry.reviews ? ` (${entry.reviews})` : ''}
                </AppText>
              </View>
            ) : entry.price ? (
              <AppText variant="caption" style={{ fontWeight: '700' }}>
                {entry.price}
              </AppText>
            ) : null}
          </View>
        </View>
      </Panel>
    </PressableScale>
  );
}

export function HubListScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<HomeStackParamList, 'HubList'>>();
  const listing = hubListings[params.listing];
  const { epoch } = useNetworkState();
  const res = useSimulated(`hub:${params.listing}:${epoch}`, () => listing?.entries ?? [], [] as HubEntry[]);
  const saved = useAppSelector((s) => s.hub.saved);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const [onlySaved, setOnlySaved] = useState(false);

  if (!listing) return <Page title="Not found"><Empty title="This list is unavailable" body="Go back and choose another feature." /></Page>;

  const query = q.trim().toLowerCase();
  const items = res.data.filter(
    (e) =>
      (!filter || e.tags.includes(filter)) &&
      (!onlySaved || saved.includes(`${listing.key}:${e.id}`)) &&
      (!query || `${e.title} ${e.subtitle} ${e.tags.join(' ')} ${e.meta.map((m) => m[1]).join(' ')}`.toLowerCase().includes(query)),
  );

  return (
    <Page title={listing.title} subtitle={listing.eyebrow}>
      <Banner img={listing.hero} icon={listing.icon} eyebrow={listing.eyebrow} title={listing.title} body={listing.blurb} />
      <Input label="Search" value={q} onChangeText={setQ} placeholder={listing.searchPlaceholder} leftIcon={<Icon name="search" size={18} />} accessibilityLabel={listing.searchPlaceholder} />
      <Chips options={listing.filters} value={filter} onChange={setFilter} all="All" />
      <View className="flex-row items-center justify-between">
        <AppText variant="caption" muted>
          {res.isLoading ? 'Loading' : `${items.length} ${items.length === 1 ? 'result' : 'results'}`}
        </AppText>
        <Pressable onPress={() => setOnlySaved((v) => !v)} accessibilityRole="button" accessibilityState={{ selected: onlySaved }} className="min-h-[44px] flex-row items-center" style={{ gap: 6 }}>
          <Icon name="bookmark" size={16} color={onlySaved ? '#1865f5' : undefined} />
          <AppText variant="label">{onlySaved ? 'Showing saved' : 'Saved only'}</AppText>
        </Pressable>
      </View>

      {res.isLoading ? (
        <View style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={124} radius={24} />
          ))}
        </View>
      ) : res.isError ? (
        <ErrorState onRetry={res.refetch} message="We could not load this list. Check your connection." />
      ) : items.length === 0 ? (
        <Empty
          title={onlySaved ? 'Nothing saved yet' : 'No matches'}
          body={onlySaved ? 'Tap the bookmark on any listing to keep it here.' : 'Try a different search or filter.'}
          action="Reset"
          onAction={() => {
            setQ('');
            setFilter(null);
            setOnlySaved(false);
          }}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {items.map((e) => (
            <EntryCard key={e.id} listing={listing.key} entry={e} onPress={() => nav.navigate('HubEntry', { listing: listing.key, entryId: e.id })} />
          ))}
        </View>
      )}
    </Page>
  );
}

/* ------------------------------------------------------------------ Entry detail */

export function HubEntryScreen() {
  const nav = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { params } = useRoute<RouteProp<HomeStackParamList, 'HubEntry'>>();
  const listing = hubListings[params.listing];
  const entry = listingEntry(params.listing, params.entryId);
  const status = useStatusFor(params.listing, params.entryId);
  const saved = useAppSelector((s) => s.hub.saved.includes(`${params.listing}:${params.entryId}`));

  if (!listing || !entry) return <Page title="Not found"><Empty title="This item is unavailable" body="It may have been removed." /></Page>;
  const related = listing.entries.filter((e) => e.id !== entry.id).slice(0, 3);

  return (
    <Page
      title={entry.title}
      subtitle={listing.title}
      right={
        <Pressable
          onPress={() => dispatch(savedToggled(`${listing.key}:${entry.id}`))}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved' : 'Save for later'}
          accessibilityState={{ selected: saved }}
          className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10"
        >
          <Icon name="bookmark" size={20} color={saved ? '#1865f5' : undefined} />
        </Pressable>
      }
      footer={
        status ? (
          <View className="flex-row" style={{ gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button label={`${status.status}. View activity`} variant="secondary" fullWidth onPress={() => nav.navigate('HubActivity')} />
            </View>
          </View>
        ) : (
          <Button label={listing.action.label} size="lg" fullWidth onPress={() => nav.navigate('HubAction', { listing: listing.key, entryId: entry.id })} />
        )
      }
    >
      <HubImage id={entry.img} alt={entry.title} height={260} radius={28} />
      <View style={{ gap: 6 }}>
        <View className="flex-row items-center" style={{ gap: 6, flexWrap: 'wrap' }}>
          {status ? <Badge label={status.status} tone="success" /> : null}
          {entry.badge ? <Badge label={entry.badge} tone="primary" /> : null}
          {entry.verified ? <Badge label="Verified" tone="success" /> : null}
        </View>
        <AppText variant="h1">{entry.title}</AppText>
        <AppText muted>{entry.subtitle}</AppText>
        {entry.rating ? (
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <Icon name="star" size={15} color="#f59e0b" />
            <AppText variant="label">
              {entry.rating.toFixed(1)} {entry.reviews ? `from ${entry.reviews} reviews` : ''}
            </AppText>
          </View>
        ) : null}
        {entry.price ? <AppText variant="h3">{entry.price}</AppText> : null}
      </View>
      <View className="flex-row flex-wrap" style={{ gap: 10 }}>
        {entry.meta.map(([k, v]) => (
          <Stat key={k} label={k} value={v} />
        ))}
      </View>
      <Panel style={{ gap: 8 }}>
        <SectionTitle title="About" />
        <AppText>{entry.about}</AppText>
      </Panel>
      <Panel style={{ gap: 10 }}>
        <SectionTitle title="Highlights" />
        {entry.highlights.map((h) => (
          <View key={h} className="flex-row items-center" style={{ gap: 10 }}>
            <Icon name="check-circle" size={18} color="#16a34a" />
            <AppText style={{ flex: 1 }}>{h}</AppText>
          </View>
        ))}
      </Panel>
      <View style={{ gap: 8 }}>
        <SectionTitle title="What happens next" />
        <Panel>
          <Timeline steps={listing.action.steps.map(([title, body]) => ({ title, body, done: false }))} />
        </Panel>
      </View>
      {related.length ? (
        <View style={{ gap: 8 }}>
          <SectionTitle title="You may also like" />
          {related.map((e) => (
            <EntryCard key={e.id} listing={listing.key} entry={e} onPress={() => nav.push('HubEntry', { listing: listing.key, entryId: e.id })} />
          ))}
        </View>
      ) : null}
    </Page>
  );
}

/* ------------------------------------------------------------------ Action */

export function HubActionScreen() {
  const nav = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { requireAuth } = useRequireAuth();
  const { params } = useRoute<RouteProp<HomeStackParamList, 'HubAction'>>();
  const roster = useRoster();
  const listing = hubListings[params.listing];
  const entry = listingEntry(params.listing, params.entryId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState<ActivityRecord | null>(null);

  if (!listing || !entry) return <Page title="Not found"><Empty title="This item is unavailable" body="Go back and try again." /></Page>;
  const action = listing.action;

  const set = (k: string, v: string) => {
    setAnswers((a) => ({ ...a, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = () => {
    const missing: Record<string, string> = {};
    for (const f of action.fields) if (!f.optional && !answers[f.key]?.trim()) missing[f.key] = 'This is required';
    if (Object.keys(missing).length) {
      setErrors(missing);
      return;
    }
    requireAuth(() => {
      setBusy(true);
      setTimeout(() => {
        const rec: ActivityRecord = {
          id: `act-${Date.now()}`,
          listing: listing.key,
          entryId: entry.id,
          title: entry.title,
          subtitle: `${listing.title}: ${action.title}`,
          img: entry.img,
          status: action.status,
          ref: refCode(`${listing.key}${entry.id}${Date.now()}`),
          at: new Date().toISOString(),
          answers,
          steps: action.steps,
        };
        dispatch(activityAdded(rec));
        setRecord(rec);
        setBusy(false);
      }, 700);
    }, `Sign in to ${action.label.toLowerCase()}.`);
  };

  if (record) {
    return (
      <Page title={action.successTitle} onBack={() => nav.navigate('HubList', { listing: listing.key })}
        footer={<View style={{ gap: 8 }}>
          <Button label="View my activity" size="lg" fullWidth onPress={() => nav.navigate('HubActivity')} />
          <Button label={`Back to ${listing.title}`} variant="ghost" fullWidth onPress={() => nav.navigate('HubList', { listing: listing.key })} />
        </View>}>
        <View style={{ alignItems: 'center', gap: 10, paddingTop: 12 }}>
          <SuccessBurst />
          <AppText variant="h1" center>
            {action.successTitle}
          </AppText>
          <AppText muted center>
            {action.successBody}
          </AppText>
        </View>
        <Panel style={{ gap: 6 }}>
          <Row icon="file" title="Reference" body={record.ref} />
          <Row icon="paw" title={entry.title} body={listing.title} />
          {action.fields.filter((f) => answers[f.key]).map((f) => (
            <Row key={f.key} icon="check" title={f.label} body={answers[f.key]} />
          ))}
        </Panel>
        <Panel>
          <Timeline steps={action.steps.map(([title, body], i) => ({ title, body, done: i === 0 }))} />
        </Panel>
        {action.pay ? (
          <AppText variant="caption" muted center>
            Demo build: no payment was taken.
          </AppText>
        ) : null}
      </Page>
    );
  }

  return (
    <Page
      title={action.title}
      subtitle={entry.title}
      footer={<Button label={action.label} size="lg" fullWidth loading={busy} onPress={submit} />}
    >
      <Panel style={{ padding: 10 }}>
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <View style={{ width: 64 }}>
            <HubImage id={entry.img} alt={entry.title} height={64} radius={16} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="label" numberOfLines={1}>
              {entry.title}
            </AppText>
            <AppText variant="caption" muted numberOfLines={2}>
              {entry.subtitle}
            </AppText>
          </View>
        </View>
      </Panel>
      {action.fields.map((f) => {
        const options = f.options === '@pets' ? roster.map((p) => p.name) : f.options;
        return (
          <View key={f.key} style={{ gap: 4 }}>
            {f.type === 'chips' && options ? (
              <ChoiceGroup label={f.label} options={options} value={answers[f.key]} onChange={(v) => set(f.key, v)} />
            ) : (
              <Input
                label={f.optional ? `${f.label} (optional)` : f.label}
                value={answers[f.key] ?? ''}
                onChangeText={(v) => set(f.key, v)}
                placeholder={f.placeholder}
                multiline={f.type === 'multiline'}
                numberOfLines={f.type === 'multiline' ? 3 : 1}
                error={errors[f.key] || undefined}
              />
            )}
            {errors[f.key] && f.type === 'chips' ? (
              <AppText variant="caption" style={{ color: '#dc2626' }}>
                {errors[f.key]}
              </AppText>
            ) : null}
          </View>
        );
      })}
      <Panel style={{ gap: 6 }}>
        <SectionTitle title="What happens next" />
        <Timeline steps={action.steps.map(([title, body]) => ({ title, body, done: false }))} />
      </Panel>
      {action.pay ? (
        <AppText variant="caption" muted center>
          This is a demo. No payment is taken.
        </AppText>
      ) : null}
    </Page>
  );
}

/* ------------------------------------------------------------------ Activity */

export function HubActivityScreen() {
  const nav = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const activity = useAppSelector((s) => s.hub.activity);
  const saved = useAppSelector((s) => s.hub.saved);
  const [open, setOpen] = useState<string | null>(null);

  const savedEntries = saved
    .map((k) => {
      const [l, id] = k.split(':');
      const e = listingEntry(l, id);
      return e ? { l, e } : null;
    })
    .filter((x): x is { l: string; e: HubEntry } => !!x);

  return (
    <Page title="My activity" subtitle="Requests, enquiries and saved items">
      <SectionTitle eyebrow="History" title="Requests" />
      {activity.length === 0 ? (
        <Empty title="Nothing here yet" body="Adopt, join, donate or reserve something and it will show up here." action="Browse the hub" onAction={() => nav.navigate('Hub')} />
      ) : (
        <View style={{ gap: 12 }}>
          {activity.map((a) => {
            const expanded = open === a.id;
            return (
              <Panel key={a.id} style={{ gap: 10 }}>
                <Pressable onPress={() => setOpen(expanded ? null : a.id)} accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={`${a.title}, ${a.status}`}>
                  <View className="flex-row items-center" style={{ gap: 12 }}>
                    <View style={{ width: 56 }}>
                      <HubImage id={a.img} alt={a.title} height={56} radius={14} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="label" numberOfLines={1}>
                        {a.title}
                      </AppText>
                      <AppText variant="caption" muted numberOfLines={1}>
                        {a.subtitle}
                      </AppText>
                      <AppText variant="caption" muted>
                        {a.ref} | {shortDate(a.at)}
                      </AppText>
                    </View>
                    <Badge label={a.status} tone={a.cancelled ? 'neutral' : 'success'} />
                  </View>
                </Pressable>
                {expanded ? (
                  <View style={{ gap: 10 }}>
                    <Timeline steps={a.steps.map(([title, body], i) => ({ title, body, done: !a.cancelled && i === 0 }))} />
                    <View className="flex-row" style={{ gap: 8 }}>
                      <Button label="Open" variant="secondary" size="sm" onPress={() => nav.navigate('HubEntry', { listing: a.listing, entryId: a.entryId })} />
                      {!a.cancelled ? <Button label="Cancel request" variant="danger" size="sm" onPress={() => dispatch(activityCancelled(a.id))} /> : null}
                    </View>
                  </View>
                ) : null}
              </Panel>
            );
          })}
        </View>
      )}
      <SectionTitle eyebrow="Bookmarks" title="Saved" />
      {savedEntries.length === 0 ? (
        <Empty title="No saved items" body="Tap the bookmark on any listing to keep it here." />
      ) : (
        <View style={{ gap: 12 }}>
          {savedEntries.map(({ l, e }) => (
            <EntryCard key={`${l}:${e.id}`} listing={l} entry={e} onPress={() => nav.navigate('HubEntry', { listing: l, entryId: e.id })} />
          ))}
        </View>
      )}
    </Page>
  );
}

