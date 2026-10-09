import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AppText, Icon, IconBadge } from '@components/ui';
import type { IconName } from '@components/ui';
import { BackCircle } from '@components/ui/FloatingBackButton';
import { RemoteImage } from '@components/media';
import { Reveal } from '@components/premium';
import { useTheme } from '@theme/ThemeProvider';
import { gradients } from '@theme/tokens';
import { aiClient } from '@services/ai/aiClient';
import { useCurrentUser, usePet } from '@services/data';
import { useGetTwinSnapshotQuery } from '@services/api/platformApi';
import { petHeroAsset } from '@services/media/imageService';
import { logger } from '@platform/observability';

type CardKind = 'vaccine' | 'diet' | 'exercise' | 'health' | 'services' | 'shop' | 'passport';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: number;
  card?: CardKind;
}

const MAX_LENGTH = 1000;
const log = logger.scope('ai');

const timeOf = (t: number) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/** Picks which Pet OS card to attach to a reply, from the wording of the question. */
function cardFor(text: string): CardKind | undefined {
  const t = text.toLowerCase();
  if (/vaccin|shot|booster|rabies/.test(t)) return 'vaccine';
  if (/diet|food|eat|nutrition|feed|kibble/.test(t)) return 'diet';
  if (/exercise|walk|activity|run|play/.test(t)) return 'exercise';
  if (/passport|microchip|record|certificate/.test(t)) return 'passport';
  if (/groom|vet|train|board|service|book/.test(t)) return 'services';
  if (/buy|shop|product|toy|treat/.test(t)) return 'shop';
  if (/health|itch|scratch|sick|symptom|vomit|limp|worr/.test(t)) return 'health';
  return undefined;
}

const RECENT = [
  { icon: 'utensils' as IconName, label: 'Switching to a senior diet' },
  { icon: 'footprints' as IconName, label: 'Daily walk routine' },
];

const keyExtractor = (m: Msg) => m.id;

function TypingDots() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => (x + 1) % 3), 350);
    return () => clearInterval(t);
  }, []);
  return (
    <View className="flex-row items-center" style={{ gap: 5, height: 20 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#6b7390', opacity: n === i ? 1 : 0.35 }}
        />
      ))}
    </View>
  );
}

function CopilotAvatar({ size = 32 }: { size?: number }) {
  return (
    <LinearGradient
      colors={gradients.aurora}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name="sparkles" size={Math.round(size * 0.5)} color="#ffffff" />
    </LinearGradient>
  );
}

export function AiAssistantScreen() {
  const nav = useNavigation();
  const { theme } = useTheme();
  const user = useCurrentUser();
  const pet = usePet().data;
  const twin = useGetTwinSnapshotQuery({ petId: pet?.id ?? '' }, { skip: !pet });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);
  const seq = useRef(1);
  const abort = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => () => abort.current?.abort(), []);

  const petName = pet?.name ?? 'your pet';
  const firstName = user.name.split(' ')[0];
  const score = Math.round(twin.data?.risk.overall ?? pet?.healthScore ?? 0);
  const due = useMemo(
    () => [...(pet?.vaccinations ?? [])].filter((v) => v.status !== 'completed').sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0],
    [pet],
  );
  const dueDays = due ? Math.ceil((Date.parse(due.dueAt) - Date.now()) / 86_400_000) : null;
  const dueText =
    dueDays === null ? null : dueDays < 0 ? `${due!.name} is overdue` : dueDays === 0 ? `${due!.name} is due today` : `${due!.name} is due in ${dueDays} day${dueDays === 1 ? '' : 's'}`;
  const topFactor = twin.data ? [...twin.data.risk.factors].sort((a, b) => b.score - a.score)[0] : undefined;

  const suggestions = useMemo(
    () => [
      `Review ${petName}'s diet`,
      'Upcoming vaccinations',
      'Exercise recommendations',
      'Health concerns',
      'Training advice',
    ],
    [petName],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_LENGTH);
      if (!text || pending) return;
      const history = messagesRef.current.map((m) => ({ role: m.role, text: m.text }));
      setMessages((m) => [...m, { id: `m${seq.current++}`, role: 'user', text, at: Date.now() }]);
      setInput('');
      setFailed(null);
      setPending(true);
      const controller = new AbortController();
      abort.current = controller;
      try {
        const reply = await aiClient.send({ message: text, history, petId: pet?.id, signal: controller.signal });
        if (controller.signal.aborted) return;
        setMessages((m) => [
          ...m,
          { id: `m${seq.current++}`, role: 'assistant', text: reply.text, at: Date.now(), card: cardFor(text) },
        ]);
        AccessibilityInfo.announceForAccessibility(`Assistant: ${reply.text}`);
      } catch (e) {
        if (controller.signal.aborted) return;
        log.warn('send_failed', { reason: e instanceof Error ? e.message : 'unknown' });
        setFailed(text);
        AccessibilityInfo.announceForAccessibility('The assistant could not respond. Retry is available.');
      } finally {
        if (abort.current === controller) abort.current = null;
        setPending(false);
      }
    },
    [pending, pet?.id],
  );

  const goBack = () => {
    if (nav.canGoBack()) nav.goBack();
    else (nav as unknown as { navigate: (n: string) => void }).navigate('Dashboard');
  };
  const open = (screen: string, params?: object) => (nav as unknown as { navigate: (n: string, p?: object) => void }).navigate(screen, params);
  const openTab = (tab: string) => nav.getParent()?.navigate(tab as never);

  const newChat = () => {
    abort.current?.abort();
    setMessages([]);
    setFailed(null);
    setPending(false);
    setMenuOpen(false);
  };

  const cardView = (kind: CardKind) => {
    const spec: Record<CardKind, { icon: IconName; tone: 'primary' | 'success' | 'warning' | 'danger'; title: string; body: string; cta: string; go: () => void }> = {
      vaccine: {
        icon: 'syringe',
        tone: due ? (dueDays !== null && dueDays < 0 ? 'danger' : 'warning') : 'success',
        title: due ? due.name : 'Vaccinations up to date',
        body: dueText ?? `${petName} has no vaccines due.`,
        cta: 'View records',
        go: () => open('PetProfile', { petId: pet?.id }),
      },
      diet: {
        icon: 'utensils',
        tone: 'primary',
        title: `${petName}'s nutrition`,
        body: twin.data ? `Daily target ${Math.round(twin.data.nutrition.targetKcal)} kcal from the Digital Twin.` : 'See intake against target in the Digital Twin.',
        cta: 'Open Digital Twin',
        go: () => open('TwinDashboard', { petId: pet?.id }),
      },
      exercise: {
        icon: 'footprints',
        tone: 'success',
        title: 'Activity this week',
        body: twin.data
          ? `Averaging ${Math.round(twin.data.weeklySteps.reduce((a, b) => a + b, 0) / Math.max(1, twin.data.weeklySteps.length)).toLocaleString('en-IN')} steps a day.`
          : 'Check the activity trend in the Digital Twin.',
        cta: 'See activity',
        go: () => open('TwinDashboard', { petId: pet?.id }),
      },
      health: {
        icon: 'heart-pulse',
        tone: topFactor && topFactor.level !== 'low' ? 'warning' : 'success',
        title: `Health score ${score}`,
        body: topFactor ? `Top factor to watch: ${topFactor.label}.` : `${petName}'s latest health summary.`,
        cta: 'Open health summary',
        go: () => open('TwinDashboard', { petId: pet?.id }),
      },
      services: {
        icon: 'stethoscope',
        tone: 'primary',
        title: 'Vets, groomers and trainers',
        body: 'Verified providers near you, ready to book.',
        cta: 'Browse services',
        go: () => openTab('ServicesTab'),
      },
      shop: {
        icon: 'shop',
        tone: 'primary',
        title: `Picks for ${petName}`,
        body: 'Food, treats and toys matched to your pet.',
        cta: 'Open shop',
        go: () => openTab('ShopTab'),
      },
      passport: {
        icon: 'fingerprint',
        tone: 'success',
        title: `${petName}'s Passport`,
        body: 'Verified records and credentials in one place.',
        cta: 'Open passport',
        go: () => open('Passport', { petId: pet?.id }),
      },
    };
    return spec[kind];
  };

  const renderItem = useCallback(
    ({ item }: { item: Msg }) => {
      const mine = item.role === 'user';
      const card = item.card ? cardView(item.card) : null;
      return (
        <View style={{ gap: 4 }}>
          {mine ? (
            <View className="items-end">
              <View
                accessible
                accessibilityLabel={`You: ${item.text}`}
                className="max-w-[82%] bg-primary-700"
                style={{ borderRadius: 20, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 11 }}
              >
                <AppText style={{ color: '#ffffff' }}>{item.text}</AppText>
              </View>
              <AppText variant="caption" muted style={{ marginTop: 3, marginRight: 4 }}>
                {timeOf(item.at)}
              </AppText>
            </View>
          ) : (
            <View className="flex-row" style={{ gap: 10 }}>
              <CopilotAvatar />
              <View style={{ flex: 1, gap: 10 }}>
                <View
                  accessible
                  accessibilityLabel={`Copilot: ${item.text}`}
                  className="self-start bg-white dark:bg-surface-dark-2"
                  style={{ maxWidth: '92%', borderRadius: 20, borderTopLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12 }}
                >
                  <AppText style={{ lineHeight: 22 }}>{item.text}</AppText>
                </View>
                {card && (
                  <Pressable
                    onPress={card.go}
                    accessibilityRole="button"
                    accessibilityLabel={`${card.title}. ${card.cta}`}
                    className="bg-white dark:bg-surface-dark-2"
                    style={{ borderRadius: 20, padding: 14, maxWidth: '92%', borderWidth: 1, borderColor: 'rgba(107,115,144,0.18)' }}
                  >
                    <View className="flex-row items-center" style={{ gap: 12 }}>
                      <IconBadge name={card.icon} tone={card.tone} size={40} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="label">{card.title}</AppText>
                        <AppText variant="caption" muted>
                          {card.body}
                        </AppText>
                      </View>
                    </View>
                    <View className="flex-row items-center" style={{ marginTop: 10, gap: 2 }}>
                      <AppText variant="label" className="text-primary-600 dark:text-primary-300">
                        {card.cta}
                      </AppText>
                      <Icon name="chevron" size={14} color="#1865f5" />
                    </View>
                  </Pressable>
                )}
                <AppText variant="caption" muted style={{ marginLeft: 4 }}>
                  {timeOf(item.at)}
                </AppText>
              </View>
            </View>
          )}
        </View>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pet, twin.data, due, dueDays, score, topFactor],
  );

  const welcome = (
    <Reveal>
      <View style={{ gap: 18, paddingTop: 8 }}>
        <View className="flex-row" style={{ gap: 10 }}>
          <CopilotAvatar />
          <View
            className="bg-white dark:bg-surface-dark-2"
            style={{ flex: 1, borderRadius: 20, borderTopLeftRadius: 6, padding: 16, gap: 8 }}
          >
            <AppText variant="h3">
              {greeting()} {firstName}.
            </AppText>
            {pet && (
              <AppText style={{ lineHeight: 22 }}>
                {petName}'s health score is {score}.{dueText ? ` I noticed ${dueText}.` : ` All of ${petName}'s vaccinations are up to date.`}
              </AppText>
            )}
            <AppText style={{ lineHeight: 22 }}>How can I help?</AppText>
          </View>
        </View>

        {pet && (
          <View style={{ gap: 10 }}>
            <AppText variant="eyebrow" muted>
              {petName} today
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              <InsightTile icon="heart-pulse" tone="success" title={`Health score ${score}`} sub="Digital Twin" onPress={() => open('TwinDashboard', { petId: pet.id })} />
              {due && (
                <InsightTile
                  icon="syringe"
                  tone={dueDays !== null && dueDays < 0 ? 'danger' : 'warning'}
                  title={due.name}
                  sub={dueText ?? ''}
                  onPress={() => open('PetProfile', { petId: pet.id })}
                />
              )}
              {topFactor && topFactor.level !== 'low' && (
                <InsightTile icon="activity" tone="warning" title={topFactor.label} sub="Twin alert" onPress={() => open('TwinDashboard', { petId: pet.id })} />
              )}
              <InsightTile icon="fingerprint" tone="primary" title="Passport" sub="Records and credentials" onPress={() => open('Passport', { petId: pet.id })} />
            </ScrollView>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <AppText variant="eyebrow" muted>
            Recent conversations
          </AppText>
          {RECENT.map((r) => (
            <Pressable
              key={r.label}
              onPress={() => send(r.label)}
              accessibilityRole="button"
              accessibilityLabel={r.label}
              className="flex-row items-center bg-white dark:bg-surface-dark-2"
              style={{ gap: 12, borderRadius: 16, paddingHorizontal: 14, minHeight: 52 }}
            >
              <Icon name={r.icon} size={18} color="#6b7390" />
              <AppText style={{ flex: 1 }} numberOfLines={1}>
                {r.label}
              </AppText>
              <Icon name="chevron" size={16} color="#6b7390" />
            </Pressable>
          ))}
        </View>
      </View>
    </Reveal>
  );

  const canSend = input.trim().length > 0 && !pending;

  return (
    <SafeAreaView className="flex-1 bg-surface-light-2 dark:bg-surface-dark" edges={['top', 'bottom']}>
      <View
        className="flex-row items-center bg-white dark:bg-surface-dark-2"
        style={{ paddingHorizontal: 12, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(107,115,144,0.15)', zIndex: 5 }}
      >
        <View style={{ borderWidth: 1, borderColor: 'rgba(107,115,144,0.25)', borderRadius: 22 }}>
          <BackCircle onPress={goBack} />
        </View>
        <View>
          {pet ? (
            <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden' }}>
              <RemoteImage asset={petHeroAsset(pet.id, pet.name, pet.species === 'cat' ? 'cat' : 'dog')} fill />
            </View>
          ) : (
            <CopilotAvatar size={40} />
          )}
          <View
            style={{ position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: theme.colors.surface }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="h3" numberOfLines={1} accessibilityRole="header" style={{ fontSize: 16 }}>
            Pet Care Copilot
          </AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            {pet ? `Helping ${petName} today` : 'Connected to Pet OS'}
          </AppText>
          {pet && (
            <AppText variant="caption" numberOfLines={1} style={{ color: '#16a34a', fontWeight: '600' }}>
              Health Score {score}
            </AppText>
          )}
        </View>
        <Pressable
          onPress={() => setMenuOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityLabel="More actions"
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10"
        >
          <Icon name="dot" size={20} />
        </Pressable>
        {menuOpen && (
          <View
            className="bg-white dark:bg-surface-dark-2"
            style={{ position: 'absolute', right: 12, top: 62, borderRadius: 16, padding: 6, minWidth: 210, borderWidth: 1, borderColor: 'rgba(107,115,144,0.2)', zIndex: 20 }}
          >
            <MenuRow icon="compose" label="New conversation" onPress={newChat} />
            <MenuRow icon="heart-pulse" label={`${petName}'s health`} onPress={() => { setMenuOpen(false); open('TwinDashboard', { petId: pet?.id }); }} />
            <MenuRow icon="fingerprint" label="Passport" onPress={() => { setMenuOpen(false); open('Passport', { petId: pet?.id }); }} />
          </View>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 18, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setMenuOpen(false)}
        onContentSizeChange={() => messages.length > 0 && listRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={messages.length === 0 ? welcome : null}
        ListFooterComponent={
          <View style={{ gap: 10 }}>
            {pending && (
              <View className="flex-row" style={{ gap: 10 }} accessible accessibilityLabel="Copilot is typing" accessibilityLiveRegion="polite">
                <CopilotAvatar />
                <View className="bg-white dark:bg-surface-dark-2" style={{ borderRadius: 20, borderTopLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <TypingDots />
                </View>
              </View>
            )}
            {failed && !pending && (
              <View
                accessibilityLiveRegion="polite"
                style={{ borderRadius: 16, padding: 12, backgroundColor: 'rgba(239,68,68,0.1)', gap: 4 }}
              >
                <AppText variant="caption" className="text-red-700 dark:text-red-300">
                  Copilot could not respond.
                </AppText>
                <Pressable onPress={() => send(failed)} accessibilityRole="button" accessibilityLabel="Retry last message" className="min-h-[44px] justify-center">
                  <AppText variant="label" className="text-primary-700 dark:text-primary-300">
                    Try again
                  </AppText>
                </Pressable>
              </View>
            )}
          </View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
          style={{ flexGrow: 0 }}
        >
          {suggestions.map((s) => (
            <Pressable
              key={s}
              onPress={() => send(s)}
              disabled={pending}
              accessibilityRole="button"
              accessibilityLabel={s}
              accessibilityHint="Sends this question to the assistant"
              className="bg-white dark:bg-surface-dark-2"
              style={{ height: 36, borderRadius: 18, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(24,101,245,0.25)', opacity: pending ? 0.5 : 1 }}
            >
              <AppText variant="label" className="text-primary-700 dark:text-primary-300">
                {s}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
        <View className="flex-row items-end" style={{ paddingHorizontal: 12, paddingBottom: 10, gap: 8 }}>
          <View className="flex-1 flex-row items-end bg-white dark:bg-surface-dark-2" style={{ borderRadius: 26, borderWidth: 1, borderColor: 'rgba(107,115,144,0.22)', paddingLeft: 16, paddingRight: 6 }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={`Message about ${petName}`}
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel="Message"
              accessibilityHint="Type a question for the assistant"
              maxLength={MAX_LENGTH}
              multiline
              returnKeyType="send"
              blurOnSubmit
              className="max-h-32 min-h-[48px] flex-1 py-3 text-neutral-900 dark:text-white"
              style={Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : undefined}
              onSubmitEditing={() => send(input)}
            />
            <Pressable
              onPress={() => send(input)}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !canSend, busy: pending }}
              className="items-center justify-center rounded-full bg-primary-700"
              style={{ width: 36, height: 36, marginBottom: 6, marginLeft: 6, opacity: canSend ? 1 : 0.35 }}
            >
              <Icon name="arrow-up" size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>
        <AppText variant="caption" muted center style={{ paddingBottom: 6 }}>
          Copilot is not a substitute for a veterinarian.
        </AppText>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InsightTile({
  icon,
  tone,
  title,
  sub,
  onPress,
}: {
  icon: IconName;
  tone: 'primary' | 'success' | 'warning' | 'danger';
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}`}
      className="bg-white dark:bg-surface-dark-2"
      style={{ width: 176, minHeight: 112, borderRadius: 20, padding: 14, gap: 10, borderWidth: 1, borderColor: 'rgba(107,115,144,0.14)' }}
    >
      <IconBadge name={icon} tone={tone} size={36} />
      <View style={{ gap: 2 }}>
        <AppText variant="label" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" muted numberOfLines={2}>
          {sub}
        </AppText>
      </View>
    </Pressable>
  );
}

function MenuRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} className="flex-row items-center" style={{ gap: 12, minHeight: 44, paddingHorizontal: 12 }}>
      <Icon name={icon} size={18} />
      <AppText variant="label">{label}</AppText>
    </Pressable>
  );
}
