import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentPlant: string;

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  setCurrentPlant: (plantId: string) => void;
  switchRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      currentPlant: 'plant-001',

      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          currentPlant: user.plant,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      setCurrentPlant: (plantId) =>
        set({
          currentPlant: plantId,
        }),

      switchRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        })),
    }),
    {
      name: 'manufacturing-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentPlant: state.currentPlant,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useCurrentRole = () => useAuthStore((state) => state.user?.role);
export const useCurrentPlant = () => useAuthStore((state) => state.currentPlant);
