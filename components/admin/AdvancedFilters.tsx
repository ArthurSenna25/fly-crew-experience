'use client';

import {
  Filter,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
  AlertCircle,
  Tag as TagIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PRIORITY_CONFIG, TAG_COLORS } from '@/lib/admin-utils';
import Select from '@/components/admin/ui/Select';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AdvancedFiltersProps {
  tags: { id: string; name: string; color: keyof typeof TAG_COLORS }[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  priority: string;
  onPriorityChange: (priority: string) => void;
  readStatus: string;
  onReadStatusChange: (status: string) => void;
  onClearAll: () => void;
}

export default function AdvancedFilters({
  tags,
  selectedTags,
  onTagsChange,
  priority,
  onPriorityChange,
  readStatus,
  onReadStatusChange,
  onClearAll,
}: AdvancedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const reducedMotion = useReducedMotion();

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const activeFiltersCount =
    selectedTags.length + (priority !== 'all' ? 1 : 0) + (readStatus !== 'all' ? 1 : 0);
  const hasActiveFilters = activeFiltersCount > 0;

  const priorityOptions = Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
    icon: <span className={`w-2 h-2 rounded-full ${config.color}`} aria-hidden="true" />,
  }));

  const readStatusOptions = [
    { value: 'all', label: 'Todos' },
    {
      value: 'unread',
      label: 'Não Lidos',
      icon: <EyeOff className="w-3 h-3" aria-hidden="true" />,
    },
    { value: 'read', label: 'Lidos', icon: <Eye className="w-3 h-3" aria-hidden="true" /> },
  ];

  return (
    <div className="space-y-3">
      {/*
        Cabeçalho com affordance mais clara:
        - Ícone de filtro fica ESTÁTICO (girar um funil de cabeça pra baixo
          não comunica nada) — quem indica aberto/fechado é o Chevron, que
          é o padrão universal de "isso expande".
        - A cor do texto/ícone muda quando o painel está aberto OU quando
          há filtros ativos, dando feedback de estado sem precisar abrir
          o painel pra saber que tem filtro aplicado.
        - Borda ganha um leve tom azul (Status Info) quando há filtros
          ativos — sinaliza "isso está filtrando algo" à distância, sem
          precisar ler o número do badge.
      */}
      <motion.div
        className="flex items-center gap-3"
        whileTap={{ scale: 0.995 }}
        style={{
          background: hasActiveFilters ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
          border: hasActiveFilters
            ? '1px solid rgba(255,255,255,0.25)'
            : '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '0.625rem 1rem',
          transition: 'background-color 150ms ease-out, border-color 150ms ease-out',
        }}
      >
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.05em] transition-colors duration-150 ease-out ${
            showFilters || hasActiveFilters
              ? 'text-[#F7F7F5]'
              : 'text-[#AEB7C1] hover:text-[#F7F7F5]'
          }`}
          aria-expanded={showFilters}
        >
          <Filter
            className={`w-4 h-4 transition-colors duration-150 ${
              hasActiveFilters ? 'text-[#F7F7F5]' : ''
            }`}
          />
          <span>Filtros Avançados</span>

          {hasActiveFilters && (
            <motion.span
              key={activeFiltersCount}
              initial={reducedMotion ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="bg-white/20 text-[#F7F7F5] border border-white/30 text-[0.65rem] font-semibold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center"
              aria-label="Filtros ativos"
            >
              {activeFiltersCount}
            </motion.span>
          )}

          <ChevronDown
            className="w-3.5 h-3.5 text-[#AEB7C1]/60 transition-transform duration-200 ease-out"
            style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {hasActiveFilters && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onClearAll}
            className="flex items-center gap-1.5 ml-auto text-[0.75rem] text-[#AEB7C1]/60 uppercase tracking-[0.05em] hover:text-[#F87171] transition-colors duration-150 ease-out"
          >
            <X className="w-3.5 h-3.5" /> Limpar
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={reducedMotion ? (false as any) : { opacity: 0, y: -8 }}
            animate={reducedMotion ? (false as any) : { opacity: 1, y: 0 }}
            exit={reducedMotion ? (false as any) : { opacity: 0, y: -8 }}
            transition={{
              duration: reducedMotion ? 0 : 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(255,255,255,0.18)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              borderRadius: '16px',
              padding: '1.25rem',
              marginTop: '0.5rem',
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            }}
          >
            {/* Priority Filter */}
            <fieldset className="space-y-2">
              <legend className="sr-only">Prioridade</legend>
              <label className="flex items-center gap-1.5 text-[0.65rem] text-[#AEB7C1] uppercase tracking-[0.1em] mb-2">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                Prioridade
              </label>
              <Select
                label=""
                value={priority}
                onChange={onPriorityChange}
                placeholder="Selecione a prioridade"
                options={priorityOptions}
              />
            </fieldset>

            {/* Read Status Filter */}
            <fieldset className="space-y-2">
              <legend className="sr-only">Status de Leitura</legend>
              <label className="flex items-center gap-1.5 text-[0.65rem] text-[#AEB7C1] uppercase tracking-[0.1em] mb-2">
                <Eye className="w-3 h-3" aria-hidden="true" />
                Status de Leitura
              </label>
              <Select
                label=""
                value={readStatus}
                onChange={onReadStatusChange}
                placeholder="Selecione o status"
                options={readStatusOptions}
              />
            </fieldset>

            {/* Tags Filter */}
            {tags && tags.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="sr-only">Tags</legend>
                <label className="flex items-center gap-1.5 text-[0.65rem] text-[#AEB7C1] uppercase tracking-[0.1em] mb-2">
                  <TagIcon className="w-3 h-3" aria-hidden="true" />
                  Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.name);
                    return (
                      <motion.label
                        key={tag.id}
                        whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-1.5 text-[0.8rem] cursor-pointer px-2.5 py-1 rounded-full border transition-colors duration-150 ease-out"
                        htmlFor={`tag-${tag.id}`}
                        style={{
                          background: isSelected
                            ? 'rgba(255,255,255,0.15)'
                            : 'rgba(255,255,255,0.03)',
                          borderColor: isSelected
                            ? 'rgba(255,255,255,0.25)'
                            : 'rgba(255,255,255,0.08)',
                          color: isSelected ? '#F7F7F5' : '#AEB7C1',
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`tag-${tag.id}`}
                          checked={isSelected}
                          onChange={() => toggleTag(tag.name)}
                          className="sr-only"
                        />
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${TAG_COLORS[tag.color] || TAG_COLORS.blue}`}
                          aria-hidden="true"
                        />
                        <span>{tag.name}</span>
                        {isSelected && (
                          <Check className="w-3 h-3 text-[#F7F7F5]" aria-hidden="true" />
                        )}
                      </motion.label>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
