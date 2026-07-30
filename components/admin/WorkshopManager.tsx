'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Power, User } from 'lucide-react';
import { toast } from 'sonner';
import DetailModal from './DetailModal';
import ConfirmationModal from './ConfirmationModal';
import ImageUpload from '@/components/admin/ImageUpload';
import StatusBadge from './StatusBadge';

interface Workshop {
  id: string;
  title: string;
  duration: string;
  capacity: string;
  description: string;
  imageUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
  startDate?: string | null;
  endDate?: string | null;
}

interface WorkshopFormData {
  title: string;
  duration: string;
  capacity: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
  startDate: string | null; // exibido como dd/mm/aaaa enquanto no formulário
  endDate: string | null;
}

// FIX CRÍTICO: a versão anterior lia os 4 primeiros dígitos do texto
// limpo como ANO — mas a máscara produz dd+mm+aaaa nessa ordem, então os
// 4 primeiros dígitos são "dia+mês", não o ano. Toda data digitada virava
// null silenciosamente ao salvar. Ordem corrigida: d = primeiros 2,
// m = próximos 2, y = últimos 4.
function toISODate(display: string): string | null {
  const cleaned = display.replace(/\D/g, '');
  if (cleaned.length !== 8) return null;
  const d = cleaned.slice(0, 2);
  const m = cleaned.slice(2, 4);
  const y = cleaned.slice(4, 8);
  const iso = `${y}-${m}-${d}`;
  const date = new Date(iso);
  if (isNaN(date.getTime()) || date.getUTCDate() !== Number(d) || date.getUTCMonth() + 1 !== Number(m)) {
    return null;
  }
  return iso;
}

function toDisplayDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function applyMask(value: string): string {
  let v = value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
  else if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
  return v;
}

export default function WorkshopManager() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Workshop | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<WorkshopFormData>({
    title: '',
    duration: '',
    capacity: '',
    description: '',
    imageUrl: '',
    isActive: true,
    displayOrder: 0,
    startDate: null,
    endDate: null,
  });

  const fetchWorkshops = async () => {
    try {
      const res = await fetch('/api/admin/workshops');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWorkshops(
        Array.isArray(data)
          ? (data as Workshop[]).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          : [],
      );
    } catch {
      toast.error('Erro ao carregar workshops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const openCreate = () => {
    const activeCount = workshops.filter((w) => w.isActive).length;
    if (activeCount >= 3) {
      toast.error('Máximo de 3 workshops ativos simultaneamente.');
      return;
    }
    setEditing(null);
    setFormData({
      title: '',
      duration: '',
      capacity: '',
      description: '',
      imageUrl: '',
      isActive: true,
      displayOrder: workshops.length,
      startDate: null,
      endDate: null,
    });
    setShowModal(true);
  };

  const openEdit = (w: Workshop) => {
    setEditing(w);
    setFormData({
      title: w.title || '',
      duration: w.duration || '',
      capacity: w.capacity || '',
      description: w.description || '',
      imageUrl: w.imageUrl || '',
      isActive: w.isActive,
      displayOrder: w.displayOrder || 0,
      startDate: w.startDate ? toDisplayDate(w.startDate) : null,
      endDate: w.endDate ? toDisplayDate(w.endDate) : null,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.startDate && !toISODate(formData.startDate)) {
      toast.error('Data de início inválida — use dd/mm/aaaa');
      return;
    }
    if (formData.endDate && !toISODate(formData.endDate)) {
      toast.error('Data de término inválida — use dd/mm/aaaa');
      return;
    }

    try {
      const payload = {
        ...formData,
        startDate: formData.startDate ? toISODate(formData.startDate) : null,
        endDate: formData.endDate ? toISODate(formData.endDate) : null,
      };

      if (editing) {
        const res = await fetch(`/api/admin/workshops/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success('Workshop atualizado!');
      } else {
        const res = await fetch('/api/admin/workshops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success('Workshop criado!');
      }
      setShowModal(false);
      fetchWorkshops();
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      await performDelete(deletingId);
      handleDeleteCancel();
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeletingId(null);
  };

  const performDelete = async (id: string) => {
    const res = await fetch(`/api/admin/workshops/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao deletar workshop');
    fetchWorkshops();
  };

  const toggleActive = async (w: Workshop) => {
    if (!w.isActive) {
      const activeCount = workshops.filter((x) => x.isActive).length;
      if (activeCount >= 3) {
        toast.error('Máximo de 3 workshops ativos. Desative outro primeiro.');
        return;
      }
    }
    try {
      const res = await fetch(`/api/admin/workshops/${w.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !w.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(w.isActive ? 'Desativado' : 'Ativado');
      fetchWorkshops();
    } catch {
      toast.error('Erro');
    }
  };

  const reduceMotion = useReducedMotion();

  const workshopCardStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.18)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
  };

  const primaryButtonStyle = {
    background: '#D4AF37',
    color: '#0A0A0A',
    borderRadius: '10px',
    boxShadow: '0 2px 12px rgba(212,175,55,0.35)',
  };

  const secondaryButtonStyle = {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#AEB7C1',
    borderRadius: '10px',
  };

  const getInputStyle = (fieldName: string): React.CSSProperties => ({
    width: '100%',
    background: 'rgba(255, 255, 255, 0.04)',
    border: focusedField === fieldName ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255, 255, 255, 0.10)',
    borderRadius: '10px',
    color: '#F7F7F5',
    boxShadow: focusedField === fieldName ? '0 0 0 3px rgba(255,255,255,0.06)' : 'none',
    outline: 'none',
    padding: '0.625rem 0.875rem',
    transition: 'border-color 150ms, box-shadow 150ms',
  });

  const getEnterAnimation = (index: number) => {
    if (reduceMotion) {
      return { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } };
    }
    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { type: 'spring', stiffness: 300, damping: 30, delay: index * 0.04 },
    };
  };

  const getHoverStyle = () => {
    if (reduceMotion) return {};
    return { y: -2, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)', transition: { duration: 0.2, ease: 'easeOut' } };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-[1.25rem] font-semibold text-[#F7F7F5] mb-2">Gerenciar Workshops</h1>
          <p className="text-sm text-[#AEB7C1]">Adicione, edite e gerencie os workshops oferecidos</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium uppercase tracking-wider hover:brightness-110 hover:shadow-[0_4px_20px_rgba(212,175,55,0.45)] transition-all duration-200 w-full sm:w-auto"
          style={primaryButtonStyle}
        >
          <Plus size={20} />
          Novo Workshop
        </button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((_, index) => (
            <div key={`skeleton-${index}`} className="animate-pulse" style={{ ...workshopCardStyle, opacity: 0.4 }}>
              <div className="h-52 w-full rounded-t-2xl bg-white/10" />
              <div className="px-4 py-3 space-y-3">
                <div className="h-3 w-24 rounded bg-white/10" />
                <div className="h-3 w-32 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && workshops.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-white/[0.04] border border-white/10">
            <Plus size={24} className="text-[#6B7280]" />
          </div>
          <p className="text-sm text-[#AEB7C1]/60 max-w-xl mx-auto">
            Nenhum workshop cadastrado. Clique em "Novo Workshop" para começar.
          </p>
        </div>
      )}

      {!loading && workshops.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((workshop, index) => {
            const animations = getEnterAnimation(index);
            return (
              <motion.div
                key={workshop.id}
                {...animations}
                style={workshopCardStyle}
                whileHover={getHoverStyle()}
                className="cursor-pointer overflow-hidden"
                onClick={() => openEdit(workshop)}
              >
                <div className="relative h-52 w-full">
                  {workshop.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={workshop.imageUrl}
                      alt={workshop.title}
                      className="w-full h-52 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-52 flex items-center justify-center bg-white/5">
                      <User size={24} className="text-[#AEB7C1]" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={workshop.isActive ? 'converted' : 'archived'} isRead={true} />
                  </div>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <h3 className="text-lg font-semibold text-[#F7F7F5]">{workshop.title}</h3>
                  <div className="flex items-center text-xs text-[#AEB7C1]">
                    <span>{workshop.duration}</span>
                    <span className="mx-1" aria-hidden="true">•</span>
                    <span>{workshop.capacity}</span>
                  </div>
                  {workshop.startDate && (
                    <p className="text-xs text-[#AEB7C1]/60 mt-1">
                      {workshop.endDate
                        ? `${new Date(workshop.startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} → ${new Date(workshop.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`
                        : new Date(workshop.startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </p>
                  )}
                  <p className="text-sm text-[#AEB7C1] leading-relaxed line-clamp-3">{workshop.description}</p>
                  <div className="text-xs text-[#AEB7C1]">Ordem: {workshop.displayOrder}</div>
                  <div
                    className="flex items-center gap-2 pt-3 border-t border-white/5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openEdit(workshop)}
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                      aria-label={`Editar ${workshop.title}`}
                      title="Editar"
                    >
                      <Edit2 size={16} className="text-[#AEB7C1] hover:text-white" />
                    </button>
                    <button
                      onClick={() => toggleActive(workshop)}
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                      aria-label={workshop.isActive ? `Desativar ${workshop.title}` : `Ativar ${workshop.title}`}
                      title={workshop.isActive ? 'Desativar' : 'Ativar'}
                    >
                      <Power size={16} className="text-[#AEB7C1] hover:text-white" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(workshop.id)}
                      className="p-1.5 rounded-md hover:bg-red-500/20 transition-colors"
                      aria-label={`Deletar ${workshop.title}`}
                      title="Deletar"
                    >
                      <Trash2 size={16} className="text-red-400 hover:text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <DetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Editar Workshop' : 'Novo Workshop'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#AEB7C1]">Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              required
              style={getInputStyle('title')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#AEB7C1]">Duração</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                onFocus={() => setFocusedField('duration')}
                onBlur={() => setFocusedField(null)}
                required
                style={getInputStyle('duration')}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#AEB7C1]">Capacidade</label>
              <input
                type="text"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                onFocus={() => setFocusedField('capacity')}
                onBlur={() => setFocusedField(null)}
                required
                style={getInputStyle('capacity')}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#AEB7C1]">Início do Evento</label>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: applyMask(e.target.value) })}
                onFocus={() => setFocusedField('startDate')}
                onBlur={() => setFocusedField(null)}
                maxLength={10}
                inputMode="numeric"
                style={getInputStyle('startDate')}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#AEB7C1]">Fim do Evento</label>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: applyMask(e.target.value) })}
                onFocus={() => setFocusedField('endDate')}
                onBlur={() => setFocusedField(null)}
                maxLength={10}
                inputMode="numeric"
                style={getInputStyle('endDate')}
              />
              <p className="text-xs text-[#AEB7C1]/60">Opcional — se vazio, evento de 1 dia</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#AEB7C1]">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              required
              rows={4}
              style={{ ...getInputStyle('description'), resize: 'none' }}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#AEB7C1]">Imagem do Workshop</label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              folder="fly-crew/workshops"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#AEB7C1]">Ordem</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                onFocus={() => setFocusedField('displayOrder')}
                onBlur={() => setFocusedField(null)}
                min="0"
                style={getInputStyle('displayOrder')}
              />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <label className="block text-sm font-medium text-[#AEB7C1] invisible" aria-hidden="true">
                Status
              </label>
              <label className="flex items-center gap-2 h-[42px]">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#D4AF37] cursor-pointer"
                />
                <span className="text-sm font-medium text-[#AEB7C1]">Workshop ativo</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2.5 text-sm font-medium hover:bg-white/10 hover:text-[#F7F7F5] transition-all duration-200"
              style={secondaryButtonStyle}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formData.title || !formData.duration || !formData.capacity || !formData.description.trim()}
              className="px-4 py-2.5 text-sm font-medium hover:brightness-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
              style={primaryButtonStyle}
            >
              {editing ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </DetailModal>
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        title="Excluir workshop"
        description={
          deletingId
            ? `Tem certeza que deseja excluir o workshop "${
                workshops.find((w) => w.id === deletingId)?.title ?? ""
              }"? Esta ação não pode ser desfeita.`
            : "Tem certeza que deseja excluir este workshop? Esta ação não pode ser desfeita."
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </div>
  );
}

function useReducedMotion() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);
  return enabled;
}
