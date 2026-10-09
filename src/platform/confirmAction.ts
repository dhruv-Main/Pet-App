import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Cross-platform confirm dialog. react-native-web's Alert.alert is a no-op, so on web
 * buttons inside it never fire; use the browser confirm there.
 */
export function confirmAction({ title, message, confirmLabel, cancelLabel = 'Cancel', destructive, onConfirm }: ConfirmOptions) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
