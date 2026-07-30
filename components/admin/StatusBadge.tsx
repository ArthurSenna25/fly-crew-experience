'use client';

import { useEffect, useState } from 'react';
import { STATUS_CONFIG } from '@/lib/admin-utils';
import Select from '@/components/admin/ui/Select';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// FIX 1: Extract hex-to-rgba conversion to a reusable function.
// The inline conversion was duplicated 3x per render, and the multiline
// template literal format introduces invisible whitespace into the rgba()
// value which some browsers reject (e.g. "rgba( 96, 165, 250, 0.15 )"
// with leading/trailing spaces inside parens is technically invalid CSS).
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const statusOptions = [
  { value: 'new', label: 'Novo' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'converted', label: 'Convertido' },
  { value: 'archived', label: 'Arquivado' },
];

interface Props {
  status: string;
  isRead?: boolean;
  onChange?: (status: string) => void;
  editable?: boolean;
}

export default function StatusBadge({ status, isRead = true, onChange, editable = false }: Props) {
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const effectiveHover = !prefersReducedMotion && isHovered;

  const backgroundColor = hexToRgba(statusConfig.bgColor, effectiveHover ? 0.25 : 0.15);
  const borderColor = hexToRgba(statusConfig.borderColor, 0.25);

  if (editable && onChange) {
    // Mesma paleta do badge somente-leitura abaixo — cada opção do dropdown
    // fica tingida com a cor do próprio status, então editar e visualizar
    // usam a mesma linguagem visual (consistência = menos carga cognitiva).
    const options = statusOptions.map((opt) => {
      const cfg = STATUS_CONFIG[opt.value] || STATUS_CONFIG.new;
      return {
        value: opt.value,
        label: opt.label,
        style: {
          backgroundColor: hexToRgba(cfg.bgColor, 0.15),
          color: cfg.textColor,
        },
      };
    });

    return (
      <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <Select
          label=""
          value={status}
          onChange={onChange}
          placeholder="Selecionar status"
          className="w-full"
          // Trigger tingido com a cor do status atual — mesmo visual do badge
          // somente-leitura logo abaixo, só que clicável (chevron incluso).
          style={{
            background: backgroundColor,
            backdropFilter: 'none',
            borderTop: `1px solid ${borderColor}`,
            borderLeft: `1px solid ${borderColor}`,
            borderRight: `1px solid ${borderColor}`,
            borderBottom: `1px solid ${borderColor}`,
            borderRadius: '6px',
            boxShadow: 'none',
            color: statusConfig.textColor,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.75rem',
          }}
          options={options}
        />
      </div>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5
        rounded text-[0.75rem] font-medium tracking-[0.05em]
        uppercase border transition-colors duration-150 ease-out
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-[#AEB7C1]
        focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
      style={{ backgroundColor, color: statusConfig.textColor, borderColor }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isRead && (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" aria-hidden="true" />
          <span className="sr-only">Não lido</span>
        </>
      )}
      <span>{statusConfig.label}</span>
    </span>
  );
}
