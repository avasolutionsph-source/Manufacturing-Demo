import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  UserCog,
  Building2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore, useUser } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import type { UserRole, Plant } from '@/types';

const plants: Plant[] = [
  { id: 'plant-001', name: 'Main Manufacturing Facility', code: 'MMF', location: 'Chicago, IL', timezone: 'America/Chicago' },
  { id: 'plant-002', name: 'West Coast Assembly', code: 'WCA', location: 'Los Angeles, CA', timezone: 'America/Los_Angeles' },
];

const roles: Array<{ value: UserRole; label: string }> = [
  { value: 'planner', label: 'Planner' },
  { value: 'shop_foreman', label: 'Shop Foreman' },
  { value: 'quality_inspector', label: 'Quality Inspector' },
  { value: 'admin', label: 'Admin' },
];

export function Header() {
  const navigate = useNavigate();
  const user = useUser();
  const { currentPlant, setCurrentPlant, switchRole, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPlantMenu, setShowPlantMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const currentPlantData = plants.find((p) => p.id === currentPlant);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-secondary-200">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Plant Selector */}
          <div className="relative">
            <button
              onClick={() => setShowPlantMenu(!showPlantMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary-50 transition-colors"
              aria-expanded={showPlantMenu}
              aria-haspopup="true"
            >
              <Building2 className="w-4 h-4 text-secondary-500" />
              <span className="hidden sm:inline text-sm font-medium text-secondary-700">
                {currentPlantData?.code || 'Select Plant'}
              </span>
              <ChevronDown className="w-4 h-4 text-secondary-400" />
            </button>

            {showPlantMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowPlantMenu(false)}
                />
                <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-secondary-200 z-20">
                  <div className="p-2">
                    <p className="px-3 py-1 text-xs font-medium text-secondary-500 uppercase">
                      Select Plant
                    </p>
                    {plants.map((plant) => (
                      <button
                        key={plant.id}
                        onClick={() => {
                          setCurrentPlant(plant.id);
                          setShowPlantMenu(false);
                        }}
                        className={clsx(
                          'w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors',
                          currentPlant === plant.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-secondary-50'
                        )}
                      >
                        <div>
                          <p className="font-medium text-sm">{plant.name}</p>
                          <p className="text-xs text-secondary-500">{plant.location}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Role Switcher (Demo) */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary-50 transition-colors"
              aria-expanded={showRoleMenu}
              aria-haspopup="true"
            >
              <UserCog className="w-4 h-4 text-secondary-500" />
              <span className="text-sm text-secondary-600">
                {roles.find((r) => r.value === user?.role)?.label || 'Role'}
              </span>
              <ChevronDown className="w-4 h-4 text-secondary-400" />
            </button>

            {showRoleMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 z-20">
                  <div className="p-2">
                    <p className="px-3 py-1 text-xs font-medium text-secondary-500 uppercase">
                      Switch Role (Demo)
                    </p>
                    {roles.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => {
                          switchRole(role.value);
                          setShowRoleMenu(false);
                        }}
                        className={clsx(
                          'w-full px-3 py-2 rounded-md text-left text-sm transition-colors',
                          user?.role === role.value
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-secondary-50'
                        )}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
          </Button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary-50 transition-colors"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <span className="hidden sm:inline text-sm font-medium text-secondary-700">
                {user?.name || 'User'}
              </span>
              <ChevronDown className="w-4 h-4 text-secondary-400" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 z-20">
                  <div className="p-3 border-b border-secondary-100">
                    <p className="font-medium text-secondary-900">{user?.name}</p>
                    <p className="text-sm text-secondary-500">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm hover:bg-secondary-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-secondary-500" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
