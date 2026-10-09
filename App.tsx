import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from '@store/store';
import { ThemeProvider } from '@theme/ThemeProvider';
import { RootNavigator } from '@navigation/RootNavigator';
import { ErrorBoundary } from '@platform/ErrorBoundary';
import { FeatureFlagProvider } from '@platform/config/featureFlags';
import { startObservability } from '@platform/observability';
import './global.css';

startObservability();

export default function App() {
  return (
    <ErrorBoundary level="screen" name="app">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <FeatureFlagProvider>
            <ThemeProvider>
              <SafeAreaProvider>
                <StatusBar style="auto" />
                <RootNavigator />
              </SafeAreaProvider>
            </ThemeProvider>
          </FeatureFlagProvider>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
