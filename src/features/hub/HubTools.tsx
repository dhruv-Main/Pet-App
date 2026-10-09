import React, { useMemo, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Badge, Button, Icon, Input, SelectChip } from '@components/ui';
import { BarChart } from '@components/platform';
import { useLoyalty, useProducts, useProviders, useHealthRecords } from '@services/data';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { addItem } from '@features/cart/cartSlice';
import { guarded } from '@features/auth/AuthPrompt';
import { setActivePet } from '@features/ui/uiSlice';
import { Panel, SectionTitle, SummaryRow, inr, dateIn } from '@features/shared/CommerceKit';
import { demoData, formatWhen } from '@/demo/demoData';
import type { HomeStackParamList } from '@navigation/types';
import type { Product, ReminderItem } from '@apptypes/domain';
import {
  activityAdded,
  activityCancelled,
  birthdayToggled,
  customCounted,
  expenseAdded,
  expenseRemoved,
  feedDispensed,
  feedSlotUpdated,
  petAdded,
  reminderToggled,
  reviewAdded,
  rewardRedeemed,
  vaultAdded,
} from './hubSlice';
import { hubTools, refCode } from './hubData';
import { useHubNav } from './hubNav';
import { useRoster, shortDate } from './hubHooks';
import type { RosterPet } from './hubHooks';
import { Banner, ChoiceGroup, Empty, HubImage, Page, Row, Stat } from './HubKit';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const petImg = (p?: RosterPet) => (p && ['p1', 'p2', 'p3', 'p4'].includes(p.id) ? p.id : 'p1');

function PetPicker({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  const roster = useRoster();
  if (roster.length < 2) return null;
  return (
    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
      {roster.map((p) => (
        <SelectChip key={p.id} label={p.name} selected={value === p.id} onPress={() => onChange(p.id)} />
      ))}
    </View>
  );
}

function usePickedPet() {
  const roster = useRoster();
  const activeId = useAppSelector((s) => s.ui.activePetId);
  const [id, setId] = useState<string | undefined>(activeId ?? undefined);
  const pet = roster.find((p) => p.id === id) ?? roster[0];
  return { pet, setId: (v: string) => setId(v), roster };
}

/* ------------------------------------------------------------------ 42 Reminders */

function RemindersTool() {
  const dispatch = useAppDispatch();
  const done = useAppSelector((s) => s.hub.remindersDone);
  const roster = useRoster();
  const ids = new Set(roster.map((p) => p.id));
  const items = (demoData.reminders as unknown as ReminderItem[]).filter((r) => ids.has(r.petId));
  const nameOf = (id: string) => roster.find((p) => p.id === id)?.name ?? 'Pet';
  const isDone = (r: ReminderItem) => (r.completed ? !done.includes(r.id) : done.includes(r.id));
  const filters = ['All', 'Vaccines', 'Medicine', 'Vet visits', 'Other'];
  const [f, setF] = useState('All');
  const match = (r: ReminderItem) =>
    f === 'All' || (f === 'Vaccines' && r.type === 'vaccine') || (f === 'Medicine' && r.type === 'medicine') || (f === 'Vet visits' && r.type === 'vet_visit') || (f === 'Other' && ['feeding', 'grooming'].includes(r.type));
  const upcomingVax = roster.flatMap((p) => {
    const pet = (demoData.pets as unknown as { id: string; vaccinations: { id: string; name: string; dueAt: string; status: string }[] }[]).find((x) => x.id === p.id);
    return (pet?.vaccinations ?? []).filter((v) => v.status !== 'completed').map((v) => ({ ...v, pet: p.name }));
  });
  const shown = items.filter(match).sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt));
  const iconFor = (t: ReminderItem['type']) => (t === 'vaccine' ? 'syringe' : t === 'medicine' ? 'pill' : t === 'vet_visit' ? 'stethoscope' : t === 'grooming' ? 'scissors' : 'utensils');
  return (
    <>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {filters.map((x) => (
          <SelectChip key={x} label={x} selected={f === x} onPress={() => setF(x)} />
        ))}
      </View>
      {upcomingVax.length ? (
        <Panel style={{ gap: 6 }}>
          <SectionTitle eyebrow="Needs attention" title="Vaccines due" />
          {upcomingVax.map((v) => (
            <Row key={v.id} icon="syringe" title={`${v.name} for ${v.pet}`} body={`${v.status === 'overdue' ? 'Overdue since' : 'Due'} ${shortDate(v.dueAt)}`} right={<Badge label={v.status === 'overdue' ? 'Overdue' : 'Upcoming'} tone={v.status === 'overdue' ? 'danger' : 'warning'} />} />
          ))}
        </Panel>
      ) : null}
      {shown.length === 0 ? (
        <Empty title="No reminders" body="Nothing in this group." />
      ) : (
        <Panel style={{ gap: 4 }}>
          {shown.map((r) => (
            <Row
              key={r.id}
              icon={iconFor(r.type)}
              title={`${r.title}`}
              body={`${nameOf(r.petId)} | ${formatWhen(r.dueAt)}`}
              right={
                <Pressable
                  onPress={() => dispatch(reminderToggled(r.id))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isDone(r) }}
                  accessibilityLabel={`${r.title}, ${isDone(r) ? 'done' : 'not done'}`}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: isDone(r) ? '#16a34a' : 'rgba(107,115,144,0.5)', backgroundColor: isDone(r) ? '#16a34a' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {isDone(r) ? <Icon name="check" size={14} color="#ffffff" /> : null}
                  </View>
                </Pressable>
              }
            />
          ))}
        </Panel>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ 44 SOS */

function SosTool() {
  const { openService } = useHubNav();
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const send = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSent(refCode(`sos${Date.now()}`));
    }, 900);
  };
  const aid = [
    ['Stay calm', 'Move your pet away from danger and keep them still and warm.'],
    ['Check breathing', 'Look for chest movement. If absent, call the hospital now for guidance.'],
    ['Control bleeding', 'Apply firm, clean pressure with a cloth. Do not remove soaked cloths, add more.'],
    ['Suspected poisoning', 'Do not induce vomiting. Keep the packaging and call the hospital.'],
    ['Heat stroke', 'Move to shade, offer small sips of water and cool with damp towels. Go to the vet.'],
  ];
  return (
    <>
      {sent ? (
        <Panel style={{ gap: 6, borderColor: '#16a34a' }}>
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <Icon name="check-circle" size={24} color="#16a34a" />
            <AppText variant="h3">Help is alerted</AppText>
          </View>
          <AppText muted>CityVet 24x7 Emergency Hospital has been notified with your location. Expect a call within 2 minutes. Reference {sent}.</AppText>
          <Button label="Send another alert" variant="ghost" onPress={() => setSent(null)} />
        </Panel>
      ) : (
        <View style={{ gap: 12, alignItems: 'center', paddingVertical: 8 }}>
          <Pressable
            onPress={send}
            accessibilityRole="button"
            accessibilityLabel="Send emergency SOS"
            style={{ width: 168, height: 168, borderRadius: 84, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: '#dc2626', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } }}
          >
            <Icon name="siren" size={44} color="#ffffff" />
            <AppText variant="h3" style={{ color: '#fff' }}>
              {busy ? 'Sending' : 'SOS'}
            </AppText>
          </Pressable>
          <AppText muted center>
            Shares your location with the nearest 24-hour hospital.
          </AppText>
        </View>
      )}
      <Button label="Book a pet ambulance" fullWidth leftIcon={<Icon name="ambulance" size={18} color="#ffffff" />} onPress={() => openService('Ambulance')} />
      <SectionTitle eyebrow="Nearest" title="24-hour hospitals" />
      <Panel style={{ gap: 4 }}>
        {hubTools.hospitals.map((h) => (
          <Row
            key={h.id}
            icon="stethoscope"
            title={h.name}
            body={`${h.area} | ${h.km} km | ${h.eta}`}
            right={<Button label="Call" size="sm" variant="secondary" onPress={() => Linking.openURL(`tel:${h.phone.replace(/\s/g, '')}`).catch(() => {})} />}
          />
        ))}
      </Panel>
      <SectionTitle eyebrow="Before you reach" title="First aid" />
      <Panel style={{ gap: 4 }}>
        {aid.map(([t, b]) => (
          <View key={t}>
            <Row icon="alert" title={t} onPress={() => setStep(step === t ? null : t)} right={<Icon name="chevron" size={16} />} />
            {step === t ? (
              <AppText muted style={{ paddingLeft: 52, paddingBottom: 8 }}>
                {b}
              </AppText>
            ) : null}
          </View>
        ))}
      </Panel>
    </>
  );
}

/* ------------------------------------------------------------------ 45 Breed match */

const QUIZ = [
  { key: 'apartment', q: 'Where do you live?', opts: [['Small apartment', 5], ['Apartment with a park nearby', 4], ['House', 2], ['House with a large garden', 1]] },
  { key: 'energy', q: 'How active are you?', opts: [['Mostly relaxed', 1], ['A daily walk', 3], ['Regular runs or treks', 5]] },
  { key: 'kids', q: 'Are there young children at home?', opts: [['Yes', 5], ['Sometimes', 4], ['No', 3]] },
  { key: 'grooming', q: 'How much grooming can you take on?', opts: [['As little as possible', 1], ['A weekly brush', 3], ['Daily care is fine', 5]] },
  { key: 'trainable', q: 'Have you trained a dog before?', opts: [['Never', 5], ['A little', 3], ['Experienced', 1]] },
] as const;

function BreedMatchTool() {
  const [ans, setAns] = useState<Record<string, number>>({});
  const done = QUIZ.every((q) => ans[q.key] !== undefined);
  const results = useMemo(() => {
    if (!done) return [];
    return hubTools.breeds
      .map((b) => {
        // Lower distance is better. apartment/kids/trainable use the answer as the desired breed score.
        const d =
          Math.abs(b.apartment - ans.apartment) +
          Math.abs(b.energy - ans.energy) +
          Math.abs(b.kids - ans.kids) +
          Math.abs(5 - Math.abs(b.grooming - ans.grooming) * 1.25 - 1) * 0 +
          Math.abs(b.grooming - ans.grooming) +
          Math.abs(b.trainable - (ans.trainable === 5 ? 5 : ans.trainable === 3 ? 4 : 3));
        return { b, score: Math.max(40, Math.round(100 - d * 6)) };
      })
      .sort((a, c) => c.score - a.score)
      .slice(0, 3);
  }, [ans, done]);
  const { openCollection } = useHubNav();
  return (
    <>
      {QUIZ.map((q, i) => (
        <Panel key={q.key} style={{ gap: 10 }}>
          <AppText variant="eyebrow" muted>
            Question {i + 1} of {QUIZ.length}
          </AppText>
          <ChoiceGroup label={q.q} options={q.opts.map((o) => o[0] as string)} value={q.opts.find((o) => o[1] === ans[q.key])?.[0] as string | undefined} onChange={(v) => setAns((a) => ({ ...a, [q.key]: q.opts.find((o) => o[0] === v)![1] as number }))} />
        </Panel>
      ))}
      {done ? (
        <View style={{ gap: 12 }}>
          <SectionTitle eyebrow="Your matches" title="Best breeds for you" />
          {results.map(({ b, score }, i) => (
            <Panel key={b.name} style={{ padding: 10, gap: 10 }}>
              <View className="flex-row" style={{ gap: 12 }}>
                <View style={{ width: 96 }}>
                  <HubImage id={b.img} alt={b.name} height={96} radius={18} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View className="flex-row items-center justify-between">
                    <AppText variant="label">
                      {i + 1}. {b.name}
                    </AppText>
                    <Badge label={`${score} percent`} tone={score > 80 ? 'success' : 'primary'} />
                  </View>
                  <AppText variant="caption" muted>
                    {b.note}
                  </AppText>
                </View>
              </View>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {([['Energy', b.energy], ['Grooming', b.grooming], ['Trainable', b.trainable], ['Shedding', b.shedding]] as const).map(([l, v]) => (
                  <Badge key={l} label={`${l} ${v}/5`} tone="neutral" />
                ))}
              </View>
            </Panel>
          ))}
          <Button label="See breed-specific nutrition" variant="secondary" fullWidth onPress={() => openCollection('breed')} />
          <Button label="Start over" variant="ghost" onPress={() => setAns({})} />
        </View>
      ) : (
        <AppText variant="caption" muted center>
          Answer all questions to see your matches.
        </AppText>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ 46 GPS */

interface Gps {
  petId: string;
  model: string;
  battery: number;
  status: string;
  lastFix: { lat: number; lng: number; at: string; accuracyM: number };
  geofences: { id: string; name: string; radiusM: number }[];
  weeklyDistanceKm: number[];
}

function GpsTool() {
  const { pet, setId } = usePickedPet();
  const { openCollection } = useHubNav();
  const device = pet ? (demoData.gps as unknown as Record<string, Gps>)[pet.id] : undefined;
  const [pinged, setPinged] = useState<string | null>(null);
  const [fences, setFences] = useState<Record<string, boolean>>({});
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <>
      <PetPicker value={pet?.id} onChange={setId} />
      {!device ? (
        <Empty title={`No tracker paired for ${pet?.name ?? 'this pet'}`} body="Add a GPS collar to see live location, geofences and routes." action="Shop GPS trackers" onAction={() => openCollection('gps')} />
      ) : (
        <>
          <Panel style={{ gap: 12 }}>
            <View style={{ height: 190, borderRadius: 20, overflow: 'hidden', backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: i * 40, height: 1, backgroundColor: 'rgba(24,101,245,0.15)' }} />
              ))}
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <View key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${i * 14.3}%`, width: 1, backgroundColor: 'rgba(24,101,245,0.15)' }} />
              ))}
              <View style={{ width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderStyle: 'dashed', borderColor: '#1865f5', backgroundColor: 'rgba(24,101,245,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#1865f5', borderWidth: 3, borderColor: '#fff' }} />
              </View>
              <View style={{ position: 'absolute', left: 10, bottom: 10 }}>
                <Badge label={`${device.lastFix.lat.toFixed(4)}, ${device.lastFix.lng.toFixed(4)}`} tone="primary" />
              </View>
            </View>
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              <Stat label="Status" value={device.status.replace(/_/g, ' ')} icon="pin" />
              <Stat label="Battery" value={`${device.battery} percent`} icon="activity" />
              <Stat label="Last fix" value={pinged ?? formatWhen(device.lastFix.at)} icon="clock" />
              <Stat label="Accuracy" value={`${device.lastFix.accuracyM} m`} icon="scan" />
            </View>
            <Button label="Locate now" fullWidth leftIcon={<Icon name="pin" size={18} color="#ffffff" />} onPress={() => setPinged('Just now')} />
          </Panel>
          <Panel style={{ gap: 4 }}>
            <SectionTitle eyebrow="Safe zones" title="Geofences" />
            {device.geofences.map((g) => (
              <Row
                key={g.id}
                icon="shield"
                title={g.name}
                body={`${g.radiusM} m radius`}
                right={
                  <Pressable onPress={() => setFences((f) => ({ ...f, [g.id]: !(f[g.id] ?? true) }))} accessibilityRole="switch" accessibilityState={{ checked: fences[g.id] ?? true }} accessibilityLabel={`Alert when leaving ${g.name}`}>
                    <Badge label={fences[g.id] ?? true ? 'Alerts on' : 'Alerts off'} tone={fences[g.id] ?? true ? 'success' : 'neutral'} />
                  </Pressable>
                }
              />
            ))}
          </Panel>
          <Panel style={{ gap: 8 }}>
            <SectionTitle eyebrow="This week" title="Distance walked" />
            <BarChart data={device.weeklyDistanceKm} />
            <AppText variant="caption" muted>
              {device.weeklyDistanceKm.reduce((a, b) => a + b, 0).toFixed(1)} km in total. Collar model: {device.model}.
            </AppText>
          </Panel>
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ 47 Lost alert */

function LostAlertTool() {
  const dispatch = useAppDispatch();
  const activity = useAppSelector((s) => s.hub.activity);
  const { pet, setId } = usePickedPet();
  const [where, setWhere] = useState('');
  const [radius, setRadius] = useState('3 km');
  const [err, setErr] = useState('');
  const active = activity.filter((a) => a.listing === 'lostalert' && !a.cancelled);
  const volunteers = { '1 km': 38, '3 km': 124, '5 km': 260, '10 km': 540 } as Record<string, number>;
  const send = () => {
    if (!pet) return;
    if (!where.trim()) {
      setErr('Add where your pet was last seen');
      return;
    }
    dispatch(
      activityAdded({
        id: `act-${Date.now()}`, listing: 'lostalert', entryId: pet.id, title: `Lost pet alert: ${pet.name}`, subtitle: `Last seen ${where.trim()} | Radius ${radius}`,
        img: petImg(pet), status: 'Alert active', ref: refCode(`lost${pet.id}${Date.now()}`), at: new Date().toISOString(), answers: { where, radius },
        steps: [['Alert sent', `${volunteers[radius]} nearby volunteers notified`], ['Poster shared', 'Shared to community groups and shelters'], ['Sightings', 'You are notified of every sighting'], ['Reunited', 'Mark the alert as found']],
      }),
    );
    setWhere('');
    setErr('');
  };
  return (
    <>
      {active.map((a) => (
        <Panel key={a.id} style={{ gap: 8, borderColor: '#dc2626' }}>
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <View style={{ width: 64 }}>
              <HubImage id={a.img} alt={a.title} height={64} radius={16} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="label">{a.title}</AppText>
              <AppText variant="caption" muted>
                {a.subtitle}
              </AppText>
              <AppText variant="caption" muted>
                {a.ref} | {a.steps[0][1]}
              </AppText>
            </View>
          </View>
          <Button label="Mark as found" variant="secondary" fullWidth onPress={() => dispatch(activityCancelled(a.id))} />
        </Panel>
      ))}
      <Panel style={{ gap: 12 }}>
        <SectionTitle eyebrow="New alert" title="Alert nearby volunteers" />
        <PetPicker value={pet?.id} onChange={setId} />
        <Input label={`Where was ${pet?.name ?? 'your pet'} last seen`} value={where} onChangeText={(v) => { setWhere(v); setErr(''); }} placeholder="Street, landmark or area" error={err || undefined} />
        <ChoiceGroup label="Alert radius" options={Object.keys(volunteers)} value={radius} onChange={setRadius} />
        <AppText variant="caption" muted>
          About {volunteers[radius]} volunteers and 6 shelters in range.
        </AppText>
        <Button label="Send alert" size="lg" variant="danger" fullWidth onPress={send} />
      </Panel>
    </>
  );
}

/* ------------------------------------------------------------------ 48 Rewards */

function useBasePoints() {
  const loyalty = useLoyalty().data;
  const activity = useAppSelector((s) => s.hub.activity);
  const redeemed = useAppSelector((s) => s.hub.redeemed);
  const earned = activity.filter((a) => !a.cancelled).length * 25;
  return { loyalty, points: loyalty.points + earned - redeemed.reduce((a, r) => a + r.cost, 0), earned };
}

function RewardsTool() {
  const dispatch = useAppDispatch();
  const redeemed = useAppSelector((s) => s.hub.redeemed);
  const { loyalty, points, earned } = useBasePoints();
  const [msg, setMsg] = useState('');
  return (
    <>
      <Panel style={{ gap: 8, backgroundColor: '#0b0f1a', borderColor: '#0b0f1a' }}>
        <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {loyalty.tier} member
        </AppText>
        <AppText variant="hero" style={{ color: '#fff' }}>
          {points.toLocaleString('en-IN')}
        </AppText>
        <AppText style={{ color: 'rgba(255,255,255,0.8)' }}>points available. {loyalty.pointsToNextTier.toLocaleString('en-IN')} to {loyalty.nextTier}.</AppText>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <View style={{ height: 8, borderRadius: 4, width: `${Math.min(100, Math.round((loyalty.lifetimePoints / (loyalty.lifetimePoints + loyalty.pointsToNextTier)) * 100))}%`, backgroundColor: '#fbbf24' }} />
        </View>
        {earned ? <AppText variant="caption" style={{ color: '#fbbf24' }}>+{earned} earned from hub activity</AppText> : null}
      </Panel>
      {msg ? <AppText style={{ color: '#16a34a' }}>{msg}</AppText> : null}
      <SectionTitle eyebrow="Redeem" title="Rewards" />
      {hubTools.rewards.map((r) => (
        <Panel key={r.id}>
          <Row
            icon={r.icon}
            title={r.title}
            body={`${r.cost.toLocaleString('en-IN')} points`}
            right={
              <Button
                label={points >= r.cost ? 'Redeem' : 'Not enough'}
                size="sm"
                variant={points >= r.cost ? 'primary' : 'secondary'}
                onPress={() => {
                  if (points < r.cost) return;
                  dispatch(rewardRedeemed({ id: `${r.id}-${Date.now()}`, title: r.title, cost: r.cost, at: new Date().toISOString() }));
                  setMsg(`Redeemed: ${r.title}. The code is in your inbox.`);
                }}
              />
            }
          />
        </Panel>
      ))}
      <SectionTitle eyebrow="History" title="Points activity" />
      <Panel style={{ gap: 4 }}>
        {redeemed.map((r) => (
          <Row key={r.id} icon="gift" title={r.title} body={shortDate(r.at)} right={<Badge label={`-${r.cost}`} tone="neutral" />} />
        ))}
        {loyalty.history.map((h) => (
          <Row key={h.id} icon={h.delta > 0 ? 'trend-up' : 'gift'} title={h.reason} body={shortDate(h.date)} right={<Badge label={`${h.delta > 0 ? '+' : ''}${h.delta}`} tone={h.delta > 0 ? 'success' : 'neutral'} />} />
        ))}
      </Panel>
    </>
  );
}

/* ------------------------------------------------------------------ 50 Expenses */

interface Spending {
  monthly: { label: string; amount: number }[];
  byCategory: { key: string; label: string; amount: number }[];
  byPet: { petId: string; amount: number }[];
}

const EXP_CATS = ['Food', 'Healthcare', 'Services', 'Accessories', 'Other'];

function ExpensesTool() {
  const dispatch = useAppDispatch();
  const spending = demoData.spending as unknown as Spending;
  const extra = useAppSelector((s) => s.hub.expenses);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('Food');
  const [err, setErr] = useState('');
  const added = extra.reduce((a, e) => a + e.amount, 0);
  const monthly = spending.monthly.map((m, i, arr) => (i === arr.length - 1 ? { ...m, amount: m.amount + added } : m));
  const cats = spending.byCategory.map((c) => ({ ...c, amount: c.amount + extra.filter((e) => e.category === c.label).reduce((a, e) => a + e.amount, 0) }));
  const catsOther = extra.filter((e) => !spending.byCategory.some((c) => c.label === e.category)).reduce((a, e) => a + e.amount, 0);
  const total = monthly[monthly.length - 1].amount;
  const roster = useRoster();
  const add = () => {
    const n = Number(amount.replace(/,/g, ''));
    if (!label.trim() || !(n > 0)) {
      setErr('Enter a name and an amount above zero');
      return;
    }
    dispatch(expenseAdded({ id: `ex-${Date.now()}`, label: label.trim(), category: cat, amount: Math.round(n), at: new Date().toISOString() }));
    setLabel('');
    setAmount('');
    setErr('');
  };
  return (
    <>
      <Panel style={{ gap: 8 }}>
        <AppText variant="eyebrow" muted>
          This month
        </AppText>
        <AppText variant="hero">{inr(total)}</AppText>
        <AppText variant="caption" muted>
          Average of {inr(Math.round(monthly.reduce((a, m) => a + m.amount, 0) / monthly.length))} over six months.
        </AppText>
        <BarChart data={monthly.map((m) => m.amount)} />
      </Panel>
      <Panel style={{ gap: 6 }}>
        <SectionTitle title="By category" />
        {cats.map((c) => (
          <SummaryRow key={c.key} label={c.label} value={inr(c.amount)} />
        ))}
        {catsOther ? <SummaryRow label="Additional" value={inr(catsOther)} /> : null}
      </Panel>
      <Panel style={{ gap: 6 }}>
        <SectionTitle title="By pet" />
        {spending.byPet
          .filter((p) => roster.some((r) => r.id === p.petId))
          .map((p) => (
            <SummaryRow key={p.petId} label={roster.find((r) => r.id === p.petId)?.name ?? p.petId} value={inr(p.amount)} />
          ))}
      </Panel>
      <Panel style={{ gap: 12 }}>
        <SectionTitle eyebrow="Log" title="Add an expense" />
        <Input label="What was it for" value={label} onChangeText={setLabel} placeholder="Vet visit, toy, treats" />
        <Input label="Amount (Rs)" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" placeholder="500" error={err || undefined} />
        <ChoiceGroup label="Category" options={EXP_CATS} value={cat} onChange={setCat} />
        <Button label="Add expense" fullWidth onPress={add} />
      </Panel>
      {extra.length ? (
        <Panel style={{ gap: 4 }}>
          <SectionTitle title="Added by you" />
          {extra.map((e) => (
            <Row key={e.id} icon="wallet" title={e.label} body={`${e.category} | ${shortDate(e.at)}`} right={<View className="flex-row items-center" style={{ gap: 6 }}><AppText variant="label">{inr(e.amount)}</AppText><Pressable onPress={() => dispatch(expenseRemoved(e.id))} accessibilityRole="button" accessibilityLabel={`Remove ${e.label}`} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={16} /></Pressable></View>} />
          ))}
        </Panel>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ 51 Birthday */

function nextBirthday(dob?: string) {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  const next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) next.setFullYear(now.getFullYear() + 1);
  return { date: next, days: Math.round((+next - +now) / 86400000), turning: next.getFullYear() - d.getFullYear() };
}

function BirthdayTool() {
  const dispatch = useAppDispatch();
  const on = useAppSelector((s) => s.hub.birthdays);
  const roster = useRoster();
  const dobs = demoData.pets as unknown as { id: string; dateOfBirth?: string }[];
  return (
    <>
      {roster.map((p) => {
        const nb = nextBirthday(dobs.find((x) => x.id === p.id)?.dateOfBirth);
        return (
          <Panel key={p.id} style={{ gap: 6 }}>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View style={{ width: 56 }}>
                <HubImage id={petImg(p)} alt={p.name} height={56} radius={28} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="h3">{p.name}</AppText>
                <AppText variant="caption" muted>
                  {nb ? `Turns ${nb.turning} on ${nb.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}, in ${nb.days} days` : 'Add a date of birth to schedule'}
                </AppText>
              </View>
            </View>
            {hubTools.birthday.map((a) => {
              const key = `${p.id}:${a.key}`;
              const active = on.includes(key);
              return (
                <Row
                  key={key}
                  icon={a.icon}
                  title={a.title}
                  body={a.body}
                  right={
                    <Pressable onPress={() => dispatch(birthdayToggled(key))} accessibilityRole="switch" accessibilityState={{ checked: active }} accessibilityLabel={`${a.title} for ${p.name}`}>
                      <Badge label={active ? 'On' : 'Off'} tone={active ? 'success' : 'neutral'} />
                    </Pressable>
                  }
                />
              );
            })}
          </Panel>
        );
      })}
      <AppText variant="caption" muted center>
        Automations run seven days before the birthday. Demo build: no orders are placed.
      </AppText>
    </>
  );
}

/* ------------------------------------------------------------------ 54 Camera */

function CameraTool() {
  const { pet } = usePickedPet();
  const { openCollection } = useHubNav();
  const [live, setLive] = useState(true);
  const [note, setNote] = useState('');
  const act = (m: string) => setNote(m);
  return (
    <>
      <Panel style={{ gap: 12, padding: 12 }}>
        <View style={{ borderRadius: 20, overflow: 'hidden' }}>
          <HubImage id={petImg(pet)} alt={`Camera view of ${pet?.name ?? 'your pet'}`} height={210} radius={20} />
          <View style={{ position: 'absolute', top: 12, left: 12 }}>
            <Badge label={live ? 'Live' : 'Paused'} tone={live ? 'danger' : 'neutral'} />
          </View>
          <View style={{ position: 'absolute', top: 12, right: 12 }}>
            <Badge label="Living room" tone="neutral" />
          </View>
        </View>
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          <Button label={live ? 'Pause' : 'Resume'} variant="secondary" size="sm" onPress={() => setLive((v) => !v)} />
          <Button label="Talk" variant="secondary" size="sm" onPress={() => act('Two-way audio connected.')} />
          <Button label="Toss a treat" variant="secondary" size="sm" onPress={() => act('Treat tossed.')} />
          <Button label="Snapshot" variant="secondary" size="sm" onPress={() => act('Snapshot saved to your vault.')} />
        </View>
        {note ? <AppText variant="caption" style={{ color: '#16a34a' }}>{note}</AppText> : null}
      </Panel>
      <SectionTitle eyebrow="Today" title="Activity moments" />
      <Panel style={{ gap: 4 }}>
        {hubTools.camera.events.map((e) => (
          <Row key={e.id} icon={e.icon} title={e.title} body={e.body} right={<AppText variant="caption" muted>{e.time}</AppText>} />
        ))}
      </Panel>
      <Button label="Shop smart cameras" variant="secondary" fullWidth onPress={() => openCollection('cameras')} />
      <AppText variant="caption" muted center>
        Demo view. A real camera feed needs a paired device and a streaming service.
      </AppText>
    </>
  );
}

/* ------------------------------------------------------------------ 57 Symptoms */

function SymptomsTool() {
  const { openService, openTool } = useHubNav();
  const { pet, setId } = usePickedPet();
  const [sel, setSel] = useState<string[]>([]);
  const [dur, setDur] = useState<string | undefined>();
  const [result, setResult] = useState<null | { level: string; tone: 'danger' | 'warning' | 'success'; body: string }>(null);
  const toggle = (k: string) => {
    setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
    setResult(null);
  };
  const check = () => {
    const score = hubTools.symptoms.filter((s) => sel.includes(s.key)).reduce((a, s) => a + s.weight, 0) + (dur === 'More than 3 days' ? 2 : dur === '1 to 3 days' ? 1 : 0);
    const critical = hubTools.symptoms.some((s) => sel.includes(s.key) && s.weight >= 5);
    if (critical || score >= 7) setResult({ level: 'Emergency', tone: 'danger', body: 'These signs can be life-threatening. Go to the nearest 24-hour hospital now.' });
    else if (score >= 4) setResult({ level: 'See a vet today', tone: 'warning', body: 'Book a same-day consult. Keep water available and avoid giving human medicines.' });
    else if (score >= 2) setResult({ level: 'Book within 48 hours', tone: 'warning', body: 'Monitor closely and book a visit if it continues or worsens.' });
    else setResult({ level: 'Monitor at home', tone: 'success', body: 'Keep an eye on appetite, energy and water intake. Book a vet if anything changes.' });
  };
  return (
    <>
      <PetPicker value={pet?.id} onChange={setId} />
      <Panel style={{ gap: 10 }}>
        <SectionTitle eyebrow="Step 1" title={`What is ${pet?.name ?? 'your pet'} showing`} />
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {hubTools.symptoms.map((s) => (
            <SelectChip key={s.key} label={s.label} selected={sel.includes(s.key)} onPress={() => toggle(s.key)} />
          ))}
        </View>
      </Panel>
      <Panel style={{ gap: 10 }}>
        <ChoiceGroup label="Step 2: For how long" options={['Under a day', '1 to 3 days', 'More than 3 days']} value={dur} onChange={(v) => { setDur(v); setResult(null); }} />
      </Panel>
      <Button label="Check urgency" size="lg" fullWidth disabled={sel.length === 0} onPress={check} />
      {result ? (
        <Panel style={{ gap: 8, borderColor: result.tone === 'danger' ? '#dc2626' : result.tone === 'warning' ? '#f59e0b' : '#16a34a' }}>
          <Badge label={result.level} tone={result.tone} />
          <AppText>{result.body}</AppText>
          {result.tone === 'danger' ? <Button label="Open Emergency SOS" variant="danger" fullWidth onPress={() => openTool('sos')} /> : <Button label="Book a vet consult" fullWidth onPress={() => openService('Teleconsult')} />}
        </Panel>
      ) : null}
      <AppText variant="caption" muted center>
        This tool gives general guidance and is not a diagnosis.
      </AppText>
    </>
  );
}

/* ------------------------------------------------------------------ 58 Nutrition */

function NutritionTool() {
  const nav = useNavigation<Nav>();
  const { pet, setId } = usePickedPet();
  const products = useProducts().data;
  const [weight, setWeight] = useState(pet?.weightKg ? String(pet.weightKg) : '');
  const [stage, setStage] = useState('Adult');
  const [act, setAct] = useState('Moderate');
  const [neut, setNeut] = useState('Neutered');
  const w = Number(weight);
  const kcal = w > 0 ? Math.round(70 * Math.pow(w, 0.75) * (stage === 'Puppy' || stage === 'Kitten' ? 2 : stage === 'Senior' ? 1.4 : neut === 'Neutered' ? 1.6 : 1.8) * (act === 'Low' ? 0.85 : act === 'High' ? 1.2 : 1)) : 0;
  const grams = Math.round(kcal / 3.6);
  const picks = products.filter((p) => p.category === 'food' && !p.tags.includes('prescription')).slice(0, 3);
  return (
    <>
      <PetPicker value={pet?.id} onChange={(id) => { setId(id); }} />
      <Panel style={{ gap: 12 }}>
        <Input label="Weight (kg)" value={weight} onChangeText={(v) => setWeight(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" placeholder="e.g. 12" />
        <ChoiceGroup label="Life stage" options={['Puppy', 'Adult', 'Senior']} value={stage} onChange={setStage} />
        <ChoiceGroup label="Activity" options={['Low', 'Moderate', 'High']} value={act} onChange={setAct} />
        <ChoiceGroup label="Neutered" options={['Neutered', 'Not neutered']} value={neut} onChange={setNeut} />
      </Panel>
      {kcal > 0 ? (
        <Panel style={{ gap: 8 }}>
          <AppText variant="eyebrow" muted>
            Daily target for {pet?.name ?? 'your pet'}
          </AppText>
          <AppText variant="hero">{kcal} kcal</AppText>
          <SummaryRow label="Dry food" value={`${grams} g per day`} hint="At about 3.6 kcal per gram" />
          <SummaryRow label="Two meals" value={`${Math.round(grams / 2)} g each`} />
          <SummaryRow label="Treats up to" value={`${Math.round(kcal * 0.1)} kcal`} hint="Keep to 10 percent of the day" />
        </Panel>
      ) : (
        <AppText variant="caption" muted center>
          Enter a weight to see the plan.
        </AppText>
      )}
      <SectionTitle eyebrow="Suggested" title="Foods to consider" />
      {picks.map((p: Product) => (
        <Panel key={p.id}>
          <Row icon="utensils" title={p.title} body={`${p.brand} | ${inr(p.price)}`} onPress={() => nav.navigate('ProductDetail', { productId: p.id })} right={<Icon name="chevron" size={16} />} />
        </Panel>
      ))}
      <AppText variant="caption" muted center>
        Estimates use the standard resting energy formula. Ask your vet for medical diets.
      </AppText>
    </>
  );
}

/* ------------------------------------------------------------------ 59 Vault */

function VaultTool() {
  const dispatch = useAppDispatch();
  const extra = useAppSelector((s) => s.hub.vaultExtra);
  const { pet, setId } = usePickedPet();
  const records = useHealthRecords(pet?.id).data.filter((r) => ['lab', 'checkup', 'surgery', 'dental'].includes(r.type)).slice(0, 5);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('Lab report');
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const docs = [...extra, ...hubTools.vault];
  const add = () => {
    if (!title.trim()) {
      setErr('Give the document a name');
      return;
    }
    dispatch(vaultAdded({ id: `vd-${Date.now()}`, title: title.trim(), kind, date: new Date().toISOString().slice(0, 10), size: '1.0 MB' }));
    setTitle('');
    setErr('');
  };
  return (
    <>
      <PetPicker value={pet?.id} onChange={setId} />
      <Panel style={{ gap: 4 }}>
        <SectionTitle eyebrow="Encrypted" title="Documents" />
        {docs.map((d) => (
          <View key={d.id}>
            <Row icon="folder-lock" title={d.title} body={`${d.kind} | ${shortDate(d.date)} | ${d.size}`} onPress={() => setOpen(open === d.id ? null : d.id)} right={<Icon name="chevron" size={16} />} />
            {open === d.id ? (
              <View className="flex-row" style={{ gap: 8, paddingLeft: 52, paddingBottom: 8 }}>
                <Button label="Share with vet" size="sm" variant="secondary" onPress={() => setOpen(null)} />
                <Badge label="Stored securely" tone="success" />
              </View>
            ) : null}
          </View>
        ))}
      </Panel>
      <Panel style={{ gap: 12 }}>
        <SectionTitle eyebrow="Add" title="Upload a report" />
        <Input label="Document name" value={title} onChangeText={(v) => { setTitle(v); setErr(''); }} placeholder="Blood panel, X-ray, prescription" error={err || undefined} />
        <ChoiceGroup label="Type" options={['Lab report', 'Imaging', 'Prescription', 'Certificate']} value={kind} onChange={setKind} />
        <Button label="Save to vault" leftIcon={<Icon name="upload" size={18} color="#ffffff" />} fullWidth onPress={add} />
        <AppText variant="caption" muted>
          Demo build: this saves a sample entry. Real file upload needs storage and a scan service.
        </AppText>
      </Panel>
      {records.length ? (
        <Panel style={{ gap: 4 }}>
          <SectionTitle eyebrow="From your health record" title={`${pet?.name}'s visits`} />
          {records.map((r) => (
            <Row key={r.id} icon="file" title={r.title} body={`${r.provider} | ${shortDate(r.date)}`} />
          ))}
        </Panel>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ 64 Multi pet */

function MultiPetTool() {
  const dispatch = useAppDispatch();
  const roster = useRoster();
  const activeId = useAppSelector((s) => s.ui.activePetId) ?? roster[0]?.id;
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [age, setAge] = useState('1');
  const [err, setErr] = useState('');
  const add = () => {
    if (!name.trim()) {
      setErr('Enter your pet\'s name');
      return;
    }
    const id = `x${Date.now()}`;
    dispatch(petAdded({ id, name: name.trim(), species: species === 'Cat' ? 'cat' : 'dog', breed: breed.trim() || 'Mixed breed', ageYears: Number(age) || 1 }));
    dispatch(setActivePet(id));
    setName('');
    setBreed('');
    setErr('');
  };
  const profiles = demoData.pets as unknown as { id: string; healthScore: number; gender: string }[];
  return (
    <>
      {roster.map((p) => {
        const active = p.id === activeId;
        return (
          <Panel key={p.id} style={{ padding: 12, borderColor: active ? '#1865f5' : undefined, borderWidth: active ? 2 : 1 }}>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View style={{ width: 64 }}>
                <HubImage id={petImg(p)} alt={p.name} height={64} radius={32} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="h3">{p.name}</AppText>
                <AppText variant="caption" muted>
                  {p.breed} | {Math.floor(p.ageMonths / 12)} yr {p.ageMonths % 12} mo
                </AppText>
                {profiles.find((x) => x.id === p.id) ? (
                  <AppText variant="caption" muted>
                    Health score {profiles.find((x) => x.id === p.id)!.healthScore}
                  </AppText>
                ) : null}
              </View>
              {active ? <Badge label="Active" tone="primary" /> : <Button label="Switch" size="sm" variant="secondary" onPress={() => dispatch(setActivePet(p.id))} />}
            </View>
          </Panel>
        );
      })}
      <Panel style={{ gap: 12 }}>
        <SectionTitle eyebrow="Family" title="Add another pet" />
        <Input label="Name" value={name} onChangeText={(v) => { setName(v); setErr(''); }} error={err || undefined} />
        <ChoiceGroup label="Species" options={['Dog', 'Cat']} value={species} onChange={setSpecies} />
        <Input label="Breed" value={breed} onChangeText={setBreed} placeholder="Optional" />
        <Input label="Age (years)" value={age} onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
        <Button label="Add pet" fullWidth onPress={add} />
        <AppText variant="caption" muted>
          New pets are kept for this session. Syncing across devices needs a backend.
        </AppText>
      </Panel>
    </>
  );
}

/* ------------------------------------------------------------------ 65 Feeding */

function FeedingTool() {
  const dispatch = useAppDispatch();
  const slots = useAppSelector((s) => s.hub.feedSlots);
  const log = useAppSelector((s) => s.hub.feedLog);
  const { openCollection } = useHubNav();
  const total = slots.filter((s) => s.on).reduce((a, s) => a + s.grams, 0);
  const dispense = (grams: number, source: string) => dispatch(feedDispensed({ id: `fl-${Date.now()}-${Math.random()}`, at: new Date().toISOString(), grams, source }));
  return (
    <>
      <Panel style={{ gap: 4 }}>
        <AppText variant="eyebrow" muted>
          Scheduled today
        </AppText>
        <AppText variant="hero">{total} g</AppText>
        <AppText variant="caption" muted>
          Feeder: PetOS Smart Feeder 4L, hopper 68 percent full.
        </AppText>
      </Panel>
      <SectionTitle eyebrow="Schedule" title="Meals" />
      {slots.map((s) => (
        <Panel key={s.id} style={{ gap: 8 }}>
          <View className="flex-row items-center justify-between">
            <View>
              <AppText variant="label">{s.label}</AppText>
              <AppText variant="caption" muted>
                {s.time}
              </AppText>
            </View>
            <Pressable onPress={() => dispatch(feedSlotUpdated({ ...s, on: !s.on }))} accessibilityRole="switch" accessibilityState={{ checked: s.on }} accessibilityLabel={`${s.label} schedule`}>
              <Badge label={s.on ? 'On' : 'Off'} tone={s.on ? 'success' : 'neutral'} />
            </Pressable>
          </View>
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <Pressable onPress={() => dispatch(feedSlotUpdated({ ...s, grams: Math.max(10, s.grams - 10) }))} accessibilityRole="button" accessibilityLabel={`Decrease ${s.label} portion`} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(107,115,144,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="minus" size={18} />
            </Pressable>
            <AppText variant="h3" style={{ minWidth: 72, textAlign: 'center' }}>
              {s.grams} g
            </AppText>
            <Pressable onPress={() => dispatch(feedSlotUpdated({ ...s, grams: Math.min(400, s.grams + 10) }))} accessibilityRole="button" accessibilityLabel={`Increase ${s.label} portion`} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(107,115,144,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={18} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Button label="Dispense now" size="sm" variant="secondary" onPress={() => dispense(s.grams, s.label)} />
          </View>
        </Panel>
      ))}
      <SectionTitle eyebrow="Recent" title="Feeding log" />
      {log.length === 0 ? (
        <Empty title="No manual feeds yet" body="Use Dispense now to log and release a portion." />
      ) : (
        <Panel style={{ gap: 4 }}>
          {log.slice(0, 8).map((l) => (
            <Row key={l.id} icon="utensils" title={`${l.grams} g dispensed`} body={`${l.source} | ${formatWhen(l.at)}`} />
          ))}
        </Panel>
      )}
      <Button label="Shop smart feeders" variant="secondary" fullWidth onPress={() => openCollection('feeders')} />
      <AppText variant="caption" muted center>
        Demo build: dispensing is simulated. A real feeder needs device pairing and a cloud service.
      </AppText>
    </>
  );
}

/* ------------------------------------------------------------------ 39 Reviews */

function ReviewsTool() {
  const dispatch = useAppDispatch();
  const mine = useAppSelector((s) => s.hub.reviews);
  const providers = useProviders().data;
  const top = [...providers].sort((a, b) => b.rating - a.rating).slice(0, 6);
  const [target, setTarget] = useState<string | undefined>();
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    if (!target || stars === 0 || text.trim().length < 5) {
      setErr('Choose who you are reviewing, a star rating and a few words.');
      return;
    }
    dispatch(reviewAdded({ id: `rv-${Date.now()}`, target, rating: stars, text: text.trim(), at: new Date().toISOString() }));
    setTarget(undefined);
    setStars(0);
    setText('');
    setErr('');
  };
  return (
    <>
      <SectionTitle eyebrow="Top rated" title="Providers" />
      <Panel style={{ gap: 4 }}>
        {top.map((p) => (
          <Row key={p.id} icon="star" title={p.name} body={`${p.reviewCount} reviews`} right={<Badge label={p.rating.toFixed(1)} tone="success" />} />
        ))}
      </Panel>
      <Panel style={{ gap: 12 }}>
        <SectionTitle eyebrow="Share" title="Write a review" />
        <ChoiceGroup label="Who are you reviewing" options={top.map((p) => p.name)} value={target} onChange={setTarget} />
        <View style={{ gap: 6 }}>
          <AppText variant="label">Rating</AppText>
          <View className="flex-row" style={{ gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setStars(n)} accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`} accessibilityState={{ selected: stars >= n }} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="star" size={28} color={stars >= n ? '#f59e0b' : '#cbd5e1'} />
              </Pressable>
            ))}
          </View>
        </View>
        <Input label="Your experience" value={text} onChangeText={(v) => { setText(v); setErr(''); }} multiline numberOfLines={3} placeholder="What went well, what could be better" error={err || undefined} />
        <Button label="Post review" fullWidth onPress={submit} />
      </Panel>
      {mine.length ? (
        <Panel style={{ gap: 8 }}>
          <SectionTitle title="Your reviews" />
          {mine.map((r) => (
            <View key={r.id} style={{ gap: 2 }}>
              <View className="flex-row items-center justify-between">
                <AppText variant="label">{r.target}</AppText>
                <Badge label={`${r.rating} of 5`} tone="success" />
              </View>
              <AppText muted>{r.text}</AppText>
            </View>
          ))}
        </Panel>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ 10 Custom clothing */

const COLOURS: [string, string][] = [['Navy', '#1e3a8a'], ['Red', '#dc2626'], ['Forest', '#166534'], ['Mustard', '#ca8a04'], ['Blush', '#f9a8d4']];

function CustomClothingTool() {
  const dispatch = useAppDispatch();
  const { openTab } = useCartNav();
  const count = useAppSelector((s) => s.hub.customCount);
  const { pet } = usePickedPet();
  const [garment, setGarment] = useState('hoodie');
  const [size, setSize] = useState('M');
  const [colour, setColour] = useState('Navy');
  const [name, setName] = useState(pet?.name ?? '');
  const [added, setAdded] = useState(false);
  const g = hubTools.garments.find((x) => x.key === garment)!;
  const hex = COLOURS.find((c) => c[0] === colour)![1];
  const add = () => {
    const product: Product = {
      id: `custom-${count + 1}`,
      title: `Custom ${g.label.toLowerCase()}${name.trim() ? ` for ${name.trim()}` : ''}, ${colour}, size ${size}`,
      brand: 'Pet OS Studio',
      category: 'apparel',
      price: g.price,
      mrp: g.price,
      rating: 5,
      reviewCount: 0,
      isSubscribable: false,
      tags: ['custom'],
    };
    dispatch(addItem({ product, quantity: 1 }));
    dispatch(customCounted());
    setAdded(true);
  };
  return (
    <>
      <Panel style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
        <View style={{ width: 200, height: 170, borderRadius: garment === 'bandana' ? 0 : 32, backgroundColor: hex, alignItems: 'center', justifyContent: 'center', transform: garment === 'bandana' ? [{ rotate: '45deg' }, { scale: 0.7 }] : [] }}>
          <View style={{ transform: garment === 'bandana' ? [{ rotate: '-45deg' }] : [] }}>
            <AppText variant="h2" style={{ color: '#fff' }}>
              {name.trim().slice(0, 12) || 'Name'}
            </AppText>
          </View>
        </View>
        <AppText variant="h3">{inr(g.price)}</AppText>
        <AppText variant="caption" muted>
          Made to order. Delivered by {dateIn(7)}.
        </AppText>
      </Panel>
      <Panel style={{ gap: 14 }}>
        <ChoiceGroup label="Garment" options={hubTools.garments.map((x) => x.label)} value={g.label} onChange={(l) => { setGarment(hubTools.garments.find((x) => x.label === l)!.key); setAdded(false); }} />
        <ChoiceGroup label="Size" options={['XS', 'S', 'M', 'L', 'XL']} value={size} onChange={(v) => { setSize(v); setAdded(false); }} />
        <ChoiceGroup label="Colour" options={COLOURS.map((c) => c[0])} value={colour} onChange={(v) => { setColour(v); setAdded(false); }} />
        <Input label="Name on the garment" value={name} onChangeText={(v) => { setName(v.slice(0, 12)); setAdded(false); }} placeholder="Up to 12 characters" />
      </Panel>
      <Button label={added ? 'Added. Add another' : 'Add to cart'} size="lg" fullWidth onPress={add} />
      {added ? <Button label="Go to cart" variant="secondary" fullWidth onPress={openTab} /> : null}
    </>
  );
}

function useCartNav() {
  const nav = useNavigation();
  return {
    openTab: () => {
      let n: any = nav;
      while (n && !n.getState().routeNames.includes('ShopTab')) n = n.getParent();
      (n ?? nav).navigate('ShopTab' as never, { screen: 'Cart' } as never);
    },
  };
}

/* ------------------------------------------------------------------ Registry */

interface ToolDef {
  title: string;
  subtitle: string;
  hero: string;
  member?: string;
  C: React.ComponentType;
}

const D = (title: string, subtitle: string, hero: string, Inner: React.ComponentType, member?: string): ToolDef => {
  const Framed = () => (
    <Page title={title} subtitle={subtitle}>
      <Banner img={hero} icon="sparkles" eyebrow="Pet OS" title={title} body={subtitle} />
      <Inner />
    </Page>
  );
  return { title, subtitle, hero, C: member ? guarded(Framed, member) : Framed, member };
};

const TOOLS: Record<string, ToolDef> = {
  reminders: D('Vaccine and medicine reminders', 'Never miss a dose or a booster', 'pr35', RemindersTool, 'Sign in to see your pet reminders.'),
  sos: D('Emergency SOS', 'One tap to the nearest emergency care', 's15', SosTool),
  breedmatch: D('Breed Match Advisor', 'Five questions, three best breeds', 'p2', BreedMatchTool),
  gps: D('GPS collar tracking', 'Live location, geofences and routes', 'pr49', GpsTool, 'Sign in to track your pet.'),
  lostalert: D('Lost Pet Alert Network', 'Alert nearby volunteers in minutes', 's10', LostAlertTool, 'Sign in to send a lost pet alert.'),
  rewards: D('Rewards and Loyalty', 'Earn and redeem points', 'prime', RewardsTool, 'Sign in to see your rewards.'),
  expenses: D('Pet Expense Tracker', 'Where every rupee goes', 'pr1', ExpensesTool, 'Sign in to track your pet spending.'),
  birthday: D('Birthday automation', 'Cakes, gifts and invites on autopilot', 'p4', BirthdayTool, 'Sign in to automate birthdays.'),
  camera: D('Smart Camera Integration', 'Live view and activity moments', 'pr48', CameraTool, 'Sign in to view your camera.'),
  symptoms: D('AI Symptom Checker', 'Check how urgent it is', 's1', SymptomsTool),
  nutrition: D('Nutrition Planner', 'Daily calories and a meal plan', 'pr27', NutritionTool),
  vault: D('Medical Report Vault', 'Secure storage for scans and lab reports', 's3', VaultTool, 'Sign in to open your report vault.'),
  multipet: D('Multi-Pet Family Management', 'All your pets in one view', 'p2', MultiPetTool, 'Sign in to manage your pets.'),
  feeding: D('Smart Feeding Integration', 'Schedules and portions from your phone', 'pr25', FeedingTool, 'Sign in to manage feeding.'),
  reviews: D('Reviews and ratings', 'Honest reviews from real pet parents', 'c5', ReviewsTool, 'Sign in to write a review.'),
  customclothing: D('Custom clothing', 'Design a name hoodie or tee', 'pr40', CustomClothingTool),
};

export function HubToolScreen() {
  const { params } = useRoute<RouteProp<HomeStackParamList, 'HubTool'>>();
  const def = TOOLS[params.tool];
  if (!def) return <Page title="Not found"><Empty title="This tool is unavailable" body="Go back and choose another feature." /></Page>;
  const C = def.C;
  return <C />;
}
