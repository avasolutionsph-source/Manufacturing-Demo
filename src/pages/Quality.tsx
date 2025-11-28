import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  AlertTriangle,
  Filter,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  Search,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Table';
import { qualityApi, workOrdersApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import type { NonConformanceReport, NCRStatus } from '@/types';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'closed', label: 'Closed' },
];

const severityOptions = [
  { value: 'minor', label: 'Minor' },
  { value: 'major', label: 'Major' },
  { value: 'critical', label: 'Critical' },
];

const defectTypeOptions = [
  { value: 'Dimensional', label: 'Dimensional' },
  { value: 'Surface Defect', label: 'Surface Defect' },
  { value: 'Material', label: 'Material' },
  { value: 'Assembly', label: 'Assembly' },
  { value: 'Workmanship', label: 'Workmanship' },
  { value: 'Contamination', label: 'Contamination' },
  { value: 'Other', label: 'Other' },
];

const dispositionOptions = [
  { value: 'scrap', label: 'Scrap' },
  { value: 'rework', label: 'Rework' },
  { value: 'use_as_is', label: 'Use As Is' },
  { value: 'return_to_vendor', label: 'Return to Vendor' },
];

const severityColors = {
  minor: 'bg-secondary-100 text-secondary-700 border-secondary-200',
  major: 'bg-warning-100 text-warning-700 border-warning-200',
  critical: 'bg-danger-100 text-danger-700 border-danger-200',
};

export function QualityPage() {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNCR, setSelectedNCR] = useState<NonConformanceReport | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    workOrderId: '',
    defectType: '',
    severity: 'minor',
    quantity: 1,
  });

  // Queries
  const { data: ncrs, isLoading } = useQuery({
    queryKey: ['ncrs', statusFilter],
    queryFn: () => qualityApi.getNCRs({ status: statusFilter || undefined }),
  });

  const { data: workOrders } = useQuery({
    queryKey: ['workorders-for-ncr'],
    queryFn: () => workOrdersApi.getWorkOrders({}),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: qualityApi.createNCR,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ncrs'] });
      setShowCreateModal(false);
      resetForm();
      notification.success('NCR Created', 'Nonconformance report has been created.');
    },
    onError: () => {
      notification.error('Creation Failed', 'Could not create NCR. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NonConformanceReport> }) =>
      qualityApi.updateNCR(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ncrs'] });
      if (selectedNCR) {
        // Refresh the selected NCR
        qualityApi.getNCR(selectedNCR.id).then(setSelectedNCR);
      }
      notification.success('NCR Updated', 'Status has been updated.');
    },
    onError: () => {
      notification.error('Update Failed', 'Could not update NCR. Please try again.');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      workOrderId: '',
      defectType: '',
      severity: 'minor',
      quantity: 1,
    });
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('status', value);
    } else {
      params.delete('status');
    }
    setSearchParams(params);
  };

  const handleViewNCR = async (ncr: NonConformanceReport) => {
    try {
      const detail = await qualityApi.getNCR(ncr.id);
      setSelectedNCR(detail);
      setDrawerOpen(true);
    } catch {
      notification.error('Error', 'Could not load NCR details.');
    }
  };

  const handleStatusChange = (ncrId: string, newStatus: NCRStatus) => {
    updateMutation.mutate({ id: ncrId, data: { status: newStatus } });
  };

  const handleCreate = () => {
    if (!formData.title || !formData.description || !formData.defectType) {
      notification.warning('Validation Error', 'Please fill in all required fields.');
      return;
    }
    createMutation.mutate(formData);
  };

  const workOrderOptions = [
    { value: '', label: 'Not linked to work order' },
    ...(workOrders?.map((wo) => ({
      value: wo.id,
      label: `${wo.workOrderNumber} - ${wo.productName}`,
    })) || []),
  ];

  // Statistics
  const stats = {
    open: ncrs?.filter((n) => n.status === 'open').length || 0,
    investigating: ncrs?.filter((n) => n.status === 'investigating').length || 0,
    closed: ncrs?.filter((n) => n.status === 'closed').length || 0,
    critical: ncrs?.filter((n) => n.severity === 'critical' && n.status !== 'closed').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Quality Management</h1>
            <p className="text-secondary-500">Track and manage nonconformance reports</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Create NCR
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.open}</p>
              <p className="text-sm text-secondary-500">Open</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.investigating}</p>
              <p className="text-sm text-secondary-500">Investigating</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.closed}</p>
              <p className="text-sm text-secondary-500">Closed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger-600">{stats.critical}</p>
              <p className="text-sm text-secondary-500">Critical Open</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Filter className="w-4 h-4 text-secondary-400" />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="w-40"
        />
      </div>

      {/* NCR List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-secondary-200">
            <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
          </div>
        ) : ncrs && ncrs.length > 0 ? (
          ncrs.map((ncr) => (
            <div
              key={ncr.id}
              className="bg-white rounded-xl border border-secondary-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewNCR(ncr)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    'w-1 h-full rounded-full self-stretch',
                    ncr.severity === 'critical' && 'bg-danger-500',
                    ncr.severity === 'major' && 'bg-warning-500',
                    ncr.severity === 'minor' && 'bg-secondary-400'
                  )}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <span className="font-mono text-sm text-secondary-500">{ncr.ncrNumber}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ncr.status as NCRStatus} />
                      <span
                        className={clsx(
                          'text-xs px-2 py-0.5 rounded-full border',
                          severityColors[ncr.severity]
                        )}
                      >
                        {ncr.severity}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-medium text-secondary-900 mb-1">{ncr.title}</h3>
                  <p className="text-sm text-secondary-500 line-clamp-2 mb-2">{ncr.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-secondary-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {ncr.defectType}
                    </span>
                    <span>{ncr.quantity} units affected</span>
                    {ncr.workOrderNumber && (
                      <span className="text-primary-600">{ncr.workOrderNumber}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(parseISO(ncr.reportedAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-secondary-200 p-8">
            <EmptyState
              icon={<ShieldCheck className="w-12 h-12" />}
              title="No NCRs found"
              description={statusFilter ? 'Try adjusting your filter' : 'No nonconformance reports yet'}
              action={
                <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                  Create NCR
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Create NCR Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Nonconformance Report"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Brief description of the issue"
            required
          />

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Detailed description of the nonconformance..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Work Order (Optional)"
              options={workOrderOptions}
              value={formData.workOrderId}
              onChange={(e) => setFormData((prev) => ({ ...prev, workOrderId: e.target.value }))}
            />
            <Select
              label="Defect Type"
              options={defectTypeOptions}
              value={formData.defectType}
              onChange={(e) => setFormData((prev) => ({ ...prev, defectType: e.target.value }))}
              placeholder="Select defect type"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Severity"
              options={severityOptions}
              value={formData.severity}
              onChange={(e) => setFormData((prev) => ({ ...prev, severity: e.target.value }))}
            />
            <Input
              label="Quantity Affected"
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={createMutation.isPending}>
              Create NCR
            </Button>
          </div>
        </div>
      </Modal>

      {/* NCR Detail Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedNCR?.ncrNumber}
        description={selectedNCR?.title}
        size="lg"
      >
        {selectedNCR && (
          <div className="space-y-6">
            {/* Status and severity */}
            <div className="flex items-center gap-3">
              <StatusBadge status={selectedNCR.status as NCRStatus} size="md" />
              <span
                className={clsx(
                  'text-sm px-3 py-1 rounded-full border',
                  severityColors[selectedNCR.severity]
                )}
              >
                {selectedNCR.severity}
              </span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500">Defect Type</p>
                <p className="font-medium">{selectedNCR.defectType}</p>
              </div>
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500">Quantity Affected</p>
                <p className="font-medium">{selectedNCR.quantity} units</p>
              </div>
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500">Reported By</p>
                <p className="font-medium">{selectedNCR.reportedBy}</p>
              </div>
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500">Reported At</p>
                <p className="font-medium">
                  {format(parseISO(selectedNCR.reportedAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>

            {/* Linked work order */}
            {selectedNCR.workOrderNumber && (
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-700 mb-1">Linked Work Order</p>
                <p className="font-medium text-primary-900">{selectedNCR.workOrderNumber}</p>
                <p className="text-sm text-primary-600">{selectedNCR.productName}</p>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-2">Description</h3>
              <p className="text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                {selectedNCR.description}
              </p>
            </div>

            {/* Root cause */}
            {selectedNCR.rootCause && (
              <div>
                <h3 className="text-sm font-medium text-secondary-700 mb-2">Root Cause</h3>
                <p className="text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                  {selectedNCR.rootCause}
                </p>
              </div>
            )}

            {/* Corrective action */}
            {selectedNCR.correctiveAction && (
              <div>
                <h3 className="text-sm font-medium text-secondary-700 mb-2">Corrective Action</h3>
                <p className="text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                  {selectedNCR.correctiveAction}
                </p>
              </div>
            )}

            {/* Disposition */}
            {selectedNCR.disposition && (
              <div>
                <h3 className="text-sm font-medium text-secondary-700 mb-2">Disposition</h3>
                <p className="font-medium capitalize">{selectedNCR.disposition.replace(/_/g, ' ')}</p>
              </div>
            )}

            {/* Closed info */}
            {selectedNCR.closedAt && (
              <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                <p className="text-sm text-success-700">
                  Closed by {selectedNCR.closedBy} on{' '}
                  {format(parseISO(selectedNCR.closedAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-secondary-200">
              {selectedNCR.status === 'open' && (
                <Button
                  onClick={() => handleStatusChange(selectedNCR.id, 'investigating')}
                  isLoading={updateMutation.isPending}
                >
                  Start Investigation
                </Button>
              )}
              {selectedNCR.status === 'investigating' && (
                <Button
                  onClick={() => handleStatusChange(selectedNCR.id, 'closed')}
                  isLoading={updateMutation.isPending}
                  variant="success"
                >
                  Close NCR
                </Button>
              )}
              {selectedNCR.status !== 'closed' && (
                <Select
                  options={dispositionOptions}
                  value={selectedNCR.disposition || ''}
                  onChange={(e) =>
                    updateMutation.mutate({
                      id: selectedNCR.id,
                      data: { disposition: e.target.value as NonConformanceReport['disposition'] },
                    })
                  }
                  placeholder="Set disposition..."
                  className="w-48"
                />
              )}
              <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
