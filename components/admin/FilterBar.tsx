"use client";

import { Search, Download, Trash2, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import Select from "@/components/admin/ui/Select";

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  dateRange: string;
  onDateRangeChange: (v: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (v: string) => void;
  workshopFilter?: string;
  onWorkshopFilterChange?: (v: string) => void;
  showStatusFilter?: boolean;
  showWorkshopFilter?: boolean;
  workshopOptions?: { value: string; label: string }[];
  selectedCount?: number;
  onExport: () => void;
  onExportExcel?: () => void;
  onBulkDelete: () => void;
  searchPlaceholder?: string;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  workshopFilter,
  onWorkshopFilterChange,
  showStatusFilter = true,
  showWorkshopFilter = false,
  workshopOptions = [],
  selectedCount = 0,
  onExport,
  onExportExcel,
  onBulkDelete,
  searchPlaceholder = "Buscar...",
}: Props) {
  // Check if any filter is active (not default value)
  const hasActiveFilters =
    searchQuery !== "" ||
    dateRange !== "all" ||
    statusFilter !== "all" ||
    workshopFilter !== "all";

  const [searchFocused, setSearchFocused] = useState(false);
  const [dateRangeFocused, setDateRangeFocused] = useState(false);
  const [statusFocused, setStatusFocused] = useState(false);
  const [workshopFocused, setWorkshopFocused] = useState(false);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,0.18)',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      borderRadius: '16px',
      padding: '1rem',
      marginBottom: '1.5rem',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      gap: '0.75rem',
    }}>
      {/* Search Group */}
      <div className="flex flex-col gap-1 w-full min-w-[200px] sm:w-auto">
        <label className="text-[0.65rem] text-[#AEB7C1] uppercase tracking-[0.1em]">Buscar</label>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full text-[0.875rem] text-[#F7F7F5] px-3 py-2 outline-none
            focus:ring-2 focus:ring-white/10 placeholder:text-[#6B7280]
            transition-all duration-150 ease-out"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: searchFocused ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.10)',
            borderRadius: '10px',
            boxShadow: searchFocused ? '0 0 0 3px rgba(255,255,255,0.06)' : '',
          }}
          data-testid="search-input"
        />
      </div>

      {/* Date Range Group */}
      <div className="flex flex-col gap-1 w-full min-w-[120px] sm:w-auto">
        <label className="text-[0.65rem] text-[#AEB7C1] uppercase tracking-[0.1em]">Período</label>
        <Select
          label=""
          value={dateRange}
          onChange={onDateRangeChange}
          placeholder="Selecionar período"
          className="w-full"
          onFocus={() => setDateRangeFocused(true)}
          onBlur={() => setDateRangeFocused(false)}
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255,255,255,0.10)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '10px',
            boxShadow: dateRangeFocused ? '0 0 0 3px rgba(255,255,255,0.06)' : '',
          }}
          options={[
            { value: 'all', label: 'Todo o período', style: { backgroundColor: '#111827', color: '#F7F7F5' } },
            { value: 'today', label: 'Hoje', style: { backgroundColor: '#111827', color: '#F7F7F5' } },
            { value: '7days', label: 'Últimos 7 dias', style: { backgroundColor: '#111827', color: '#F7F7F5' } },
            { value: '30days', label: 'Últimos 30 dias', style: { backgroundColor: '#111827', color: '#F7F7F5' } },
            { value: '90days', label: 'Últimos 90 dias', style: { backgroundColor: '#111827', color: '#F7F7F5' } },
          ]}
        />
      </div>

      {/* Status Filter Group */}
      {showStatusFilter && onStatusFilterChange && (
        <div className="flex flex-col gap-1 w-full min-w-[100px] sm:w-auto">
          <label className="text-[0.65rem] text-[#AEB7C1] uppercase tracking-[0.1em]">Status</label>
          <Select
            label=""
            value={statusFilter ?? "all"}
            onChange={onStatusFilterChange}
            placeholder="Selecionar status"
            className="w-full"
            onFocus={() => setStatusFocused(true)}
            onBlur={() => setStatusFocused(false)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(255,255,255,0.10)',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '10px',
              boxShadow: statusFocused ? '0 0 0 3px rgba(255,255,255,0.06)' : '',
            }}
            options={[
              { value: 'all', label: 'Todos status', style: { backgroundColor: '#111827', color: '#F7F7F5' } },
              { value: 'new', label: 'Novo', style: { backgroundColor: '#111827', color: '#F7F7F5' } },
              { value: 'contacted', label: 'Contatado', style: { backgroundColor: '#111827', color: '#F7F7F5' } },
              { value: 'converted', label: 'Convertido', style: { backgroundColor: '#111827', color: '#F7F7F5' } },
              { value: 'archived', label: 'Arquivado', style: { backgroundColor: '#111827', color: '#F7F7F5' } },
            ]}
          />
        </div>
      )}

      {/* Workshop Filter Group */}
      {showWorkshopFilter && onWorkshopFilterChange && (
        <div className="flex flex-col gap-1 w-full min-w-[120px] sm:w-auto">
          <label className="text-[0.65rem] text-[#AEB7C1] uppercase tracking-[0.1em]">Workshop</label>
          <Select
            label=""
            value={workshopFilter ?? "all"}
            onChange={onWorkshopFilterChange}
            placeholder="Selecionar workshop"
            className="w-full"
            onFocus={() => setWorkshopFocused(true)}
            onBlur={() => setWorkshopFocused(false)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(255,255,255,0.10)',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '10px',
              boxShadow: workshopFocused ? '0 0 0 3px rgba(255,255,255,0.06)' : '',
            }}
            options={[
              { value: 'all', label: 'Todos workshops', style: { backgroundColor: '#111827', color: '#F7F7F5' } },
              ...workshopOptions.map((w) => ({
                value: w.value,
                label: w.label,
                style: { backgroundColor: '#111827', color: '#F7F7F5' },
              })),
            ]}
          />
        </div>
      )}

      {/* Buttons Group */}
      <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
        <button
          onClick={onExport}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px',
          }}
          className="flex items-center gap-2 text-[0.75rem] font-medium text-[#AEB7C1] uppercase
            tracking-[0.05em] px-3 py-2
            hover:bg-white/10 hover:text-[#F7F7F5]
            transition-colors duration-150 ease-out"
          data-testid="export-btn"
        >
          <Download size={14} /> CSV
        </button>
        {onExportExcel && (
          <button
            onClick={onExportExcel}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
            }}
            className="flex items-center gap-2 text-[0.75rem] font-medium text-[#AEB7C1] uppercase
              tracking-[0.05em] px-3 py-2
              hover:bg-white/10 hover:text-[#F7F7F5]
              transition-colors duration-150 ease-out"
            data-testid="export-excel-btn"
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedCount > 0 && onBulkDelete && (
        <div className="flex items-center justify-between w-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-4 py-3 rounded-lg mt-4">
          <span className="text-sm text-[#D4AF37] font-semibold">{selectedCount} item(s) selecionado(s)</span>
          <button
            onClick={onBulkDelete}
            className="flex items-center gap-2 text-[#F87171] hover:text-[#F87171]/80 text-sm font-semibold"
            data-testid="bulk-delete-btn"
          >
            <Trash2 size={14} /> Deletar selecionados
          </button>
        </div>
      )}

      {/* Active Filter Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/15"></div>
          <span className="ml-1.5 text-xs text-[#AEB7C1]/70 sr-only">
            Filtros ativos
          </span>
        </div>
      )}
    </div>
  );
}
