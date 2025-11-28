import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface ChartData {
  [key: string]: string | number;
}

// Production Line Chart
export interface ProductionChartProps {
  data: Array<{ date: string; qty: number }>;
  height?: number;
  isLoading?: boolean;
}

export function ProductionChart({ data, height = 300, isLoading = false }: ProductionChartProps) {
  if (isLoading) {
    return (
      <div className="w-full animate-pulse" style={{ height }}>
        <div className="h-full bg-secondary-100 rounded-lg" />
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM d'),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="formattedDate"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{ color: '#1e293b', fontWeight: 600 }}
          formatter={(value: number) => [`${value} units`, 'Production']}
        />
        <Area
          type="monotone"
          dataKey="qty"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorQty)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// OEE Gauge Chart (simplified as a progress bar style)
export interface OeeGaugeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
}

export function OeeGauge({ value, size = 'md' }: OeeGaugeProps) {
  const sizeStyles = {
    sm: { width: 80, height: 80, fontSize: 'text-sm' },
    md: { width: 120, height: 120, fontSize: 'text-lg' },
    lg: { width: 160, height: 160, fontSize: 'text-2xl' },
  };

  const { width, height, fontSize } = sizeStyles[size];
  const strokeWidth = size === 'sm' ? 6 : size === 'md' ? 8 : 10;
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 85) return '#22c55e';
    if (val >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width, height }}>
      <svg width={width} height={height} className="transform -rotate-90">
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-bold text-secondary-900 ${fontSize}`}>{value}%</span>
        <span className="text-xs text-secondary-500">OEE</span>
      </div>
    </div>
  );
}

// Generic Bar Chart
export interface BarChartComponentProps {
  data: ChartData[];
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
  isLoading?: boolean;
}

export function BarChartComponent({
  data,
  xKey,
  yKey,
  height = 300,
  color = '#3b82f6',
  isLoading = false,
}: BarChartComponentProps) {
  if (isLoading) {
    return (
      <div className="w-full animate-pulse" style={{ height }}>
        <div className="h-full bg-secondary-100 rounded-lg" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Multi-Line Chart
export interface MultiLineChartProps {
  data: ChartData[];
  xKey: string;
  lines: Array<{ key: string; color: string; name: string }>;
  height?: number;
  isLoading?: boolean;
}

export function MultiLineChart({
  data,
  xKey,
  lines,
  height = 300,
  isLoading = false,
}: MultiLineChartProps) {
  if (isLoading) {
    return (
      <div className="w-full animate-pulse" style={{ height }}>
        <div className="h-full bg-secondary-100 rounded-lg" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            name={line.name}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
