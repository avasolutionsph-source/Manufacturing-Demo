import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Plug,
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Activity,
  Loader2,
  AlertCircle,
  CheckCircle,
  Cpu,
  Gauge,
} from 'lucide-react';
import { parseISO, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { machinesApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import type { Integration, MachineStatus } from '@/types';

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  online: Wifi,
  connected: CheckCircle,
  offline: WifiOff,
  disconnected: AlertCircle,
  error: AlertCircle,
  maintenance: Settings,
};

const statusColors: Record<string, string> = {
  online: 'text-success-500',
  connected: 'text-success-500',
  offline: 'text-secondary-400',
  disconnected: 'text-secondary-400',
  error: 'text-danger-500',
  maintenance: 'text-warning-500',
};

export function SettingsPage() {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const [activeTab, setActiveTab] = useState<'machines' | 'integrations'>('integrations');

  // Queries
  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: machinesApi.getMachines,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: machinesApi.getIntegrations,
  });

  // Toggle integration mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      machinesApi.updateIntegration(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      notification.success('Integration Updated', 'Connection status has been updated.');
    },
    onError: () => {
      notification.error('Update Failed', 'Could not update integration status.');
    },
  });

  const handleToggleIntegration = (integration: Integration) => {
    const newStatus = integration.status === 'connected' ? 'disconnected' : 'connected';
    toggleMutation.mutate({ id: integration.id, status: newStatus });
  };

  const tabs = [
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'machines', label: 'Machines', icon: Cpu },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Settings & Integrations</h1>
          <p className="text-secondary-500">Manage connections and machine telemetry</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex gap-6" aria-label="Settings tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={clsx(
                  'flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Integrations tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Connector Status</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['integrations'] })}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>

          {integrationsLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
            </div>
          ) : integrations && integrations.length > 0 ? (
            <div className="grid gap-4">
              {integrations.map((integration) => {
                const StatusIcon = statusIcons[integration.status] || AlertCircle;
                return (
                  <div
                    key={integration.id}
                    className="bg-white rounded-xl border border-secondary-200 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={clsx(
                            'w-12 h-12 rounded-lg flex items-center justify-center',
                            integration.status === 'connected'
                              ? 'bg-success-100'
                              : integration.status === 'error'
                              ? 'bg-danger-100'
                              : 'bg-secondary-100'
                          )}
                        >
                          {integration.type === 'opc_ua' && <Server className="w-6 h-6 text-secondary-600" />}
                          {integration.type === 'mqtt' && <Activity className="w-6 h-6 text-secondary-600" />}
                          {integration.type === 'rest_api' && <Plug className="w-6 h-6 text-secondary-600" />}
                          {integration.type === 'database' && <Server className="w-6 h-6 text-secondary-600" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-secondary-900">{integration.name}</h3>
                          <p className="text-sm text-secondary-500 font-mono">{integration.endpoint}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1">
                              <StatusIcon className={clsx('w-4 h-4', statusColors[integration.status])} />
                              <span className="capitalize">{integration.status}</span>
                            </div>
                            {integration.lastSync && (
                              <span className="text-secondary-400">
                                Last sync: {formatDistanceToNow(parseISO(integration.lastSync), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={integration.status === 'connected' ? 'danger' : 'success'}
                        size="sm"
                        onClick={() => handleToggleIntegration(integration)}
                        isLoading={toggleMutation.isPending}
                      >
                        {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>

                    {/* Connection details */}
                    <div className="mt-4 pt-4 border-t border-secondary-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-secondary-500">Type</span>
                          <p className="font-medium uppercase">{integration.type.replace('_', '-')}</p>
                        </div>
                        {integration.config && Object.entries(integration.config).slice(0, 3).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-secondary-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <p className="font-medium truncate">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-secondary-200 p-8 text-center">
              <Plug className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900">No Integrations Configured</h3>
              <p className="text-secondary-500">Add integrations to connect to external systems</p>
            </div>
          )}

          {/* Integration info */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h3 className="font-medium text-primary-900 mb-2">About Integrations</h3>
            <p className="text-sm text-primary-700">
              This demo simulates OPC-UA and MQTT connectors for receiving machine telemetry.
              Toggle the connections to simulate enabling/disabling machine data feeds.
              In a production environment, these would connect to actual industrial protocols.
            </p>
          </div>
        </div>
      )}

      {/* Machines tab */}
      {activeTab === 'machines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Machine Status</h2>
            <div className="flex items-center gap-2 text-sm text-secondary-500">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
              Live updates every 10s
            </div>
          </div>

          {machinesLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
            </div>
          ) : machines && machines.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {machines.map((machine) => {
                return (
                  <div
                    key={machine.id}
                    className="bg-white rounded-xl border border-secondary-200 p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-secondary-900">{machine.name}</h3>
                        <p className="text-sm text-secondary-500">{machine.type}</p>
                      </div>
                      <StatusBadge status={machine.status as MachineStatus} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-secondary-50 rounded-lg text-center">
                        <Gauge className="w-5 h-5 text-secondary-400 mx-auto mb-1" />
                        <p className="text-xl font-bold text-secondary-900">{machine.oee}%</p>
                        <p className="text-xs text-secondary-500">OEE</p>
                      </div>
                      <div className="p-3 bg-secondary-50 rounded-lg text-center">
                        <Activity className="w-5 h-5 text-secondary-400 mx-auto mb-1" />
                        <p className="text-xl font-bold text-secondary-900">
                          {machine.cycleTime || '-'}s
                        </p>
                        <p className="text-xs text-secondary-500">Cycle Time</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-secondary-500">Location</span>
                        <span className="text-secondary-900">{machine.location}</span>
                      </div>
                      {machine.currentJob && (
                        <div className="flex justify-between">
                          <span className="text-secondary-500">Current Job</span>
                          <span className="text-primary-600">{machine.currentJob}</span>
                        </div>
                      )}
                      {machine.partCount !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-secondary-500">Part Count</span>
                          <span className="text-secondary-900">{machine.partCount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-secondary-500">Last Heartbeat</span>
                        <span className="text-secondary-900">
                          {formatDistanceToNow(parseISO(machine.lastHeartbeat), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-secondary-200 p-8 text-center">
              <Cpu className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900">No Machines Found</h3>
              <p className="text-secondary-500">Connect machines to see their status</p>
            </div>
          )}

          {/* Telemetry info */}
          <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
            <h3 className="font-medium text-secondary-900 mb-2">Machine Telemetry</h3>
            <p className="text-sm text-secondary-600">
              Machine data is simulated for this demo. In production, this would display real-time
              data from OPC-UA servers, MQTT brokers, or other industrial protocols. The status
              updates automatically to simulate live machine monitoring.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
