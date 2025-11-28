import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
  isLoading?: boolean;
}

const colorStyles = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'text-primary-600',
    border: 'border-primary-200',
  },
  success: {
    bg: 'bg-success-50',
    icon: 'text-success-600',
    border: 'border-success-200',
  },
  warning: {
    bg: 'bg-warning-50',
    icon: 'text-warning-600',
    border: 'border-warning-200',
  },
  danger: {
    bg: 'bg-danger-50',
    icon: 'text-danger-600',
    border: 'border-danger-200',
  },
  secondary: {
    bg: 'bg-secondary-50',
    icon: 'text-secondary-600',
    border: 'border-secondary-200',
  },
};

export function KpiCard({
  title,
  value,
  unit,
  trend,
  icon,
  color = 'primary',
  isLoading = false,
}: KpiCardProps) {
  const styles = colorStyles[color];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 p-5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-secondary-200 rounded w-24" />
          <div className="w-10 h-10 bg-secondary-200 rounded-lg" />
        </div>
        <div className="h-8 bg-secondary-200 rounded w-20 mb-2" />
        <div className="h-4 bg-secondary-200 rounded w-16" />
      </div>
    );
  }

  return (
    <div className={clsx('bg-white rounded-xl border p-5 transition-shadow hover:shadow-md', styles.border)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-secondary-600">{title}</h3>
        {icon && (
          <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', styles.bg)}>
            <span className={styles.icon}>{icon}</span>
          </div>
        )}
      </div>

      <div className="flex items-end gap-1 mb-1">
        <span className="text-2xl font-bold text-secondary-900">{value}</span>
        {unit && <span className="text-sm text-secondary-500 mb-1">{unit}</span>}
      </div>

      {trend && (
        <div className="flex items-center gap-1">
          {trend.value === 0 ? (
            <Minus className="w-4 h-4 text-secondary-400" aria-hidden="true" />
          ) : trend.isPositive ? (
            <TrendingUp className="w-4 h-4 text-success-500" aria-hidden="true" />
          ) : (
            <TrendingDown className="w-4 h-4 text-danger-500" aria-hidden="true" />
          )}
          <span
            className={clsx(
              'text-sm font-medium',
              trend.value === 0
                ? 'text-secondary-500'
                : trend.isPositive
                ? 'text-success-600'
                : 'text-danger-600'
            )}
          >
            {trend.value > 0 ? '+' : ''}
            {trend.value}%
          </span>
          <span className="text-sm text-secondary-500">vs last period</span>
        </div>
      )}
    </div>
  );
}

// Compact KPI for dashboard grid
export interface MiniKpiProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export function MiniKpi({ label, value, icon }: MiniKpiProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
      {icon && <span className="text-secondary-500">{icon}</span>}
      <div>
        <p className="text-xs text-secondary-500">{label}</p>
        <p className="text-sm font-semibold text-secondary-900">{value}</p>
      </div>
    </div>
  );
}
