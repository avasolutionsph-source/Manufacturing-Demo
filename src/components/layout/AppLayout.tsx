import { Outlet, Navigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useIsAuthenticated } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Notifications } from '@/components/Notifications';

export function AppLayout() {
  const isAuthenticated = useIsAuthenticated();
  const { sidebarCollapsed } = useUIStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Sidebar />

      <div
        className={clsx(
          'flex flex-col min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <Header />

        <main id="main-content" className="flex-1 p-4 md:p-6" tabIndex={-1}>
          <Outlet />
        </main>

        <footer className="py-4 px-6 text-center text-sm text-secondary-500 border-t border-secondary-200 bg-white">
          <p>Manufacturing Demo - Frontend Demo Application</p>
        </footer>
      </div>

      <Notifications />
    </div>
  );
}
