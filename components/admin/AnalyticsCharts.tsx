'use client';

import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { STATUS_CONFIG } from '@/lib/admin-utils';
import { TrendingUp, Users, Target, Clock } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// ── Types ──────────────────────────────────────────────────────────────────

interface TimeseriesItem {
  date: string;
  contacts: number;
  newsletters: number;
  bookings: number;
}
interface WorkshopItem {
  name: string;
  count: number;
}
interface StatusItem {
  status: keyof typeof STATUS_CONFIG;
  count: number;
}
interface TagItem {
  tag: string;
  count: number;
}
interface QuarterlyItem {
  month: string;
  contacts: number;
  bookings: number;
}

interface AnalyticsData {
  timeseries: TimeseriesItem[];
  workshopPopularity: WorkshopItem[];
  contactStatus: StatusItem[];
  totals: { contacts: number };
  conversion: { contacts: { rate: number | string; converted: number } };
  responseMetrics: { avgResponseTimeHours: number | string; pendingCount: number };
  quarterlyTrend: QuarterlyItem[];
  tagUsage: TagItem[];
}

interface TooltipEntry {
  color: string;
  name: string;
  value: number;
}
interface TooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

// ── Status colors (DESIGN-ADMIN.md) ───────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  new: '#60A5FA',
  contacted: '#FBBF24',
  converted: '#10B981',
  archived: '#F87171',
};

// ── Shared chart styling constants ─────────────────────────────────────────

const GRID = { stroke: '#AEB7C1', strokeOpacity: 0.08, strokeDasharray: '3 3' } as const;
const AXIS = {
  style: { fontSize: 11, fill: '#AEB7C1' },
  stroke: '#AEB7C1',
  axisLine: false,
  tickLine: false,
} as const;
const TOOLTIP_STYLE = {
  backgroundColor: '#1A1A1A',
  border: '1px solid #1B1B1B',
  borderRadius: '6px',
  color: '#F7F7F5',
  fontSize: '0.75rem',
  padding: '0.75rem',
} as const;
const CURSOR = { fill: '#AEB7C1', fillOpacity: 0.05 } as const;

// ── Custom tooltip ─────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-[0.65rem] uppercase tracking-[0.1em] text-[#AEB7C1] mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-[0.75rem]" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Reusable card wrapper (matches StatCard baseline) ──────────────────────

function ChartCard({
  title,
  subtitle,
  children,
  delay = 0,
  rm,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
  rm: boolean;
}) {
  return (
    <motion.div
      initial={rm ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        borderRadius: '16px',
      }}
      className="p-6"
    >
      <h3 className="text-[1.125rem] font-semibold text-[#F7F7F5] mb-1">{title}</h3>
      <p className="text-[0.75rem] font-medium text-[#AEB7C1] uppercase tracking-[0.05em] mb-6">
        {subtitle}
      </p>
      {children}
    </motion.div>
  );
}

function EmptyState() {
  return (
    <p className="text-[0.875rem] text-[#AEB7C1]/60 text-center py-20">Nenhum dado disponível</p>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function EnhancedAnalyticsCharts({ analytics }: { analytics: AnalyticsData }) {
  const rm = useReducedMotion();
  if (!analytics) return null;

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  const timeseriesData = analytics.timeseries.map((item: TimeseriesItem) => ({
    ...item,
    date: fmt(item.date),
  }));

  const workshopData = analytics.workshopPopularity.map((w: WorkshopItem) => ({
    name: w.name.length > 20 ? w.name.substring(0, 20) + '…' : w.name,
    count: w.count,
  }));

  const contactStatusData = analytics.contactStatus.map((s: StatusItem) => ({
    name: STATUS_CONFIG[s.status]?.label || s.status,
    value: s.count,
    status: s.status,
  }));

  const tagData = analytics.tagUsage?.slice(0, 5) ?? [];
  const quarterlyData = analytics.quarterlyTrend ?? [];
  const animate = !rm;

  // KPI cards data — avoids repetition
  const kpiCards = [
    {
      label: 'Taxa de Conversão',
      value: `${analytics.conversion?.contacts?.rate ?? '0'}%`,
      Icon: Target,
    },
    { label: 'Convertidos', value: analytics.conversion?.contacts?.converted ?? 0, Icon: Users },
    {
      label: 'Tempo Médio Resposta',
      value: `${analytics.responseMetrics?.avgResponseTimeHours ?? 0}h`,
      Icon: Clock,
    },
    { label: 'Pendentes', value: analytics.responseMetrics?.pendingCount ?? 0, Icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* ── KPI row ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, Icon }, i) => {
          // Define the base style for the Level 3 card (Float)
          const baseStyle = {
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.18)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset',
            borderRadius: '16px',
          };

          // Define the glow for each label
          const glowMap: Record<string, string> = {
            'Taxa de Conversão': '0 0 40px rgba(212,175,55,0.08)',
            Convertidos: '0 0 40px rgba(16,185,129,0.06)',
            'Tempo Médio Resposta': '0 0 40px rgba(96,165,250,0.06)',
            Pendentes: '0 0 40px rgba(251,191,36,0.06)',
          };

          const glow = glowMap[label] || '';
          const style = {
            ...baseStyle,
            // If there's a glow, append it to the existing boxShadow
            boxShadow: glow ? `${baseStyle.boxShadow}, ${glow}` : baseStyle.boxShadow,
          };

          return (
            <motion.div
              key={label}
              style={style}
              // FIX: faltava padding aqui. StatCard.tsx e EnhancedStatCard.tsx
              // usam className="p-6" no card externo — esse motion.div não tinha
              // NENHUM padding, então o conteúdo colava direto na borda do card.
              className="relative p-6"
              initial={rm ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 30 }}
              whileHover={
                rm
                  ? undefined
                  : {
                      y: -2,
                      boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08) inset${glow ? `, ${glow}` : ''}`,
                      transition: { duration: 0.2, ease: 'easeOut' },
                    }
              }
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[0.75rem] font-medium text-[#AEB7C1] uppercase tracking-[0.05em]">
                    {label}
                  </p>
                  <p className="text-[1.75rem] font-bold text-[#F7F7F5]">{value}</p>
                </div>
                {/* Icon container: glass inner */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    padding: '10px',
                  }}
                >
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── 30-day timeline ── */}
      <ChartCard
        title="Atividade dos Últimos 30 Dias"
        subtitle="Tendência diária"
        delay={0.2}
        rm={rm}
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={timeseriesData}>
            <defs>
              {/* FIX 4: Gradient IDs g1/g2/g3 are global — if two instances render
                  they share IDs and steal each other's gradients.
                  Use unique prefixed IDs to avoid collision. */}
              <linearGradient id="ac-g-contacts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ac-g-newsletters" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ac-g-bookings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="date" {...AXIS} />
            <YAxis {...AXIS} />
            <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#AEB7C1' }} />
            <Area
              type="monotone"
              dataKey="contacts"
              name="Contatos"
              stroke="#60A5FA"
              fill="url(#ac-g-contacts)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={animate}
            />
            <Area
              type="monotone"
              dataKey="newsletters"
              name="Newsletter"
              stroke="#FBBF24"
              fill="url(#ac-g-newsletters)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={animate}
            />
            <Area
              type="monotone"
              dataKey="bookings"
              name="Workshops"
              stroke="#10B981"
              fill="url(#ac-g-bookings)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={animate}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Secondary charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Workshops Mais Populares"
          subtitle="Reservas por workshop"
          delay={0.25}
          rm={rm}
        >
          {workshopData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={workshopData} layout="vertical">
                <CartesianGrid {...GRID} horizontal={false} />
                <XAxis type="number" {...AXIS} />
                <YAxis type="category" dataKey="name" {...AXIS} width={140} />
                <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
                <Bar
                  dataKey="count"
                  name="Reservas"
                  fill="#10B981"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={animate}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard
          title="Distribuição de Status"
          subtitle="Status dos contatos"
          delay={0.3}
          rm={rm}
        >
          {contactStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={contactStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={animate}
                  // FIX 5: label used `any` cast. Use typed param destructuring.
                  label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                  labelLine={false}
                  style={{ fontSize: 11 }}
                >
                  {contactStatusData.map((entry, idx) => (
                    // FIX 6: Was using STATUS_CONFIG[entry.status]?.borderColor
                    // which maps to the border hex (a faint color), not the intended
                    // full status color. Use STATUS_COLORS map (full-saturation hex).
                    <Cell key={idx} fill={STATUS_COLORS[entry.status] ?? '#AEB7C1'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        {quarterlyData.length > 0 && (
          <ChartCard title="Tendência Trimestral" subtitle="Últimos 3 meses" delay={0.35} rm={rm}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={quarterlyData}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="month" {...AXIS} />
                <YAxis {...AXIS} />
                <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#AEB7C1' }} />
                <Line
                  type="monotone"
                  dataKey="contacts"
                  name="Contatos"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2, fill: '#111111' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  isAnimationActive={animate}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  name="Workshops"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2, fill: '#111111' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  isAnimationActive={animate}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {tagData.length > 0 && (
          <ChartCard title="Tags Mais Usadas" subtitle="Top 5 tags" delay={0.4} rm={rm}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={tagData}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="tag" {...AXIS} />
                <YAxis {...AXIS} />
                <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
                <Bar
                  dataKey="count"
                  name="Usos"
                  fill="#F87171"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={animate}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
