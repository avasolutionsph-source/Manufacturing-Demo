import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

// Notification store for toast messages
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = { ...notification, id };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto remove after duration (default 5 seconds)
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));

// Shop floor specific store
interface ShopFloorState {
  currentOperator: { id: string; name: string } | null;
  clockedIn: boolean;
  currentWorkCenter: string | null;
  activeWorkOrder: string | null;

  clockIn: (operatorId: string, operatorName: string, workCenter?: string) => void;
  clockOut: () => void;
  setActiveWorkOrder: (workOrderId: string | null) => void;
}

export const useShopFloorStore = create<ShopFloorState>((set) => ({
  currentOperator: null,
  clockedIn: false,
  currentWorkCenter: null,
  activeWorkOrder: null,

  clockIn: (operatorId, operatorName, workCenter) =>
    set({
      currentOperator: { id: operatorId, name: operatorName },
      clockedIn: true,
      currentWorkCenter: workCenter || null,
    }),

  clockOut: () =>
    set({
      currentOperator: null,
      clockedIn: false,
      currentWorkCenter: null,
      activeWorkOrder: null,
    }),

  setActiveWorkOrder: (workOrderId) =>
    set({ activeWorkOrder: workOrderId }),
}));
