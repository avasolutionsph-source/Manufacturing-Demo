import { clsx } from 'clsx';

export interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  primary: 'bg-primary-100 text-primary-800',
  secondary: 'bg-secondary-100 text-secondary-800',
  success: 'bg-success-100 text-success-800',
  warning: 'bg-warning-100 text-warning-800',
  danger: 'bg-danger-100 text-danger-800',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
};

export function Badge({ variant = 'secondary', size = 'sm', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// Status-specific badge component
export type StatusType =
  | 'created'
  | 'released'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'open'
  | 'investigating'
  | 'closed'
  | 'online'
  | 'offline'
  | 'error'
  | 'maintenance'
  | 'connected'
  | 'disconnected'
  | 'active'
  | 'inactive'
  | 'discontinued'
  | 'draft'
  | 'obsolete'
  | 'pending';

const statusVariantMap: Record<StatusType, BadgeProps['variant']> = {
  created: 'secondary',
  released: 'primary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
  open: 'warning',
  investigating: 'primary',
  closed: 'success',
  online: 'success',
  offline: 'secondary',
  error: 'danger',
  maintenance: 'warning',
  connected: 'success',
  disconnected: 'secondary',
  active: 'success',
  inactive: 'secondary',
  discontinued: 'danger',
  draft: 'secondary',
  obsolete: 'danger',
  pending: 'secondary',
};

const statusLabelMap: Record<StatusType, string> = {
  created: 'Created',
  released: 'Released',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  open: 'Open',
  investigating: 'Investigating',
  closed: 'Closed',
  online: 'Online',
  offline: 'Offline',
  error: 'Error',
  maintenance: 'Maintenance',
  connected: 'Connected',
  disconnected: 'Disconnected',
  active: 'Active',
  inactive: 'Inactive',
  discontinued: 'Discontinued',
  draft: 'Draft',
  obsolete: 'Obsolete',
  pending: 'Pending',
};

export interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  return (
    <Badge variant={statusVariantMap[status]} size={size} className={className}>
      {statusLabelMap[status]}
    </Badge>
  );
}
