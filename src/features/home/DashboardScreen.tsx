import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import type { Pet } from '@apptypes/domain';
import type { HomeStackParamList } from '@navigation/types';
import { EmptyState, FloatingActionButton, Icon, AppText } from '@components/ui';
import { Reveal } from '@components/premium';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { useCurrentUser, usePet, usePets } from '@services/data';
import { useGetPassportQuery, useGetTwinSnapshotQuery } from '@services/api/platformApi';
import { useFeatureFlags } from '@platform/config/featureFlags';
import { approveAction, rejectAction } from '@features/agent/agentThunks';
import { selectPendingActions } from '@features/agent/agentSelectors';
import { selectUnreadCount } from '@features/notifications/notificationsSlice';
import { PetHero, SHEET_OVERLAP } from './components/PetHero';
import { QuickAction } from './components/DashboardWidgets';
import { WIDGETS, WidgetContext } from './widgets/registry';
import { loadDashboardLayout, selectDashboardHidden, selectDashboardOrder } from './dashboardSlice';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>;

const QUICK_ACTIONS = [
  { icon: 'stethoscope', label: 'Vet', hint: 'Find and book a vet', tint: '#1865f5', tab: 'ServicesTab' },
  { icon: 'scissors', label: 'Grooming', hint: 'Book grooming', tint: '#8b5cf6', tab: 'ServicesTab' },
  { icon: 'package', label: 'Shop', hint: 'Browse products', tint: '#f59e0b', tab: 'ShopTab' },
  { icon: 'footprints', label: 'Walks', hint: 'Book a walker', tint: '#10b981', tab: 'ServicesTab' },
] as const;

export function DashboardScreen() {
  const pets = usePets().data;
  const [petId, setPetId] = useState<string | undefined>(pets[0]?.id);
  const pet = usePet(petId).data;
  if (!pet) {
    return (
      <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
        <EmptyState title="No pets yet" description="Add a pet to see health, passport and agent insights." />
      </View>
    );
  }
  return <DashboardContent activePet={pet} pets={pets} onSelectPet={setPetId} />;
}

function DashboardContent({
  activePet,
  pets,
  onSelectPet,
}: {
  activePet: Pet;
  pets: Pet[];
  onSelectPet: (id: string) => void;
}) {
  const nav = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const user = useCurrentUser();
  const allPending = useAppSelector(selectPendingActions);
  const unread = useAppSelector(selectUnreadCount);
  const order = useAppSelector(selectDashboardOrder);
  const hidden = useAppSelector(selectDashboardHidden);
  const { flags } = useFeatureFlags();
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const petId = activePet.id;
  const vaccinesDue = activePet.vaccinations.filter((v) => v.status !== 'completed');
  const overdue = vaccinesDue.some((v) => v.status === 'overdue');
  const twin = useGetTwinSnapshotQuery({ petId });
  const passport = useGetPassportQuery({ petId });

  useEffect(() => {
    dispatch(loadDashboardLayout());
  }, [dispatch]);

  const { refetch: refetchTwin } = twin;
  const { refetch: refetchPassport } = passport;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([refetchTwin(), refetchPassport()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchTwin, refetchPassport]);

  const goTab = useCallback(
    (tab: string) => {
      nav.getParent()?.navigate(tab as never);
    },
    [nav],
  );

  const twinData = twin.data;
  const twinLoading = twin.isLoading;
  const twinError = twin.isError;
  const passportData = passport.data;
  const ctx = useMemo<WidgetContext>(
    () => ({
      nav,
      pet: activePet,
      user,
      pending: allPending.filter((a) => a.petId === petId),
      twin: { data: twinData, isLoading: twinLoading, isError: twinError, refetch: refetchTwin },
      passport: { data: passportData },
      onApprove: (id) => dispatch(approveAction(id)),
      onReject: (id) => dispatch(rejectAction(id)),
    }),
    [nav, activePet, user, allPending, petId, twinData, twinLoading, twinError, refetchTwin, passportData, dispatch],
  );

  const visible = order.filter((id) => !hidden.includes(id) && (!WIDGETS[id].flag || flags[WIDGETS[id].flag!]));
  const healthScore = twinData?.risk.overall ?? activePet.healthScore;
  const nextDue = [...vaccinesDue].sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  const vaccineLabel = !nextDue
    ? 'Vaccines up to date'
    : `${nextDue.name} ${nextDue.status === 'overdue' ? 'overdue' : 'due soon'}`;

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      >
        <PetHero
          pet={activePet}
          pets={pets}
          firstName={user.name.split(' ')[0]}
          scrollY={scrollY}
          healthScore={healthScore}
          vaccineLabel={vaccineLabel}
          vaccineTone={!nextDue ? 'success' : overdue ? 'danger' : 'warning'}
          unread={unread}
          showLayout
          showBell
          onSelectPet={onSelectPet}
          onOpenProfile={() => nav.navigate('PetProfile', { petId })}
          onOpenLayout={() => nav.navigate('DashboardLayout')}
          onOpenNotifications={() => nav.navigate('Notifications')}
        />

        <View
          className="bg-surface-light-2 dark:bg-surface-dark"
          style={{ marginTop: -SHEET_OVERLAP, borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingTop: 22, gap: 28 }}
        >
          <View className="flex-row px-5" style={{ gap: 8 }}>
            {QUICK_ACTIONS.map((a) => (
              <QuickAction key={a.label} icon={a.icon} label={a.label} hint={a.hint} tint={a.tint} onPress={() => goTab(a.tab)} />
            ))}
          </View>

          <Pressable
            onPress={() => nav.navigate('Hub')}
            accessibilityRole="button"
            accessibilityLabel="Open the Pet services hub"
            className="mx-5 flex-row items-center rounded-3xl bg-neutral-900 px-5"
            style={{ minHeight: 64, gap: 12 }}
          >
            <Icon name="layout" size={22} color="#ffffff" />
            <View style={{ flex: 1 }}>
              <AppText variant="label" style={{ color: '#fff' }}>Pet services hub</AppText>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>All 65 food, care, community and growth services</AppText>
            </View>
            <Icon name="chevron" size={18} color="#ffffff" />
          </Pressable>

          {visible.map((id, i) => {
            const W = WIDGETS[id].Component;
            return (
              <Reveal key={`${petId}-${id}`} index={i}>
                <W ctx={ctx} />
              </Reveal>
            );
          })}
        </View>
      </Animated.ScrollView>

      <FloatingActionButton
        icon={<Icon name="sparkles" size={26} color="#ffffff" />}
        accessibilityLabel="Ask Pet AI"
        accessibilityHint="Opens the AI assistant"
        onPress={() => nav.navigate('AiAssistant')}
      />
    </View>
  );
}
