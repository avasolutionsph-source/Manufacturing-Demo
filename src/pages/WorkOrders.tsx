import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  ClipboardList,
  Loader2,
  Calendar,
  Play,
  CheckCircle,
  XCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/Table';
import { WorkOrderForm, WorkOrderFormData } from '@/components/WorkOrderForm';
import { workOrdersApi, productsApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import type { WorkOrder, WorkOrderStatus, ProductBOM } from '@/types';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'created', label: 'Created' },
  { value: 'released', label: 'Released' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const priorityColors = {
  urgent: 'bg-danger-100 text-danger-700 border-danger-200',
  high: 'bg-warning-100 text-warning-700 border-warning-200',
  medium: 'bg-primary-100 text-primary-700 border-primary-200',
  low: 'bg-secondary-100 text-secondary-700 border-secondary-200',
};

export function WorkOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const notification = useNotification();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [confirmAction, setConfirmAction] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  // Queries
  const { data: workOrders, isLoading } = useQuery({
    queryKey: ['workorders', statusFilter, priorityFilter],
    queryFn: () =>
      workOrdersApi.getWorkOrders({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      }),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: workOrdersApi.createWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workorders'] });
      setShowCreateModal(false);
      notification.success('Work Order Created', 'New work order has been created successfully.');
    },
    onError: () => {
      notification.error('Creation Failed', 'Could not create work order. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkOrder> }) =>
      workOrdersApi.updateWorkOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workorders'] });
      notification.success('Work Order Updated', 'Status has been updated successfully.');
    },
    onError: () => {
      notification.error('Update Failed', 'Could not update work order. Please try again.');
    },
  });

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') {
      setStatusFilter(value);
    } else if (key === 'priority') {
      setPriorityFilter(value);
    }

    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  // Handle work order creation
  const handleCreate = (data: WorkOrderFormData) => {
    createMutation.mutate(data);
  };

  // Get BOM versions for a product
  const getBomVersions = async (productId: string): Promise<ProductBOM | null> => {
    try {
      return await productsApi.getBom(productId);
    } catch {
      return null;
    }
  };

  // Handle status change
  const handleStatusChange = (workOrder: WorkOrder, newStatus: WorkOrderStatus) => {
    const statusLabels: Record<WorkOrderStatus, string> = {
      created: 'Created',
      released: 'Released',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    setConfirmAction({
      show: true,
      title: `Change Status to ${statusLabels[newStatus]}`,
      message: `Are you sure you want to change the status of ${workOrder.workOrderNumber} to ${statusLabels[newStatus]}?`,
      onConfirm: () => {
        updateMutation.mutate({ id: workOrder.id, data: { status: newStatus } });
        setConfirmAction((prev) => ({ ...prev, show: false }));
        if (selectedWorkOrder?.id === workOrder.id) {
          setSelectedWorkOrder({ ...workOrder, status: newStatus });
        }
      },
    });
  };

  // View work order detail
  const handleViewDetail = async (workOrder: WorkOrder) => {
    try {
      const detail = await workOrdersApi.getWorkOrder(workOrder.id);
      setSelectedWorkOrder(detail);
      setShowDetailModal(true);
    } catch {
      notification.error('Error', 'Could not load work order details.');
    }
  };

  // Get next valid status transitions
  const getNextStatuses = (currentStatus: WorkOrderStatus): WorkOrderStatus[] => {
    const transitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      created: ['released', 'cancelled'],
      released: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    return transitions[currentStatus] || [];
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Work Orders</h1>
          <p className="text-secondary-500">Manage production work orders</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Create Work Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-secondary-400" />
          <span className="text-sm text-secondary-500">Filter:</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-40"
          />
          <Select
            options={priorityOptions}
            value={priorityFilter}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Work orders list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-secondary-200">
            <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
          </div>
        ) : workOrders && workOrders.length > 0 ? (
          workOrders.map((wo) => (
            <div
              key={wo.id}
              className="bg-white rounded-xl border border-secondary-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Priority indicator */}
                <div
                  className={clsx(
                    'w-1 h-full rounded-full self-stretch',
                    wo.priority === 'urgent' && 'bg-danger-500',
                    wo.priority === 'high' && 'bg-warning-500',
                    wo.priority === 'medium' && 'bg-primary-500',
                    wo.priority === 'low' && 'bg-secondary-400'
                  )}
                />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <button
                      onClick={() => handleViewDetail(wo)}
                      className="font-semibold text-secondary-900 hover:text-primary-600 text-left"
                    >
                      {wo.workOrderNumber}
                    </button>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={wo.status as WorkOrderStatus} />
                      <span
                        className={clsx(
                          'text-xs px-2 py-0.5 rounded-full border',
                          priorityColors[wo.priority]
                        )}
                      >
                        {wo.priority}
                      </span>
                    </div>
                  </div>

                  <p className="text-secondary-600 mb-2">{wo.productName}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-secondary-500">
                    <div className="flex items-center gap-1">
                      <ClipboardList className="w-4 h-4" />
                      <span>
                        {wo.producedQty}/{wo.qty} units
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {format(parseISO(wo.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                    {wo.assignedTo && (
                      <span className="text-secondary-400">Assigned to: {wo.assignedTo}</span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-secondary-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((wo.producedQty / wo.qty) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all',
                          wo.status === 'completed'
                            ? 'bg-success-500'
                            : wo.status === 'in_progress'
                            ? 'bg-primary-500'
                            : 'bg-secondary-300'
                        )}
                        style={{ width: `${Math.min((wo.producedQty / wo.qty) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {getNextStatuses(wo.status as WorkOrderStatus).map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      variant={nextStatus === 'cancelled' ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => handleStatusChange(wo, nextStatus)}
                      disabled={updateMutation.isPending}
                    >
                      {nextStatus === 'released' && <Play className="w-4 h-4" />}
                      {nextStatus === 'in_progress' && <Play className="w-4 h-4" />}
                      {nextStatus === 'completed' && <CheckCircle className="w-4 h-4" />}
                      {nextStatus === 'cancelled' && <XCircle className="w-4 h-4" />}
                    </Button>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => handleViewDetail(wo)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-secondary-200 p-8">
            <EmptyState
              icon={<ClipboardList className="w-12 h-12" />}
              title="No work orders found"
              description="Create a new work order to get started"
              action={
                <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                  Create Work Order
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Create Work Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Work Order"
        size="lg"
      >
        <WorkOrderForm
          products={products || []}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createMutation.isPending}
          getBomVersions={getBomVersions}
        />
      </Modal>

      {/* Work Order Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedWorkOrder?.workOrderNumber}
        size="xl"
      >
        {selectedWorkOrder && (
          <div className="space-y-6">
            {/* Status and priority */}
            <div className="flex items-center gap-3">
              <StatusBadge status={selectedWorkOrder.status as WorkOrderStatus} size="md" />
              <span
                className={clsx(
                  'text-sm px-3 py-1 rounded-full border',
                  priorityColors[selectedWorkOrder.priority]
                )}
              >
                {selectedWorkOrder.priority} priority
              </span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500">Product</p>
                <p className="font-medium">{selectedWorkOrder.productName}</p>
              </div>
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500">Quantity</p>
                <p className="font-medium">
                  {selectedWorkOrder.producedQty} / {selectedWorkOrder.qty}
                </p>
              </div>
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500">Due Date</p>
                <p className="font-medium">
                  {format(parseISO(selectedWorkOrder.dueDate), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500">BOM Version</p>
                <p className="font-medium">{selectedWorkOrder.bomVersion}</p>
              </div>
            </div>

            {/* Operations routing */}
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-3">Operations Routing</h3>
              <div className="space-y-2">
                {selectedWorkOrder.operations.map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center gap-4 p-3 border border-secondary-200 rounded-lg"
                  >
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        op.status === 'completed' && 'bg-success-100 text-success-700',
                        op.status === 'in_progress' && 'bg-warning-100 text-warning-700',
                        op.status === 'pending' && 'bg-secondary-100 text-secondary-600'
                      )}
                    >
                      {op.sequence}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-secondary-900">{op.name}</p>
                      <p className="text-sm text-secondary-500">
                        {op.workCenter} • Setup: {op.setupTime}min • Run: {op.runTime}min
                      </p>
                    </div>
                    <StatusBadge status={op.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Activity log */}
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-3">Activity Log</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedWorkOrder.activityLog.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-secondary-300 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-secondary-900">{log.action}</p>
                      <p className="text-secondary-500">
                        {log.user} • {format(parseISO(log.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selectedWorkOrder.notes && (
              <div>
                <h3 className="text-sm font-medium text-secondary-700 mb-2">Notes</h3>
                <p className="text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                  {selectedWorkOrder.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              {getNextStatuses(selectedWorkOrder.status as WorkOrderStatus).map((nextStatus) => (
                <Button
                  key={nextStatus}
                  variant={nextStatus === 'cancelled' ? 'danger' : 'primary'}
                  onClick={() => handleStatusChange(selectedWorkOrder, nextStatus)}
                >
                  {nextStatus === 'released' && 'Release'}
                  {nextStatus === 'in_progress' && 'Start Production'}
                  {nextStatus === 'completed' && 'Mark Complete'}
                  {nextStatus === 'cancelled' && 'Cancel'}
                </Button>
              ))}
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={confirmAction.show}
        onClose={() => setConfirmAction((prev) => ({ ...prev, show: false }))}
        onConfirm={confirmAction.onConfirm}
        title={confirmAction.title}
        message={confirmAction.message}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
