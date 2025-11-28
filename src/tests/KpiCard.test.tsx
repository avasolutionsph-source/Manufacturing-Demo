import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCard } from '../components/KpiCard';
import { Gauge } from 'lucide-react';

describe('KpiCard', () => {
  it('renders the title and value correctly', () => {
    render(<KpiCard title="OEE" value={85.5} unit="%" icon={<Gauge />} />);

    expect(screen.getByText('OEE')).toBeInTheDocument();
    expect(screen.getByText('85.5')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('displays positive trend correctly', () => {
    render(
      <KpiCard
        title="On-Time Delivery"
        value={94}
        unit="%"
        trend={{ value: 2.5, isPositive: true }}
      />
    );

    expect(screen.getByText('+2.5%')).toBeInTheDocument();
    expect(screen.getByText('vs last period')).toBeInTheDocument();
  });

  it('displays negative trend correctly', () => {
    render(
      <KpiCard
        title="Inventory Turns"
        value={6}
        trend={{ value: -1.2, isPositive: false }}
      />
    );

    expect(screen.getByText('-1.2%')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(
      <KpiCard title="OEE" value={0} isLoading />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders without trend', () => {
    render(<KpiCard title="Open Work Orders" value={24} />);

    expect(screen.getByText('Open Work Orders')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.queryByText('vs last period')).not.toBeInTheDocument();
  });

  it('applies correct color styling', () => {
    const { container } = render(
      <KpiCard title="OEE" value={85} color="success" />
    );

    expect(container.querySelector('.border-success-200')).toBeInTheDocument();
  });
});
