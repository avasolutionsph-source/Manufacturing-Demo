import { useNotificationStore } from '@/stores/uiStore';

// Hook for easy notification usage
export function useNotification() {
  const addNotification = useNotificationStore((state) => state.addNotification);

  return {
    success: (title: string, message?: string) =>
      addNotification({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
      addNotification({ type: 'error', title, message }),
    warning: (title: string, message?: string) =>
      addNotification({ type: 'warning', title, message }),
    info: (title: string, message?: string) =>
      addNotification({ type: 'info', title, message }),
  };
}
