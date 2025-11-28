import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import type { Product, ProductBOM } from '@/types';

export interface WorkOrderFormData {
  productId: string;
  qty: number;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  bomVersion: string;
  notes?: string;
}

export interface WorkOrderFormProps {
  products: Product[];
  onSubmit: (data: WorkOrderFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  getBomVersions: (productId: string) => Promise<ProductBOM | null>;
}

export function WorkOrderForm({
  products,
  onSubmit,
  onCancel,
  isLoading = false,
  getBomVersions,
}: WorkOrderFormProps) {
  const [formData, setFormData] = useState<WorkOrderFormData>({
    productId: '',
    qty: 1,
    dueDate: getDefaultDueDate(),
    priority: 'medium',
    bomVersion: '',
    notes: '',
  });

  const [bomVersions, setBomVersions] = useState<Array<{ version: string; status: string }>>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof WorkOrderFormData, string>>>({});
  const [loadingBom, setLoadingBom] = useState(false);

  // Load BOM versions when product changes
  useEffect(() => {
    if (formData.productId) {
      setLoadingBom(true);
      getBomVersions(formData.productId)
        .then((bom) => {
          if (bom) {
            const versions = bom.versions.map((v) => ({
              version: v.version,
              status: v.status,
            }));
            setBomVersions(versions);
            // Auto-select active version
            const activeVersion = versions.find((v) => v.status === 'active');
            if (activeVersion) {
              setFormData((prev) => ({ ...prev, bomVersion: activeVersion.version }));
            }
          } else {
            setBomVersions([]);
          }
        })
        .finally(() => setLoadingBom(false));
    } else {
      setBomVersions([]);
      setFormData((prev) => ({ ...prev, bomVersion: '' }));
    }
  }, [formData.productId, getBomVersions]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof WorkOrderFormData, string>> = {};

    if (!formData.productId) {
      newErrors.productId = 'Please select a product';
    }

    if (!formData.qty || formData.qty < 1) {
      newErrors.qty = 'Quantity must be at least 1';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    if (!formData.bomVersion) {
      newErrors.bomVersion = 'Please select a BOM version';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof WorkOrderFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.sku} - ${p.name}`,
  }));

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const bomVersionOptions = bomVersions.map((v) => ({
    value: v.version,
    label: `Version ${v.version} ${v.status === 'active' ? '(Active)' : `(${v.status})`}`,
    disabled: v.status === 'obsolete',
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Select
            label="Product"
            options={productOptions}
            value={formData.productId}
            onChange={(e) => handleChange('productId', e.target.value)}
            error={errors.productId}
            placeholder="Select a product..."
            required
          />
        </div>

        <Input
          label="Quantity"
          type="number"
          min={1}
          value={formData.qty}
          onChange={(e) => handleChange('qty', parseInt(e.target.value) || 0)}
          error={errors.qty}
          required
        />

        <Input
          label="Due Date"
          type="date"
          value={formData.dueDate}
          onChange={(e) => handleChange('dueDate', e.target.value)}
          error={errors.dueDate}
          required
        />

        <Select
          label="Priority"
          options={priorityOptions}
          value={formData.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
        />

        <Select
          label="BOM Version"
          options={bomVersionOptions}
          value={formData.bomVersion}
          onChange={(e) => handleChange('bomVersion', e.target.value)}
          error={errors.bomVersion}
          placeholder={loadingBom ? 'Loading...' : 'Select BOM version...'}
          disabled={!formData.productId || loadingBom}
          required
        />

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="block w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg bg-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 resize-none"
            placeholder="Add any special instructions or notes..."
          />
        </div>
      </div>

      {/* Selected product info */}
      {formData.productId && (
        <div className="bg-secondary-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-secondary-700 mb-2">Selected Product</h4>
          {(() => {
            const product = products.find((p) => p.id === formData.productId);
            return product ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-secondary-500">SKU:</span>{' '}
                  <span className="font-mono">{product.sku}</span>
                </div>
                <div>
                  <span className="text-secondary-500">Category:</span> {product.category}
                </div>
                <div>
                  <span className="text-secondary-500">Unit Cost:</span> ${product.standardCost.toFixed(2)}
                </div>
                <div>
                  <span className="text-secondary-500">Est. Total:</span>{' '}
                  <span className="font-semibold">
                    ${(product.standardCost * formData.qty).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          Create Work Order
        </Button>
      </div>
    </form>
  );
}

function getDefaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}
