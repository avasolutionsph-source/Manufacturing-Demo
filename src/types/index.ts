// User and Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plant: string;
  avatar?: string;
}

export type UserRole = 'planner' | 'shop_foreman' | 'quality_inspector' | 'admin';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Dashboard Types
export interface KPIData {
  oee: number;
  onTimeDelivery: number;
  inventoryTurns: number;
  openWorkOrders: number;
}

export interface ProductionData {
  date: string;
  qty: number;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  onHand: number;
  allocated: number;
  available: number;
  location: string;
  unitCost: number;
  reorderPoint: number;
  lots: LotInfo[];
  transactions: InventoryTransaction[];
}

export interface LotInfo {
  lot: string;
  qty: number;
  expiryDate?: string;
  receivedDate: string;
}

export interface InventoryTransaction {
  id: string;
  date: string;
  type: 'receipt' | 'issue' | 'adjustment' | 'transfer';
  qty: number;
  reference: string;
  user: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Product and BOM Types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unitOfMeasure: string;
  standardCost: number;
  currentBomVersion: string;
  status: 'active' | 'inactive' | 'discontinued';
}

export interface BOMNode {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  unitOfMeasure: string;
  level: number;
  children?: BOMNode[];
}

export interface BOMVersion {
  version: string;
  effectiveDate: string;
  status: 'draft' | 'active' | 'obsolete';
  nodes: BOMNode[];
  createdBy: string;
  createdAt: string;
}

export interface ProductBOM {
  productId: string;
  productName: string;
  versions: BOMVersion[];
}

// Work Order Types
export type WorkOrderStatus = 'created' | 'released' | 'in_progress' | 'completed' | 'cancelled';

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  productId: string;
  productName: string;
  productSku: string;
  qty: number;
  producedQty: number;
  scrapQty: number;
  status: WorkOrderStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  startDate?: string;
  completedDate?: string;
  bomVersion: string;
  assignedTo?: string;
  notes?: string;
  operations: WorkOrderOperation[];
  activityLog: ActivityLogEntry[];
  createdAt: string;
  createdBy: string;
}

export interface WorkOrderOperation {
  id: string;
  sequence: number;
  name: string;
  workCenter: string;
  setupTime: number;
  runTime: number;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  operator?: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details?: string;
}

// Quality Types
export type NCRStatus = 'open' | 'investigating' | 'closed';

export interface NonConformanceReport {
  id: string;
  ncrNumber: string;
  title: string;
  description: string;
  workOrderId?: string;
  workOrderNumber?: string;
  productId?: string;
  productName?: string;
  defectType: string;
  severity: 'minor' | 'major' | 'critical';
  status: NCRStatus;
  quantity: number;
  disposition?: 'scrap' | 'rework' | 'use_as_is' | 'return_to_vendor';
  rootCause?: string;
  correctiveAction?: string;
  reportedBy: string;
  reportedAt: string;
  assignedTo?: string;
  closedAt?: string;
  closedBy?: string;
  attachments?: string[];
}

export interface InspectionForm {
  id: string;
  name: string;
  productId?: string;
  checkpoints: InspectionCheckpoint[];
}

export interface InspectionCheckpoint {
  id: string;
  name: string;
  type: 'pass_fail' | 'measurement' | 'visual';
  specification?: string;
  minValue?: number;
  maxValue?: number;
  unit?: string;
}

export interface InspectionResult {
  id: string;
  formId: string;
  workOrderId: string;
  inspectorId: string;
  inspectorName: string;
  timestamp: string;
  overallResult: 'pass' | 'fail';
  results: CheckpointResult[];
}

export interface CheckpointResult {
  checkpointId: string;
  result: 'pass' | 'fail';
  value?: number | string;
  notes?: string;
}

// Machine/Integration Types
export type MachineStatus = 'online' | 'offline' | 'error' | 'maintenance';

export interface Machine {
  id: string;
  name: string;
  type: string;
  location: string;
  status: MachineStatus;
  lastHeartbeat: string;
  oee: number;
  currentJob?: string;
  cycleTime?: number;
  partCount?: number;
}

export interface Integration {
  id: string;
  name: string;
  type: 'opc_ua' | 'mqtt' | 'rest_api' | 'database';
  status: 'connected' | 'disconnected' | 'error';
  endpoint: string;
  lastSync?: string;
  config: Record<string, unknown>;
}

export interface TelemetryData {
  machineId: string;
  timestamp: string;
  temperature?: number;
  pressure?: number;
  vibration?: number;
  power?: number;
  cycleTime?: number;
  status?: MachineStatus;
}

// Shop Floor Types
export interface OperatorSession {
  operatorId: string;
  operatorName: string;
  clockInTime: string;
  clockOutTime?: string;
  workCenter?: string;
}

export interface ProductionEntry {
  id: string;
  workOrderId: string;
  operatorId: string;
  timestamp: string;
  qtyProduced: number;
  qtyScrap: number;
  inspectionResult?: 'pass' | 'fail';
  notes?: string;
}

// Planning Types
export interface MRPResult {
  id: string;
  runDate: string;
  plannedOrders: PlannedOrder[];
  suggestedPurchases: SuggestedPurchase[];
}

export interface PlannedOrder {
  productId: string;
  productName: string;
  qty: number;
  dueDate: string;
  reason: string;
}

export interface SuggestedPurchase {
  itemId: string;
  itemName: string;
  qty: number;
  suggestedDate: string;
  supplier?: string;
}

// Plant Types
export interface Plant {
  id: string;
  name: string;
  code: string;
  location: string;
  timezone: string;
}
