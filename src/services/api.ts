import { useAuthStore } from '@/stores/authStore';
import type {
  User,
  KPIData,
  ProductionData,
  InventoryItem,
  PaginatedResponse,
  Product,
  ProductBOM,
  WorkOrder,
  NonConformanceReport,
  Machine,
  Integration,
  Plant,
  MRPResult,
  InspectionForm,
  InspectionResult,
} from '@/types';

const API_BASE = '/api';

// Generic fetch wrapper with auth
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    return fetchApi<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getCurrentUser: async () => {
    return fetchApi<User>('/auth/me');
  },
};

// Dashboard API
export const dashboardApi = {
  getKpis: async () => {
    return fetchApi<KPIData>('/dashboard/kpis');
  },

  getProductionData: async (days: number = 7) => {
    return fetchApi<ProductionData[]>(`/dashboard/production?days=${days}`);
  },

  getRecentWorkOrders: async () => {
    return fetchApi<WorkOrder[]>('/dashboard/recent-workorders');
  },

  getRecentNCRs: async () => {
    return fetchApi<NonConformanceReport[]>('/dashboard/recent-ncrs');
  },
};

// Inventory API
export const inventoryApi = {
  getItems: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
  } = {}) => {
    const { page = 1, pageSize = 10, search = '', category = '' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search && { search }),
      ...(category && { category }),
    });
    return fetchApi<PaginatedResponse<InventoryItem>>(`/items?${queryParams}`);
  },

  getItem: async (id: string) => {
    return fetchApi<InventoryItem & { usedIn?: Array<{ productId: string; productName: string }> }>(
      `/items/${id}`
    );
  },
};

// Products & BOM API
export const productsApi = {
  getProducts: async () => {
    return fetchApi<Product[]>('/products');
  },

  getProduct: async (id: string) => {
    return fetchApi<Product>(`/products/${id}`);
  },

  getBom: async (productId: string) => {
    return fetchApi<ProductBOM>(`/boms/${productId}`);
  },
};

// Work Orders API
export const workOrdersApi = {
  getWorkOrders: async (params: { status?: string; priority?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.set('status', params.status);
    if (params.priority) queryParams.set('priority', params.priority);
    const query = queryParams.toString();
    return fetchApi<WorkOrder[]>(`/workorders${query ? `?${query}` : ''}`);
  },

  getWorkOrder: async (id: string) => {
    return fetchApi<WorkOrder>(`/workorders/${id}`);
  },

  createWorkOrder: async (data: {
    productId: string;
    qty: number;
    dueDate: string;
    priority: string;
    bomVersion: string;
    notes?: string;
  }) => {
    return fetchApi<WorkOrder>('/workorders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateWorkOrder: async (id: string, data: Partial<WorkOrder>) => {
    return fetchApi<WorkOrder>(`/workorders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  updateOperation: async (
    workOrderId: string,
    operationId: string,
    data: { status: string; operator?: string }
  ) => {
    return fetchApi<WorkOrder>(`/workorders/${workOrderId}/operations/${operationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Quality API
export const qualityApi = {
  getNCRs: async (params: { status?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.set('status', params.status);
    const query = queryParams.toString();
    return fetchApi<NonConformanceReport[]>(`/quality/ncrs${query ? `?${query}` : ''}`);
  },

  getNCR: async (id: string) => {
    return fetchApi<NonConformanceReport>(`/quality/ncrs/${id}`);
  },

  createNCR: async (data: {
    title: string;
    description: string;
    workOrderId?: string;
    productId?: string;
    defectType: string;
    severity: string;
    quantity: number;
  }) => {
    return fetchApi<NonConformanceReport>('/quality/ncrs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateNCR: async (id: string, data: Partial<NonConformanceReport>) => {
    return fetchApi<NonConformanceReport>(`/quality/ncrs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getInspectionForms: async () => {
    return fetchApi<InspectionForm[]>('/quality/inspection-forms');
  },

  getInspectionResults: async (workOrderId?: string) => {
    const query = workOrderId ? `?workOrderId=${workOrderId}` : '';
    return fetchApi<InspectionResult[]>(`/quality/inspection-results${query}`);
  },
};

// Machines API
export const machinesApi = {
  getMachines: async () => {
    return fetchApi<Machine[]>('/machines');
  },

  getMachine: async (id: string) => {
    return fetchApi<Machine>(`/machines/${id}`);
  },

  getIntegrations: async () => {
    return fetchApi<Integration[]>('/integrations');
  },

  updateIntegration: async (id: string, data: { status: string }) => {
    return fetchApi<Integration>(`/integrations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getTelemetry: async () => {
    return fetchApi<Array<{
      machineId: string;
      timestamp: string;
      temperature?: number;
      vibration?: number;
      power?: number;
      cycleTime?: number;
      status?: string;
    }>>('/machines/telemetry');
  },
};

// Plants API
export const plantsApi = {
  getPlants: async () => {
    return fetchApi<Plant[]>('/plants');
  },
};

// Planning API
export const planningApi = {
  runMRP: async () => {
    return fetchApi<MRPResult>('/planning/mrp', {
      method: 'POST',
    });
  },
};

// Shop Floor API
export const shopFloorApi = {
  clockIn: async (operatorId: string, workCenter?: string) => {
    return fetchApi<{
      operatorId: string;
      operatorName: string;
      clockInTime: string;
      workCenter?: string;
    }>('/shopfloor/clock-in', {
      method: 'POST',
      body: JSON.stringify({ operatorId, workCenter }),
    });
  },

  recordProduction: async (data: {
    workOrderId: string;
    operatorId: string;
    qtyProduced: number;
    qtyScrap: number;
    inspectionResult?: 'pass' | 'fail';
    notes?: string;
  }) => {
    return fetchApi<{
      id: string;
      workOrderId: string;
      operatorId: string;
      timestamp: string;
      qtyProduced: number;
      qtyScrap: number;
      inspectionResult?: 'pass' | 'fail';
      notes?: string;
    }>('/shopfloor/production', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

/*
 * Example fetch usage (for documentation):
 *
 * // Get KPIs
 * const kpis = await dashboardApi.getKpis();
 * console.log(kpis.oee);
 *
 * // Create work order
 * const workOrder = await workOrdersApi.createWorkOrder({
 *   productId: 'prd-001',
 *   qty: 50,
 *   dueDate: '2025-12-15',
 *   priority: 'high',
 *   bomVersion: '1.2',
 * });
 *
 * // Using cURL:
 * // curl -X POST http://localhost:3000/api/auth/login \
 * //   -H "Content-Type: application/json" \
 * //   -d '{"email": "maria.garcia@manufacturing.demo", "password": "demo123"}'
 */
