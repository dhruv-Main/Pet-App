import React from 'react';
import { View } from 'react-native';
import { crash } from '@platform/observability';
import { AppText } from '@components/ui/AppText';
import { Button } from '@components/ui/Button';

interface Props {
  children: React.ReactNode;
  /** `screen` shows a full page recovery state; `section` renders a compact inline card. */
  level?: 'screen' | 'section';
  name?: string;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    crash.captureException(error, {
      boundary: this.props.name ?? this.props.level ?? 'screen',
      componentStack: info.componentStack ?? undefined,
    });
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.level === 'section') {
      return (
        <View
          accessibilityRole="alert"
          className="rounded-2xl bg-white p-4 dark:bg-surface-dark-2"
          style={{ gap: 8 }}
        >
          <AppText variant="label">This section could not be displayed</AppText>
          <Button label="Retry" size="sm" variant="secondary" onPress={this.reset} />
        </View>
      );
    }
    return (
      <View
        accessibilityRole="alert"
        className="flex-1 items-center justify-center bg-surface-light p-8 dark:bg-surface-dark"
        style={{ gap: 12 }}
      >
        <AppText variant="h2" center>
          Something went wrong
        </AppText>
        <AppText muted center>
          The issue has been reported. You can try again.
        </AppText>
        <Button label="Try again" onPress={this.reset} />
      </View>
    );
  }
}
