import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, ArrowUpDown, Loader2, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  EmptyState,
} from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { BomList } from '@/components/BomTree';
import { inventoryApi, productsApi } from '@/services/api';
import type { InventoryItem, BOMNode } from '@/types';

export function InventoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [itemBom, setItemBom] = useState<BOMNode[] | null>(null);

  // Fetch inventory items
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory', page, pageSize, search],
    queryFn: () => inventoryApi.getItems({ page, pageSize, search }),
  });

  // Handle search with debounce effect
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Handle item click
  const handleItemClick = async (item: InventoryItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
    setItemBom(null);

    // Fetch full item details including BOM
    try {
      const fullItem = await inventoryApi.getItem(item.id);
      setSelectedItem(fullItem);

      // If item is used in products, show BOM info
      if (fullItem.usedIn && fullItem.usedIn.length > 0) {
        const bom = await productsApi.getBom(fullItem.usedIn[0].productId);
        const activeVersion = bom.versions.find((v) => v.status === 'active');
        if (activeVersion) {
          setItemBom(activeVersion.nodes);
        }
      }
    } catch (err) {
      console.error('Failed to load item details', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Inventory</h1>
          <p className="text-secondary-500">Manage stock levels and item details</p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl border border-secondary-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by SKU, name, or location..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-xl border border-secondary-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-danger-600">
            Failed to load inventory. Please try again.
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button className="flex items-center gap-1 hover:text-secondary-900">
                      SKU <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Lots</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow
                    key={item.id}
                    isClickable
                    onClick={() => handleItemClick(item)}
                  >
                    <TableCell>
                      <span className="font-mono text-sm">{item.sku}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-secondary-900">{item.name}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{item.onHand}</TableCell>
                    <TableCell className="text-right text-secondary-500">{item.allocated}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          item.available <= item.reorderPoint
                            ? 'text-danger-600 font-medium'
                            : 'text-success-600'
                        }
                      >
                        {item.available}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-secondary-100 px-2 py-1 rounded">
                        {item.location}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.lots.length} lot(s)</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              totalItems={data.total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        ) : (
          <EmptyState
            icon={<Package className="w-12 h-12" />}
            title="No items found"
            description={search ? 'Try adjusting your search terms' : 'No inventory items available'}
          />
        )}
      </div>

      {/* Item detail drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedItem?.name}
        description={selectedItem?.sku}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Item summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500">On Hand</p>
                <p className="text-2xl font-bold text-secondary-900">{selectedItem.onHand}</p>
              </div>
              <div className="p-4 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500">Available</p>
                <p
                  className={`text-2xl font-bold ${
                    selectedItem.available <= selectedItem.reorderPoint
                      ? 'text-danger-600'
                      : 'text-success-600'
                  }`}
                >
                  {selectedItem.available}
                </p>
              </div>
              <div className="p-4 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500">Allocated</p>
                <p className="text-2xl font-bold text-secondary-900">{selectedItem.allocated}</p>
              </div>
              <div className="p-4 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500">Reorder Point</p>
                <p className="text-2xl font-bold text-secondary-900">{selectedItem.reorderPoint}</p>
              </div>
            </div>

            {/* Details */}
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-2">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-500">Category</span>
                  <span className="text-secondary-900">{selectedItem.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Location</span>
                  <span className="font-mono text-secondary-900">{selectedItem.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Unit Cost</span>
                  <span className="text-secondary-900">${selectedItem.unitCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Total Value</span>
                  <span className="font-medium text-secondary-900">
                    ${(selectedItem.onHand * selectedItem.unitCost).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Lot information */}
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-2">Lot Information</h3>
              <div className="space-y-2">
                {selectedItem.lots.map((lot) => (
                  <div
                    key={lot.lot}
                    className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
                  >
                    <div>
                      <span className="font-mono text-sm">{lot.lot}</span>
                      <p className="text-xs text-secondary-500">
                        Received: {format(parseISO(lot.receivedDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className="font-medium">{lot.qty} units</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent transactions */}
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-2">Recent Transactions</h3>
              <div className="space-y-2">
                {selectedItem.transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg"
                  >
                    <div>
                      <span
                        className={`text-sm font-medium ${
                          txn.qty > 0 ? 'text-success-600' : 'text-danger-600'
                        }`}
                      >
                        {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                      </span>
                      <p className="text-xs text-secondary-500">
                        {format(parseISO(txn.date), 'MMM d, yyyy')} • {txn.user}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-medium ${
                          txn.qty > 0 ? 'text-success-600' : 'text-danger-600'
                        }`}
                      >
                        {txn.qty > 0 ? '+' : ''}
                        {txn.qty}
                      </span>
                      <p className="text-xs text-secondary-500">{txn.reference}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOM where used */}
            {itemBom && itemBom.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-secondary-700 mb-2">Used In (BOM)</h3>
                <div className="border border-secondary-200 rounded-lg p-3">
                  <BomList nodes={itemBom} />
                </div>
              </div>
            )}

            {/* Traceability actions */}
            <div className="pt-4 border-t border-secondary-200">
              <h3 className="text-sm font-medium text-secondary-700 mb-3">Traceability</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
                  View Full History
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
                  Track Lot Usage
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
