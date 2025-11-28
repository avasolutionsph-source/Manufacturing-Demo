import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Gauge,
  Truck,
  RotateCcw,
  ClipboardList,
  AlertTriangle,
  PlayCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { KpiCard } from '@/components/KpiCard';
import { ProductionChart } from '@/components/Chart';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { dashboardApi, planningApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import type { WorkOrderStatus, NCRStatus, MRPResult } from '@/types';

export function DashboardPage() {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const [showMrpModal, setShowMrpModal] = useState(false);
  const [mrpResult, setMrpResult] = useState<MRPResult | null>(null);

  // Queries
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardApi.getKpis,
  });

  const { data: productionData, isLoading: productionLoading } = useQuery({
    queryKey: ['dashboard', 'production'],
    queryFn: () => dashboardApi.getProductionData(7),
  });

  const { data: recentWorkOrders, isLoading: workOrdersLoading } = useQuery({
    queryKey: ['dashboard', 'recent-workorders'],
    queryFn: dashboardApi.getRecentWorkOrders,
  });

  const { data: recentNCRs, isLoading: ncrsLoading } = useQuery({
    queryKey: ['dashboard', 'recent-ncrs'],
    queryFn: dashboardApi.getRecentNCRs,
  });

  // MRP Mutation
  const mrpMutation = useMutation({
    mutationFn: planningApi.runMRP,
    onSuccess: (data) => {
      setMrpResult(data);
      setShowMrpModal(true);
      notification.success('MRP Run Complete', 'Planning suggestions have been generated.');
      queryClient.invalidateQueries({ queryKey: ['workorders'] });
    },
    onError: () => {
      notification.error('MRP Failed', 'Could not complete MRP run. Please try again.');
    },
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-500">Overview of manufacturing operations</p>
        </div>
        <Button
          onClick={() => mrpMutation.mutate()}
          isLoading={mrpMutation.isPending}
          leftIcon={<PlayCircle className="w-4 h-4" />}
        >
          Run MRP
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="OEE"
          value={kpis?.oee ?? 0}
          unit="%"
          icon={<Gauge className="w-5 h-5" />}
          color={
            (kpis?.oee ?? 0) >= 85 ? 'success' : (kpis?.oee ?? 0) >= 70 ? 'warning' : 'danger'
          }
          trend={{ value: 2.3, isPositive: true }}
          isLoading={kpisLoading}
        />
        <KpiCard
          title="On-Time Delivery"
          value={kpis?.onTimeDelivery ?? 0}
          unit="%"
          icon={<Truck className="w-5 h-5" />}
          color="success"
          trend={{ value: 1.1, isPositive: true }}
          isLoading={kpisLoading}
        />
        <KpiCard
          title="Inventory Turns"
          value={kpis?.inventoryTurns ?? 0}
          icon={<RotateCcw className="w-5 h-5" />}
          color="primary"
          trend={{ value: 0.5, isPositive: true }}
          isLoading={kpisLoading}
        />
        <KpiCard
          title="Open Work Orders"
          value={kpis?.openWorkOrders ?? 0}
          icon={<ClipboardList className="w-5 h-5" />}
          color="secondary"
          isLoading={kpisLoading}
        />
      </div>

      {/* Charts and lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Chart */}
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Production Output</h2>
            <span className="text-sm text-secondary-500">Last 7 days</span>
          </div>
          <ProductionChart data={productionData || []} height={250} isLoading={productionLoading} />
        </div>

        {/* Recent Work Orders */}
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Recent Work Orders</h2>
            <Link
              to="/work-orders"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {workOrdersLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkOrders?.slice(0, 5).map((wo) => (
                <Link
                  key={wo.id}
                  to={`/work-orders/${wo.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-secondary-900 group-hover:text-primary-600 truncate">
                      {wo.workOrderNumber}
                    </p>
                    <p className="text-sm text-secondary-500 truncate">{wo.productName}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-secondary-500">{wo.qty} units</span>
                    <StatusBadge status={wo.status as WorkOrderStatus} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent NCRs */}
        <div className="bg-white rounded-xl border border-secondary-200 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-500" />
              <h2 className="text-lg font-semibold text-secondary-900">Quality Alerts</h2>
            </div>
            <Link
              to="/quality"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {ncrsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
            </div>
          ) : recentNCRs && recentNCRs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentNCRs.slice(0, 3).map((ncr) => (
                <Link
                  key={ncr.id}
                  to={`/quality?ncr=${ncr.id}`}
                  className="p-4 rounded-lg border border-secondary-200 hover:border-primary-200 hover:bg-primary-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs text-secondary-500">{ncr.ncrNumber}</span>
                    <StatusBadge status={ncr.status as NCRStatus} />
                  </div>
                  <p className="font-medium text-secondary-900 text-sm line-clamp-2">{ncr.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        ncr.severity === 'critical'
                          ? 'bg-danger-100 text-danger-700'
                          : ncr.severity === 'major'
                          ? 'bg-warning-100 text-warning-700'
                          : 'bg-secondary-100 text-secondary-700'
                      }`}
                    >
                      {ncr.severity}
                    </span>
                    <span className="text-xs text-secondary-500">
                      {format(parseISO(ncr.reportedAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-secondary-500 py-8">No quality alerts</p>
          )}
        </div>
      </div>

      {/* MRP Result Modal */}
      <Modal
        isOpen={showMrpModal}
        onClose={() => setShowMrpModal(false)}
        title="MRP Run Results"
        size="lg"
      >
        {mrpResult && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-3">Planned Work Orders</h3>
              {mrpResult.plannedOrders.length > 0 ? (
                <div className="space-y-2">
                  {mrpResult.plannedOrders.map((order, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-secondary-900">{order.productName}</p>
                        <p className="text-sm text-secondary-500">{order.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-secondary-900">{order.qty} units</p>
                        <p className="text-sm text-secondary-500">
                          Due: {format(parseISO(order.dueDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary-500">No planned orders needed</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-3">Suggested Purchases</h3>
              {mrpResult.suggestedPurchases.length > 0 ? (
                <div className="space-y-2">
                  {mrpResult.suggestedPurchases.map((purchase, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-primary-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-secondary-900">{purchase.itemName}</p>
                        <p className="text-sm text-secondary-500">
                          {purchase.supplier || 'No preferred supplier'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-secondary-900">{purchase.qty} units</p>
                        <p className="text-sm text-secondary-500">
                          By: {format(parseISO(purchase.suggestedDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary-500">No purchases needed</p>
              )}
            </div>

            <div className="pt-4 border-t border-secondary-200 flex justify-end">
              <Button onClick={() => setShowMrpModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
