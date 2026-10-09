import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';

interface StateViewProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Shared empty / error / offline state presentation. */
export function StateView({ icon, title, description, actionLabel, onAction }: StateViewProps) {
  return (
    <View className="flex-1 items-center justify-center px-8" style={{ gap: 12 }}>
      {icon && (
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-500/15">
          {icon}
        </View>
      )}
      <AppText variant="h3" center>
        {title}
      </AppText>
      {description && (
        <AppText variant="body" muted center>
          {description}
        </AppText>
      )}
      {actionLabel && onAction && (
        <View className="mt-2">
          <Button label={actionLabel} onPress={onAction} variant="primary" />
        </View>
      )}
    </View>
  );
}

export const EmptyState = (props: Omit<StateViewProps, 'icon'> & { icon?: React.ReactNode }) => (
  <StateView {...props} />
);

export const ErrorState = ({
  onRetry,
  message = 'Something went wrong',
}: {
  onRetry?: () => void;
  message?: string;
}) => (
  <StateView
    title="Oops!"
    description={message}
    actionLabel={onRetry ? 'Try again' : undefined}
    onAction={onRetry}
  />
);

export const OfflineState = ({ onRetry }: { onRetry?: () => void }) => (
  <StateView
    title="You're offline"
    description="Check your connection. Your cart and data are safely saved."
    actionLabel={onRetry ? 'Retry' : undefined}
    onAction={onRetry}
  />
);
