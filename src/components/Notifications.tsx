import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotificationStore, NotificationType } from '@/stores/uiStore';

const icons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<NotificationType, string> = {
  success: 'bg-success-50 border-success-200 text-success-800',
  error: 'bg-danger-50 border-danger-200 text-danger-800',
  warning: 'bg-warning-50 border-warning-200 text-warning-800',
  info: 'bg-primary-50 border-primary-200 text-primary-800',
};

const iconStyles: Record<NotificationType, string> = {
  success: 'text-success-500',
  error: 'text-danger-500',
  warning: 'text-warning-500',
  info: 'text-primary-500',
};

export function Notifications() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          const Icon = icons[notification.type];

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={clsx(
                'flex items-start gap-3 p-4 rounded-lg border shadow-lg pointer-events-auto',
                styles[notification.type]
              )}
              role="alert"
            >
              <Icon className={clsx('w-5 h-5 shrink-0 mt-0.5', iconStyles[notification.type])} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{notification.title}</p>
                {notification.message && (
                  <p className="text-sm opacity-90 mt-0.5">{notification.message}</p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
