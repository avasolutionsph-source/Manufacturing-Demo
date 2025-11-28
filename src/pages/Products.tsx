import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes, Loader2, ChevronRight, Eye, Edit, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BomTree } from '@/components/BomTree';
import { EmptyState } from '@/components/ui/Table';
import { productsApi } from '@/services/api';
import type { Product, ProductBOM, BOMVersion } from '@/types';
import { clsx } from 'clsx';

export function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBom, setSelectedBom] = useState<ProductBOM | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BOMVersion | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  });

  // Toggle product expansion
  const toggleProduct = async (product: Product) => {
    const newExpanded = new Set(expandedProducts);

    if (newExpanded.has(product.id)) {
      newExpanded.delete(product.id);
      if (selectedProduct?.id === product.id) {
        setSelectedProduct(null);
        setSelectedBom(null);
      }
    } else {
      newExpanded.add(product.id);
      setSelectedProduct(product);

      // Fetch BOM for product
      try {
        const bom = await productsApi.getBom(product.id);
        setSelectedBom(bom);
      } catch (err) {
        console.error('Failed to load BOM', err);
      }
    }

    setExpandedProducts(newExpanded);
  };

  // View version history
  const handleViewVersions = (bom: ProductBOM) => {
    setSelectedVersion(bom.versions.find((v) => v.status === 'active') || bom.versions[0]);
    setShowVersionModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Products & BOM</h1>
          <p className="text-secondary-500">Manage products and bills of materials</p>
        </div>
      </div>

      {/* Products list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-secondary-200">
            <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
          </div>
        ) : products && products.length > 0 ? (
          products.map((product) => {
            const isExpanded = expandedProducts.has(product.id);
            const productBom = selectedProduct?.id === product.id ? selectedBom : null;

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-secondary-200 overflow-hidden"
              >
                {/* Product header */}
                <button
                  onClick={() => toggleProduct(product)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary-50 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                      isExpanded ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-500'
                    )}
                  >
                    <Boxes className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-secondary-900">{product.name}</span>
                      <span className="font-mono text-xs text-secondary-400">{product.sku}</span>
                    </div>
                    <p className="text-sm text-secondary-500 truncate">{product.description}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm text-secondary-500">BOM Version</p>
                      <p className="font-medium">{product.currentBomVersion}</p>
                    </div>
                    <StatusBadge status={product.status} />
                    <ChevronRight
                      className={clsx(
                        'w-5 h-5 text-secondary-400 transition-transform',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  </div>
                </button>

                {/* Expanded BOM content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-secondary-200"
                    >
                      <div className="p-4 space-y-4">
                        {/* Product details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-secondary-500">Category</p>
                            <p className="font-medium">{product.category}</p>
                          </div>
                          <div>
                            <p className="text-sm text-secondary-500">Unit of Measure</p>
                            <p className="font-medium">{product.unitOfMeasure}</p>
                          </div>
                          <div>
                            <p className="text-sm text-secondary-500">Standard Cost</p>
                            <p className="font-medium">${product.standardCost.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-secondary-500">Status</p>
                            <StatusBadge status={product.status} />
                          </div>
                        </div>

                        {/* BOM tree */}
                        {productBom ? (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-medium text-secondary-700">
                                Bill of Materials (v{product.currentBomVersion})
                              </h3>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewVersions(productBom)}
                                  leftIcon={<Clock className="w-4 h-4" />}
                                >
                                  Version History
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  leftIcon={<Edit className="w-4 h-4" />}
                                >
                                  Edit BOM
                                </Button>
                              </div>
                            </div>

                            <div className="border border-secondary-200 rounded-lg p-3 bg-secondary-50">
                              {(() => {
                                const activeVersion = productBom.versions.find(
                                  (v) => v.status === 'active'
                                );
                                return activeVersion ? (
                                  <BomTree nodes={activeVersion.nodes} expandedByDefault />
                                ) : (
                                  <p className="text-secondary-500 text-center py-4">
                                    No active BOM version
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-secondary-200 p-8">
            <EmptyState
              icon={<Boxes className="w-12 h-12" />}
              title="No products found"
              description="Add products to see them listed here"
            />
          </div>
        )}
      </div>

      {/* Version History Modal */}
      <Modal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        title="BOM Version History"
        description={selectedBom?.productName}
        size="lg"
      >
        {selectedBom && (
          <div className="space-y-4">
            {/* Version tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {selectedBom.versions.map((version) => (
                <button
                  key={version.version}
                  onClick={() => setSelectedVersion(version)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                    selectedVersion?.version === version.version
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                  )}
                >
                  Version {version.version}
                  {version.status === 'active' && (
                    <span className="ml-2 text-xs bg-success-500 text-white px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Selected version details */}
            {selectedVersion && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary-50 rounded-lg">
                  <div>
                    <p className="text-sm text-secondary-500">Effective Date</p>
                    <p className="font-medium">
                      {format(parseISO(selectedVersion.effectiveDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Status</p>
                    <StatusBadge status={selectedVersion.status} />
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Created By</p>
                    <p className="font-medium">{selectedVersion.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Created At</p>
                    <p className="font-medium">
                      {format(parseISO(selectedVersion.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-secondary-700 mb-2">Components</h4>
                  <div className="border border-secondary-200 rounded-lg p-3">
                    <BomTree nodes={selectedVersion.nodes} expandedByDefault />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-secondary-200">
                  {selectedVersion.status !== 'active' && selectedVersion.status !== 'obsolete' && (
                    <Button variant="primary" leftIcon={<Eye className="w-4 h-4" />}>
                      Activate Version
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => setShowVersionModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
