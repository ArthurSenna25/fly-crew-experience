'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, LucideIcon } from 'lucide-react';
import { calculateGrowth } from '@/lib/admin-utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  icon: LucideIcon;
  label: string;
  value: number;
  today: number;
  thisWeek: number;
  lastWeek: number;
  delay?: number;
  unreadCount?: number;
  highPriorityCount?: number;
  secondaryMetric?: string;
}

export default function EnhancedStatCard({
  icon: Icon,
  label,
  value,
  today,
  thisWeek,
  lastWeek,
  delay = 0,
  unreadCount,
  highPriorityCount,
  secondaryMetric,
}: Props) {
  const growth = calculateGrowth(thisWeek, lastWeek);
  const positive = growth >= 0;
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      // Glass card styles (Level 3 - Float)
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.18)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset',
        borderRadius: '16px',
      }}
      // Entrance animation: spring physics
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        y: { type: 'spring', stiffness: 300, damping: 30, delay },
        opacity: { type: 'spring', stiffness: 300, damping: 30, delay },
        boxShadow: { duration: 0.2, ease: 'easeOut' },
      }}
      // Hover state: apple floating effect
      whileHover={
        reducedMotion
          ? undefined
          : {
              y: -2,
              boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08) inset',
            }
      }
      className="relative p-6"
      data-testid={`stat-card-${label.toLowerCase()}`}
    >
      {!!unreadCount && unreadCount > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-white/15 text-[#F7F7F5] border border-white/25 text-[0.65rem] font-medium uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-full">
          {unreadCount} não lido(s)
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[0.75rem] font-medium text-[#AEB7C1] uppercase tracking-[0.05em] mb-1">
            {label}
          </p>
          <p className="text-[1.75rem] font-bold text-[#F7F7F5]">{value}</p>
          {secondaryMetric && (
            <p className="text-[0.75rem] text-[#AEB7C1] font-medium uppercase tracking-[0.05em] mt-1">{secondaryMetric}</p>
          )}
          {/* Alert triangle for high priority */}
          {!!highPriorityCount && highPriorityCount > 0 && (
            <div className="flex items-center gap-1 text-[0.65rem] text-[#FBBF24] font-medium uppercase tracking-[0.05em] mt-2">
              <AlertTriangle size={11} aria-hidden="true" />
              <span>{highPriorityCount} alta prioridade</span>
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 ${unreadCount && unreadCount > 0 ? 'mt-1' : ''}`}>
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
      </div>

      {/* Divider: border-t border-white/[0.06] */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.06]">
        <div>
          <p className="text-[0.75rem] text-[#AEB7C1] uppercase tracking-[0.05em]">Hoje</p>
          <p className="text-[1.125rem] font-medium text-[#F7F7F5]">+{today}</p>
        </div>
        <div>
          <p className="text-[0.75rem] text-[#AEB7C1] uppercase tracking-[0.05em]">Semana</p>
          <div className="flex items-center gap-1.5">
            <p className="text-[1.125rem] font-medium text-[#F7F7F5]">+{thisWeek}</p>
            {lastWeek > 0 && (
              <span
                className={`text-[0.65rem] flex items-center gap-0.5 ${
                  positive ? 'text-[#10B981]' : 'text-[#F87171]'
                } uppercase tracking-[0.05em]`}
              >
                {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(growth)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
