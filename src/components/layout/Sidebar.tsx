import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ClipboardList,
  Factory,
  ShieldCheck,
  Settings,
  ChevronLeft,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { useCurrentRole } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/products', label: 'Products & BOM', icon: Boxes },
  { path: '/work-orders', label: 'Work Orders', icon: ClipboardList },
  { path: '/shop-floor', label: 'Shop Floor', icon: Factory, roles: ['shop_foreman', 'admin'] },
  { path: '/quality', label: 'Quality', icon: ShieldCheck, roles: ['quality_inspector', 'admin'] },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const currentRole = useCurrentRole();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleSidebarCollapsed } = useUIStore();

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(currentRole || '') || currentRole === 'admin' || currentRole === 'planner'
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200">
        <NavLink to="/dashboard" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Manufacturing Demo" className="h-8" />
          {!sidebarCollapsed && (
            <span className="text-lg font-semibold text-secondary-900 hidden lg:block">
              Manufacturing
            </span>
          )}
        </NavLink>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Main navigation">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse button (desktop only) */}
      <div className="hidden lg:block p-3 border-t border-secondary-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebarCollapsed}
          className="w-full justify-center"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={clsx('w-5 h-5 transition-transform', sidebarCollapsed && 'rotate-180')}
          />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-secondary-200 transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
