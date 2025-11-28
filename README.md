# Manufacturing Demo

A modern, frontend-only demo web application showcasing core user flows of a manufacturing ERP system. Built with React, TypeScript, and Tailwind CSS.

![Manufacturing Demo](./docs/screenshot-placeholder.png)

## Project Overview

This demo application simulates a manufacturing ERP system with features including:

- **Dashboard** - KPI cards (OEE, On-time delivery, Inventory Turns, Open Work Orders), production charts, recent work orders and quality alerts
- **Inventory Management** - Searchable, paginated inventory table with item details, BOM information, lot tracking, and transaction history
- **Products & BOM** - Multi-level bill of materials with version history and expandable tree view
- **Work Orders** - Create, track, and manage work orders through their lifecycle (Created → Released → In Progress → Completed)
- **Shop Floor Terminal** - Operator interface for clock-in/out, work order selection, and production recording
- **Quality Management** - Nonconformance report (NCR) tracking with severity levels and lifecycle management
- **Settings & Integrations** - Mock OPC-UA/MQTT connector status with simulated machine telemetry

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Zustand** for state management
- **React Query** for data fetching
- **Recharts** for charts
- **MSW (Mock Service Worker)** for API mocking
- **Framer Motion** for animations
- **Lucide React** for icons
- **Vitest + React Testing Library** for testing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository (or extract the zip)
cd manufacturing-demo

# Install dependencies
npm install
```

### Running the Application

```bash
# Start the development server with mock API
npm run dev
```

The application will open at `http://localhost:3000`. The MSW service worker will automatically intercept API requests.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Planner | sarah.johnson@manufacturing.demo | demo123 |
| Shop Foreman | mike.rodriguez@manufacturing.demo | demo123 |
| Quality Inspector | emily.chen@manufacturing.demo | demo123 |
| Admin | admin@manufacturing.demo | admin123 |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |

## Project Structure

```
manufacturing-demo/
├── public/
│   └── logo.svg                 # Application logo
├── src/
│   ├── components/
│   │   ├── layout/              # Layout components (Header, Sidebar, AppLayout)
│   │   ├── ui/                  # Reusable UI components (Button, Input, Modal, etc.)
│   │   ├── BomTree.tsx          # Bill of Materials tree component
│   │   ├── Chart.tsx            # Chart components
│   │   ├── KpiCard.tsx          # KPI card component
│   │   ├── Notifications.tsx    # Toast notifications
│   │   └── WorkOrderForm.tsx    # Work order creation form
│   ├── mocks/
│   │   ├── data/                # Sample JSON data files
│   │   ├── handlers.ts          # MSW request handlers
│   │   ├── browser.ts           # MSW browser setup
│   │   └── api-spec.json        # OpenAPI-like specification
│   ├── pages/
│   │   ├── Dashboard.tsx        # Dashboard page
│   │   ├── Inventory.tsx        # Inventory page
│   │   ├── Products.tsx         # Products & BOM page
│   │   ├── WorkOrders.tsx       # Work orders page
│   │   ├── ShopFloor.tsx        # Shop floor terminal
│   │   ├── Quality.tsx          # Quality management page
│   │   ├── Settings.tsx         # Settings & integrations
│   │   └── Login.tsx            # Login page
│   ├── services/
│   │   └── api.ts               # API service functions
│   ├── stores/
│   │   ├── authStore.ts         # Authentication state
│   │   └── uiStore.ts           # UI and shop floor state
│   ├── styles/
│   │   ├── index.css            # Global styles and Tailwind
│   │   └── tokens.ts            # Design tokens
│   ├── tests/
│   │   ├── setup.ts             # Test setup
│   │   ├── KpiCard.test.tsx     # Unit test
│   │   └── Dashboard.test.tsx   # Integration test
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── App.tsx                  # Root application component
│   └── main.tsx                 # Application entry point
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

## API Endpoints

The mock API provides these endpoints (see `src/mocks/api-spec.json` for full spec):

### Authentication
- `POST /api/auth/login` - User login

### Dashboard
- `GET /api/dashboard/kpis` - Get KPI data
- `GET /api/dashboard/production?days=7` - Get production data

### Inventory
- `GET /api/items?page=1&search=` - List inventory items
- `GET /api/items/:id` - Get item details with BOM

### Products & BOM
- `GET /api/products` - List products
- `GET /api/boms/:productId` - Get product BOM

### Work Orders
- `GET /api/workorders` - List work orders
- `POST /api/workorders` - Create work order
- `PATCH /api/workorders/:id` - Update work order

### Quality
- `GET /api/quality/ncrs` - List NCRs
- `POST /api/quality/ncrs` - Create NCR
- `PATCH /api/quality/ncrs/:id` - Update NCR

### Machines & Integrations
- `GET /api/machines` - List machines with status
- `GET /api/integrations` - List integrations
- `PATCH /api/integrations/:id` - Toggle integration

### Planning
- `POST /api/planning/mrp` - Run MRP simulation

### Example API Call

```typescript
// Using fetch
const response = await fetch('/api/dashboard/kpis');
const kpis = await response.json();
console.log(kpis.oee); // 78.5

// Using cURL
curl http://localhost:3000/api/dashboard/kpis
```

## Key Features

### Role-Based Views
Switch between roles (Planner, Shop Foreman, Quality Inspector, Admin) using the role selector in the header. Each role has access to different navigation items.

### Work Order Lifecycle
1. Create a work order from the Work Orders page
2. Release it to make it available on the shop floor
3. Start production from the Shop Floor terminal
4. Record production quantities and QC results
5. Complete the work order

### MRP Simulation
Click "Run MRP" on the dashboard to simulate material requirements planning, generating suggested work orders and purchase orders.

### Shop Floor Terminal
1. Clock in as an operator
2. Select an available work order
3. Record production quantities and scrap
4. Mark inspection pass/fail
5. Clock out when done

## Acceptance Criteria Checklist

- [x] `npm install` and `npm run dev` starts the app with MSW active
- [x] Login screen appears; demo credentials work
- [x] Dashboard loads with KPI numbers and production chart
- [x] Inventory page shows searchable, paginated table
- [x] Clicking inventory item opens modal with BOM and transactions
- [x] Work Orders page allows creating and transitioning work orders
- [x] Shop Floor can start work orders and record production
- [x] Quality page can create NCRs and change status
- [x] Tests run with `npm test` and pass
- [x] UI is responsive and accessible by keyboard

## Design Decisions

- **Frontend Only**: All data is mocked using MSW; no persistent database required
- **Modular Components**: Small, well-named components with TypeScript types
- **Clean UX**: Focus on planner and shop-floor flows
- **Accessibility**: ARIA attributes, keyboard navigation, color contrast
- **Responsive**: Mobile-first design that works on all screen sizes

## What's Mocked vs. Real Implementation

### Currently Mocked
- Authentication (no security, token stored in localStorage)
- All API endpoints (MSW handlers with in-memory state)
- Machine telemetry (static data with simulated updates)
- MRP calculations (returns predefined suggestions)

### For Production Implementation
- Replace MSW with real backend APIs
- Add proper authentication with JWT/OAuth
- Connect to actual OPC-UA/MQTT servers for machine data
- Implement real MRP logic with demand forecasting
- Add persistent database for all entities
- Implement real-time WebSocket connections for telemetry

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - Demo purposes only.

---

Built as a demonstration of modern manufacturing ERP user interfaces.
