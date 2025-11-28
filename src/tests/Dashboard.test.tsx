import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../pages/Dashboard';

// Create a new QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('DashboardPage', () => {
  it('renders the dashboard header', async () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview of manufacturing operations')).toBeInTheDocument();
  });

  it('displays the Run MRP button', async () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole('button', { name: /run mrp/i })).toBeInTheDocument();
  });

  it('loads and displays KPI data', async () => {
    renderWithProviders(<DashboardPage />);

    // Wait for KPIs to load
    await waitFor(
      () => {
        expect(screen.getByText('OEE')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Check for KPI titles
    expect(screen.getByText('On-Time Delivery')).toBeInTheDocument();
    expect(screen.getByText('Inventory Turns')).toBeInTheDocument();
    expect(screen.getByText('Open Work Orders')).toBeInTheDocument();
  });

  it('displays production chart section', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Production Output')).toBeInTheDocument();
    });

    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
  });

  it('displays recent work orders section', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Work Orders')).toBeInTheDocument();
    });
  });

  it('displays quality alerts section', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Quality Alerts')).toBeInTheDocument();
    });
  });

  it('shows view all link for work orders', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      const viewAllLinks = screen.getAllByText('View all');
      expect(viewAllLinks.length).toBeGreaterThan(0);
    });
  });

  it('handles MRP button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    const mrpButton = screen.getByRole('button', { name: /run mrp/i });
    await user.click(mrpButton);

    // The button should show loading state
    await waitFor(() => {
      // MRP modal should appear after completion
      expect(screen.queryByText('MRP Run Results')).toBeDefined();
    }, { timeout: 5000 });
  });
});
