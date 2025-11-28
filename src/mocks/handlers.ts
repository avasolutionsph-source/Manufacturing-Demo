import { http, HttpResponse, delay } from 'msw';
import usersData from './data/users.json';
import dashboardData from './data/dashboard.json';
import inventoryData from './data/inventory.json';
import productsData from './data/products.json';
import workOrdersData from './data/workorders.json';
import qualityData from './data/quality.json';
import machinesData from './data/machines.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

// Mutable state for demo (arrays need to be reassignable for mutations)
const workOrders: AnyRecord[] = [...workOrdersData.workOrders];
const ncrs: AnyRecord[] = [...qualityData.ncrs];
const inventoryItems: AnyRecord[] = [...inventoryData.items];

// Helper to generate IDs
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    await delay(500);
    const body = await request.json() as { email: string; password: string };
    const user = usersData.users.find(
      (u) => u.email === body.email && u.password === body.password
    );

    if (user) {
      const { password: _password, ...userWithoutPassword } = user;
      void _password; // Explicitly unused
      return HttpResponse.json({
        token: `mock-jwt-token-${user.id}`,
        user: userWithoutPassword,
      });
    }

    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.get('/api/auth/me', async ({ request }) => {
    await delay(200);
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer mock-jwt-token-')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer mock-jwt-token-', '');
    const user = usersData.users.find((u) => u.id === userId);

    if (user) {
      const { password: _password, ...userWithoutPassword } = user;
      void _password; // Explicitly unused
      return HttpResponse.json(userWithoutPassword);
    }

    return HttpResponse.json({ error: 'User not found' }, { status: 404 });
  }),

  // Dashboard endpoints
  http.get('/api/dashboard/kpis', async () => {
    await delay(300);
    return HttpResponse.json(dashboardData.kpis);
  }),

  http.get('/api/dashboard/production', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7');
    const data = dashboardData.productionData.slice(-days);
    return HttpResponse.json(data);
  }),

  http.get('/api/dashboard/recent-workorders', async () => {
    await delay(200);
    return HttpResponse.json(dashboardData.recentWorkOrders);
  }),

  http.get('/api/dashboard/recent-ncrs', async () => {
    await delay(200);
    return HttpResponse.json(dashboardData.recentNCRs);
  }),

  // Inventory endpoints
  http.get('/api/items', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const category = url.searchParams.get('category') || '';

    let filtered = inventoryItems;

    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.sku.toLowerCase().includes(search) ||
          item.name.toLowerCase().includes(search) ||
          item.location.toLowerCase().includes(search)
      );
    }

    if (category) {
      filtered = filtered.filter((item) => item.category === category);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages,
    });
  }),

  http.get('/api/items/:id', async ({ params }) => {
    await delay(300);
    const item = inventoryItems.find((i) => i.id === params.id);

    if (!item) {
      return HttpResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Get BOM info if this item is used in products
    const productBoms = Object.values(productsData.boms);
    const usedIn = productBoms
      .filter((bom) =>
        bom.versions.some((v) =>
          v.nodes.some((n) => n.itemId === item.id)
        )
      )
      .map((bom) => ({
        productId: bom.productId,
        productName: bom.productName,
      }));

    return HttpResponse.json({
      ...item,
      usedIn,
    });
  }),

  // Products & BOM endpoints
  http.get('/api/products', async () => {
    await delay(300);
    return HttpResponse.json(productsData.products);
  }),

  http.get('/api/products/:id', async ({ params }) => {
    await delay(200);
    const product = productsData.products.find((p) => p.id === params.id);

    if (!product) {
      return HttpResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return HttpResponse.json(product);
  }),

  http.get('/api/boms/:productId', async ({ params }) => {
    await delay(300);
    const bom = productsData.boms[params.productId as keyof typeof productsData.boms];

    if (!bom) {
      return HttpResponse.json({ error: 'BOM not found' }, { status: 404 });
    }

    return HttpResponse.json(bom);
  }),

  // Work Orders endpoints
  http.get('/api/workorders', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');

    let filtered = workOrders;

    if (status) {
      filtered = filtered.filter((wo) => wo.status === status);
    }

    if (priority) {
      filtered = filtered.filter((wo) => wo.priority === priority);
    }

    return HttpResponse.json(filtered);
  }),

  http.get('/api/workorders/:id', async ({ params }) => {
    await delay(200);
    const workOrder = workOrders.find((wo) => wo.id === params.id);

    if (!workOrder) {
      return HttpResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    return HttpResponse.json(workOrder);
  }),

  http.post('/api/workorders', async ({ request }) => {
    await delay(500);
    const body = await request.json() as {
      productId: string;
      qty: number;
      dueDate: string;
      priority: string;
      bomVersion: string;
      notes?: string;
    };

    const product = productsData.products.find((p) => p.id === body.productId);
    if (!product) {
      return HttpResponse.json({ error: 'Product not found' }, { status: 400 });
    }

    const newWorkOrder = {
      id: generateId('wo'),
      workOrderNumber: `WO-2025-${String(workOrders.length + 6).padStart(3, '0')}`,
      productId: body.productId,
      productName: product.name,
      productSku: product.sku,
      qty: body.qty,
      producedQty: 0,
      scrapQty: 0,
      status: 'created' as const,
      priority: body.priority as 'low' | 'medium' | 'high' | 'urgent',
      dueDate: body.dueDate,
      bomVersion: body.bomVersion,
      notes: body.notes,
      operations: [
        {
          id: generateId('op'),
          sequence: 10,
          name: 'Preparation',
          workCenter: 'WC-PREP',
          setupTime: 30,
          runTime: 20,
          status: 'pending' as const,
        },
        {
          id: generateId('op'),
          sequence: 20,
          name: 'Assembly',
          workCenter: 'WC-ASSY',
          setupTime: 20,
          runTime: 30,
          status: 'pending' as const,
        },
        {
          id: generateId('op'),
          sequence: 30,
          name: 'Quality Check',
          workCenter: 'WC-QC',
          setupTime: 10,
          runTime: 15,
          status: 'pending' as const,
        },
      ],
      activityLog: [
        {
          id: generateId('log'),
          timestamp: new Date().toISOString(),
          action: 'Work order created',
          user: 'Current User',
        },
      ],
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
    };

    workOrders.push(newWorkOrder);
    return HttpResponse.json(newWorkOrder, { status: 201 });
  }),

  http.patch('/api/workorders/:id', async ({ params, request }) => {
    await delay(400);
    const body = await request.json() as Partial<typeof workOrders[0]>;
    const index = workOrders.findIndex((wo) => wo.id === params.id);

    if (index === -1) {
      return HttpResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const workOrder = workOrders[index];

    // Handle status change
    if (body.status && body.status !== workOrder.status) {
      workOrder.activityLog.push({
        id: generateId('log'),
        timestamp: new Date().toISOString(),
        action: `Status changed to ${body.status}`,
        user: 'Current User',
      });

      if (body.status === 'in_progress' && !workOrder.startDate) {
        workOrder.startDate = new Date().toISOString();
      }

      if (body.status === 'completed') {
        workOrder.completedDate = new Date().toISOString();
      }
    }

    // Handle production updates
    if (body.producedQty !== undefined) {
      workOrder.activityLog.push({
        id: generateId('log'),
        timestamp: new Date().toISOString(),
        action: `Produced qty updated: ${body.producedQty} units`,
        user: 'Current User',
      });
    }

    workOrders[index] = { ...workOrder, ...body };
    return HttpResponse.json(workOrders[index]);
  }),

  http.patch('/api/workorders/:id/operations/:opId', async ({ params, request }) => {
    await delay(300);
    const body = await request.json() as { status: string; operator?: string };
    const workOrder = workOrders.find((wo) => wo.id === params.id);

    if (!workOrder) {
      return HttpResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const operation = workOrder.operations.find((op: AnyRecord) => op.id === params.opId);
    if (!operation) {
      return HttpResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    if (body.status === 'in_progress') {
      operation.status = 'in_progress';
      operation.startedAt = new Date().toISOString();
      operation.operator = body.operator;
    } else if (body.status === 'completed') {
      operation.status = 'completed';
      operation.completedAt = new Date().toISOString();
    }

    workOrder.activityLog.push({
      id: generateId('log'),
      timestamp: new Date().toISOString(),
      action: `Operation ${operation.sequence} (${operation.name}) ${body.status === 'in_progress' ? 'started' : 'completed'}`,
      user: body.operator || 'Current User',
    });

    return HttpResponse.json(workOrder);
  }),

  // Quality endpoints
  http.get('/api/quality/ncrs', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let filtered = ncrs;
    if (status) {
      filtered = filtered.filter((ncr) => ncr.status === status);
    }

    return HttpResponse.json(filtered);
  }),

  http.get('/api/quality/ncrs/:id', async ({ params }) => {
    await delay(200);
    const ncr = ncrs.find((n) => n.id === params.id);

    if (!ncr) {
      return HttpResponse.json({ error: 'NCR not found' }, { status: 404 });
    }

    return HttpResponse.json(ncr);
  }),

  http.post('/api/quality/ncrs', async ({ request }) => {
    await delay(500);
    const body = await request.json() as {
      title: string;
      description: string;
      workOrderId?: string;
      productId?: string;
      defectType: string;
      severity: string;
      quantity: number;
    };

    const workOrder = body.workOrderId
      ? workOrders.find((wo) => wo.id === body.workOrderId)
      : null;

    const product = body.productId
      ? productsData.products.find((p) => p.id === body.productId)
      : workOrder
      ? productsData.products.find((p) => p.id === workOrder.productId)
      : null;

    const newNCR = {
      id: generateId('ncr'),
      ncrNumber: `NCR-2025-${String(ncrs.length + 6).padStart(3, '0')}`,
      title: body.title,
      description: body.description,
      workOrderId: body.workOrderId,
      workOrderNumber: workOrder?.workOrderNumber,
      productId: product?.id,
      productName: product?.name,
      defectType: body.defectType,
      severity: body.severity as 'minor' | 'major' | 'critical',
      status: 'open' as const,
      quantity: body.quantity,
      reportedBy: 'Current User',
      reportedAt: new Date().toISOString(),
    };

    ncrs.push(newNCR);
    return HttpResponse.json(newNCR, { status: 201 });
  }),

  http.patch('/api/quality/ncrs/:id', async ({ params, request }) => {
    await delay(400);
    const body = await request.json() as Partial<typeof ncrs[0]>;
    const index = ncrs.findIndex((n) => n.id === params.id);

    if (index === -1) {
      return HttpResponse.json({ error: 'NCR not found' }, { status: 404 });
    }

    const ncr = ncrs[index];

    if (body.status === 'closed' && ncr.status !== 'closed') {
      ncr.closedAt = new Date().toISOString();
      ncr.closedBy = 'Current User';
    }

    ncrs[index] = { ...ncr, ...body };
    return HttpResponse.json(ncrs[index]);
  }),

  http.get('/api/quality/inspection-forms', async () => {
    await delay(200);
    return HttpResponse.json(qualityData.inspectionForms);
  }),

  http.get('/api/quality/inspection-results', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const workOrderId = url.searchParams.get('workOrderId');

    let results = qualityData.inspectionResults;
    if (workOrderId) {
      results = results.filter((r) => r.workOrderId === workOrderId);
    }

    return HttpResponse.json(results);
  }),

  // Machines endpoints
  http.get('/api/machines', async () => {
    await delay(300);
    return HttpResponse.json(machinesData.machines);
  }),

  http.get('/api/machines/:id', async ({ params }) => {
    await delay(200);
    const machine = machinesData.machines.find((m) => m.id === params.id);

    if (!machine) {
      return HttpResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    return HttpResponse.json(machine);
  }),

  http.get('/api/integrations', async () => {
    await delay(300);
    return HttpResponse.json(machinesData.integrations);
  }),

  http.patch('/api/integrations/:id', async ({ params, request }) => {
    await delay(400);
    const body = await request.json() as { status: string };
    const integration = machinesData.integrations.find((i) => i.id === params.id);

    if (!integration) {
      return HttpResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    integration.status = body.status as 'connected' | 'disconnected' | 'error';
    integration.lastSync = new Date().toISOString();

    return HttpResponse.json(integration);
  }),

  http.get('/api/machines/telemetry', async () => {
    await delay(200);
    return HttpResponse.json(machinesData.telemetryHistory);
  }),

  // Plants endpoint
  http.get('/api/plants', async () => {
    await delay(200);
    return HttpResponse.json(usersData.plants);
  }),

  // MRP simulation endpoint
  http.post('/api/planning/mrp', async () => {
    await delay(1500);

    // Simulate MRP results
    const mrpResult = {
      id: generateId('mrp'),
      runDate: new Date().toISOString(),
      plannedOrders: [
        {
          productId: 'prd-002',
          productName: 'Hydraulic Pump Unit',
          qty: 15,
          dueDate: '2025-12-15',
          reason: 'Customer demand forecast',
        },
        {
          productId: 'prd-003',
          productName: 'Control Panel Assembly',
          qty: 50,
          dueDate: '2025-12-20',
          reason: 'Safety stock replenishment',
        },
      ],
      suggestedPurchases: [
        {
          itemId: 'inv-001',
          itemName: 'Ball Valve 2-inch',
          qty: 100,
          suggestedDate: '2025-12-08',
          supplier: 'ValveCo Inc.',
        },
        {
          itemId: 'inv-002',
          itemName: 'Precision Bearing 6205',
          qty: 200,
          suggestedDate: '2025-12-05',
          supplier: 'BearingWorld',
        },
        {
          itemId: 'inv-004',
          itemName: 'Hydraulic Pump Assembly',
          qty: 25,
          suggestedDate: '2025-12-10',
          supplier: 'HydroParts Ltd.',
        },
      ],
    };

    return HttpResponse.json(mrpResult);
  }),

  // Shop floor endpoints
  http.post('/api/shopfloor/clock-in', async ({ request }) => {
    await delay(300);
    const body = await request.json() as { operatorId: string; workCenter?: string };

    return HttpResponse.json({
      operatorId: body.operatorId,
      operatorName: usersData.users.find(u => u.id === body.operatorId)?.name || 'Unknown',
      clockInTime: new Date().toISOString(),
      workCenter: body.workCenter,
    });
  }),

  http.post('/api/shopfloor/production', async ({ request }) => {
    await delay(400);
    const body = await request.json() as {
      workOrderId: string;
      operatorId: string;
      qtyProduced: number;
      qtyScrap: number;
      inspectionResult?: 'pass' | 'fail';
      notes?: string;
    };

    const workOrder = workOrders.find(wo => wo.id === body.workOrderId);
    if (!workOrder) {
      return HttpResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Update work order quantities
    workOrder.producedQty += body.qtyProduced;
    workOrder.scrapQty += body.qtyScrap;

    workOrder.activityLog.push({
      id: generateId('log'),
      timestamp: new Date().toISOString(),
      action: `Production recorded: ${body.qtyProduced} produced, ${body.qtyScrap} scrapped`,
      user: usersData.users.find(u => u.id === body.operatorId)?.name || 'Unknown',
      details: body.notes,
    });

    const entry = {
      id: generateId('prod'),
      workOrderId: body.workOrderId,
      operatorId: body.operatorId,
      timestamp: new Date().toISOString(),
      qtyProduced: body.qtyProduced,
      qtyScrap: body.qtyScrap,
      inspectionResult: body.inspectionResult,
      notes: body.notes,
    };

    return HttpResponse.json(entry, { status: 201 });
  }),
];
