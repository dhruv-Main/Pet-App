import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useAppSelector } from '@store/hooks';
import { usePets } from '@services/data';
import type { HubFeature } from './hubData';

/** Cross-tab navigation for hub features. Works from any screen inside the tab navigator. */
export function useHubNav() {
  const nav = useNavigation<NavigationProp<ParamListBase>>();
  const activePetId = useAppSelector((s) => s.ui.activePetId);
  const pets = usePets().data;

  const tab = useCallback(
    () => {
      let n: NavigationProp<ParamListBase> | undefined = nav;
      // Walk up to the navigator that owns the tab routes.
      while (n && !n.getState().routeNames.includes('HomeTab')) n = n.getParent();
      return n ?? nav;
    },
    [nav],
  );

  const openHub = useCallback(() => tab().navigate('HomeTab', { screen: 'Hub' }), [tab]);
  const openActivity = useCallback(() => tab().navigate('HomeTab', { screen: 'HubActivity' }), [tab]);
  const openList = useCallback((listing: string) => tab().navigate('HomeTab', { screen: 'HubList', params: { listing } }), [tab]);
  const openTool = useCallback((toolKey: string) => tab().navigate('HomeTab', { screen: 'HubTool', params: { tool: toolKey } }), [tab]);
  const openCollection = useCallback((collection: string) => tab().navigate('ShopTab', { screen: 'Catalog', params: { collection } }), [tab]);
  const openService = useCallback((category: string) => tab().navigate('ServicesTab', { screen: 'ServicesHome', params: { category } }), [tab]);

  const openFeature = useCallback(
    (f: HubFeature) => {
      switch (f.mode) {
        case 'shop':
          return openCollection(f.target);
        case 'service':
          return openService(f.target);
        case 'listing':
          return openList(f.target);
        case 'tool':
          return openTool(f.target);
        default:
          if (f.target === 'Community') return tab().navigate('CommunityTab', { screen: 'Feed' });
          if (f.target === 'AiAssistant') return tab().navigate('HomeTab', { screen: 'AiAssistant' });
          return tab().navigate('HomeTab', { screen: 'PetProfile', params: { petId: activePetId ?? pets[0]?.id ?? 'p1' } });
      }
    },
    [openCollection, openService, openList, openTool, tab, activePetId, pets],
  );

  return { openHub, openActivity, openList, openTool, openCollection, openService, openFeature };
}
