import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Factory,
  User,
  Clock,
  Square,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { useShopFloorStore } from '@/stores/uiStore';
import { useUser } from '@/stores/authStore';
import { workOrdersApi, shopFloorApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import type { WorkOrder } from '@/types';

export function ShopFloorPage() {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const user = useUser();
  const { currentOperator, clockedIn, activeWorkOrder, clockIn, clockOut, setActiveWorkOrder } =
    useShopFloorStore();

  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [operatorId, setOperatorId] = useState(user?.id || '');
  const [workCenter, setWorkCenter] = useState('');
  const [qtyProduced, setQtyProduced] = useState(1);
  const [qtyScrap, setQtyScrap] = useState(0);
  const [inspectionResult, setInspectionResult] = useState<'pass' | 'fail' | ''>('');
  const [notes, setNotes] = useState('');

  // Fetch available work orders (released or in progress)
  const { data: workOrders, isLoading } = useQuery({
    queryKey: ['workorders', 'shop-floor'],
    queryFn: () => workOrdersApi.getWorkOrders({}),
    select: (data) =>
      data.filter((wo) => wo.status === 'released' || wo.status === 'in_progress'),
  });

  // Get active work order details
  const { data: activeWO } = useQuery({
    queryKey: ['workorder', activeWorkOrder],
    queryFn: () => (activeWorkOrder ? workOrdersApi.getWorkOrder(activeWorkOrder) : null),
    enabled: !!activeWorkOrder,
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: () => shopFloorApi.clockIn(operatorId, workCenter || undefined),
    onSuccess: (data) => {
      clockIn(data.operatorId, data.operatorName, data.workCenter);
      setShowClockInModal(false);
      notification.success('Clocked In', `Welcome, ${data.operatorName}!`);
    },
    onError: () => {
      notification.error('Clock In Failed', 'Could not clock in. Please try again.');
    },
  });

  // Production recording mutation
  const productionMutation = useMutation({
    mutationFn: () =>
      shopFloorApi.recordProduction({
        workOrderId: activeWorkOrder!,
        operatorId: currentOperator!.id,
        qtyProduced,
        qtyScrap,
        inspectionResult: inspectionResult || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workorders'] });
      queryClient.invalidateQueries({ queryKey: ['workorder', activeWorkOrder] });
      setShowProductionModal(false);
      resetProductionForm();
      notification.success('Production Recorded', `${qtyProduced} units recorded successfully.`);
    },
    onError: () => {
      notification.error('Recording Failed', 'Could not record production. Please try again.');
    },
  });

  // Start work order
  const startWorkOrderMutation = useMutation({
    mutationFn: (workOrderId: string) =>
      workOrdersApi.updateWorkOrder(workOrderId, { status: 'in_progress' }),
    onSuccess: (_, workOrderId) => {
      queryClient.invalidateQueries({ queryKey: ['workorders'] });
      setActiveWorkOrder(workOrderId);
      notification.success('Work Order Started', 'Production has begun.');
    },
    onError: () => {
      notification.error('Start Failed', 'Could not start work order.');
    },
  });

  const resetProductionForm = () => {
    setQtyProduced(1);
    setQtyScrap(0);
    setInspectionResult('');
    setNotes('');
  };

  const handleClockOut = () => {
    clockOut();
    notification.info('Clocked Out', 'You have been clocked out successfully.');
  };

  const handleStartWorkOrder = (wo: WorkOrder) => {
    if (wo.status === 'released') {
      startWorkOrderMutation.mutate(wo.id);
    } else {
      setActiveWorkOrder(wo.id);
    }
  };

  const workCenterOptions = [
    { value: '', label: 'Select Work Center' },
    { value: 'WC-PREP', label: 'Preparation' },
    { value: 'WC-ASSY', label: 'Assembly' },
    { value: 'WC-MACH', label: 'Machining' },
    { value: 'WC-TEST', label: 'Testing' },
    { value: 'WC-QC', label: 'Quality Control' },
    { value: 'WC-ELEC', label: 'Electrical' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Factory className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Shop Floor Terminal</h1>
            <p className="text-secondary-500">Operator interface for production</p>
          </div>
        </div>
      </div>

      {/* Operator status bar */}
      <div
        className={clsx(
          'rounded-xl border p-4',
          clockedIn
            ? 'bg-success-50 border-success-200'
            : 'bg-secondary-50 border-secondary-200'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {clockedIn && currentOperator ? (
            <>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <p className="font-semibold text-secondary-900">{currentOperator.name}</p>
                  <div className="flex items-center gap-2 text-sm text-secondary-500">
                    <Clock className="w-4 h-4" />
                    <span>Clocked in</span>
                    {useShopFloorStore.getState().currentWorkCenter && (
                      <span>• {useShopFloorStore.getState().currentWorkCenter}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="secondary" onClick={handleClockOut}>
                Clock Out
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-secondary-500" />
                </div>
                <div>
                  <p className="font-semibold text-secondary-700">No Operator Signed In</p>
                  <p className="text-sm text-secondary-500">Clock in to start recording production</p>
                </div>
              </div>
              <Button onClick={() => setShowClockInModal(true)}>Clock In</Button>
            </>
          )}
        </div>
      </div>

      {/* Main content - only show when clocked in */}
      {clockedIn ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work order selection */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-semibold text-secondary-900">Available Work Orders</h2>

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
              </div>
            ) : workOrders && workOrders.length > 0 ? (
              <div className="space-y-2">
                {workOrders.map((wo) => (
                  <button
                    key={wo.id}
                    onClick={() => handleStartWorkOrder(wo)}
                    disabled={startWorkOrderMutation.isPending}
                    className={clsx(
                      'w-full p-4 rounded-lg border text-left transition-all',
                      activeWorkOrder === wo.id
                        ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-200'
                        : 'bg-white border-secondary-200 hover:border-primary-200 hover:shadow-sm'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{wo.workOrderNumber}</span>
                      <StatusBadge status={wo.status} />
                    </div>
                    <p className="text-sm text-secondary-600 mb-2">{wo.productName}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-500">
                        {wo.producedQty}/{wo.qty} units
                      </span>
                      <span className="text-secondary-400">
                        Due: {format(parseISO(wo.dueDate), 'MMM d')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary-500">
                No work orders available
              </div>
            )}
          </div>

          {/* Active work order details */}
          <div className="lg:col-span-2">
            {activeWO ? (
              <div className="bg-white rounded-xl border border-secondary-200 p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-secondary-900">
                      {activeWO.workOrderNumber}
                    </h2>
                    <p className="text-secondary-600">{activeWO.productName}</p>
                  </div>
                  <StatusBadge status={activeWO.status} size="md" />
                </div>

                {/* Production stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <p className="text-3xl font-bold text-primary-600">{activeWO.producedQty}</p>
                    <p className="text-sm text-secondary-500">Produced</p>
                  </div>
                  <div className="text-center p-4 bg-secondary-50 rounded-lg">
                    <p className="text-3xl font-bold text-secondary-900">{activeWO.qty}</p>
                    <p className="text-sm text-secondary-500">Target</p>
                  </div>
                  <div className="text-center p-4 bg-warning-50 rounded-lg">
                    <p className="text-3xl font-bold text-warning-600">{activeWO.scrapQty}</p>
                    <p className="text-sm text-secondary-500">Scrap</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-sm text-secondary-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round((activeWO.producedQty / activeWO.qty) * 100)}%</span>
                  </div>
                  <div className="h-4 bg-secondary-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${Math.min((activeWO.producedQty / activeWO.qty) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Current operation */}
                {activeWO.operations.find((op) => op.status === 'in_progress') && (
                  <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-warning-500" />
                      <span className="font-medium text-warning-700">Current Operation</span>
                    </div>
                    <p className="text-secondary-900">
                      {activeWO.operations.find((op) => op.status === 'in_progress')?.name}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={() => setShowProductionModal(true)}
                    leftIcon={<CheckCircle className="w-5 h-5" />}
                  >
                    Record Production
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setActiveWorkOrder(null)}
                    leftIcon={<Square className="w-5 h-5" />}
                  >
                    Stop
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
                <Factory className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">
                  No Active Work Order
                </h3>
                <p className="text-secondary-500">
                  Select a work order from the list to start production
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
          <User className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Please Clock In to Continue
          </h3>
          <p className="text-secondary-500 mb-4">
            You must be clocked in to view and work on production orders
          </p>
          <Button onClick={() => setShowClockInModal(true)}>Clock In</Button>
        </div>
      )}

      {/* Clock In Modal */}
      <Modal
        isOpen={showClockInModal}
        onClose={() => setShowClockInModal(false)}
        title="Clock In"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Operator ID"
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
            placeholder="Enter your operator ID"
          />
          <Select
            label="Work Center (Optional)"
            options={workCenterOptions}
            value={workCenter}
            onChange={(e) => setWorkCenter(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowClockInModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => clockInMutation.mutate()}
              isLoading={clockInMutation.isPending}
              disabled={!operatorId}
            >
              Clock In
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record Production Modal */}
      <Modal
        isOpen={showProductionModal}
        onClose={() => setShowProductionModal(false)}
        title="Record Production"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity Produced"
              type="number"
              min={0}
              value={qtyProduced}
              onChange={(e) => setQtyProduced(parseInt(e.target.value) || 0)}
            />
            <Input
              label="Scrap Quantity"
              type="number"
              min={0}
              value={qtyScrap}
              onChange={(e) => setQtyScrap(parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Inspection Result
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setInspectionResult('pass')}
                className={clsx(
                  'flex-1 p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2',
                  inspectionResult === 'pass'
                    ? 'border-success-500 bg-success-50 text-success-700'
                    : 'border-secondary-200 hover:border-success-200'
                )}
              >
                <CheckCircle className="w-5 h-5" />
                Pass
              </button>
              <button
                onClick={() => setInspectionResult('fail')}
                className={clsx(
                  'flex-1 p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2',
                  inspectionResult === 'fail'
                    ? 'border-danger-500 bg-danger-50 text-danger-700'
                    : 'border-secondary-200 hover:border-danger-200'
                )}
              >
                <XCircle className="w-5 h-5" />
                Fail
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Add any notes about this production run..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
            <Button variant="secondary" onClick={() => setShowProductionModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => productionMutation.mutate()}
              isLoading={productionMutation.isPending}
              disabled={qtyProduced === 0}
            >
              Record Production
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
