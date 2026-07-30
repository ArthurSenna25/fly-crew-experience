'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import Image from 'next/image';
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import DetailModal from './DetailModal';
import ConfirmationModal from './ConfirmationModal';
import ImageUpload from '@/components/admin/ImageUpload';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';


// ─── Types ────────────────────────────────────────────────────────────────────
interface Gallery {
  id: string;
  imageUrl: string;
  caption: string;
  isActive: boolean;
  displayOrder: number;
}

// ─── Design tokens (DESIGN-ADMIN.md — Level 2 Card) ──────────────────────────
const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderTop: '1px solid rgba(255,255,255,0.18)',
  borderLeft: '1px solid rgba(255,255,255,0.08)',
  borderRight: '1px solid rgba(255,255,255,0.08)',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  overflow: 'hidden',
};

const primaryButtonStyle: React.CSSProperties = {
  background: '#D4AF37',
  color: '#0A0A0A',
  borderRadius: '10px',
  boxShadow: '0 2px 12px rgba(212,175,55,0.35)',
};

const navButtonStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '10px',
  color: '#AEB7C1',
};

const inputStyle = (focused: boolean): React.CSSProperties => ({
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: focused ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.10)',
  borderRadius: '10px',
  color: '#F7F7F5',
  boxShadow: focused ? '0 0 0 3px rgba(255,255,255,0.06)' : 'none',
  outline: 'none',
  padding: '0.625rem 0.875rem',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.875rem',
  transition: 'border-color 150ms, box-shadow 150ms',
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function GalleryManager() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Gallery | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Ids de imagens que falharam ao carregar (Cloudinary fora do ar, URL
  // quebrada, etc). next/image não tem fallback nativo em caso de erro,
  // então controlamos manualmente via onError e caímos pro placeholder.
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const markImageBroken = (id: string) =>
    setBrokenImages((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const [formData, setFormData] = useState({
    imageUrl: '',
    caption: '',
    isActive: true,
    displayOrder: 0,
  });

  const reducedMotion = useReducedMotion();

  // ── API ──────────────────────────────────────────────────────────────────────
  const fetchGalleries = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/galleries');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGalleries(
        Array.isArray(data)
          ? data.sort((a: Gallery, b: Gallery) => a.displayOrder - b.displayOrder)
          : [],
      );
    } catch {
      toast.error('Erro ao carregar galerias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGalleries();
  }, [fetchGalleries]);

  const openCreate = () => {
    setEditing(null);
    setFormData({ imageUrl: '', caption: '', isActive: true, displayOrder: galleries.length });
    setShowModal(true);
  };

  const openEdit = (gallery: Gallery) => {
    setEditing(gallery);
    setFormData({
      imageUrl: gallery.imageUrl,
      caption: gallery.caption,
      isActive: gallery.isActive,
      displayOrder: gallery.displayOrder,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.imageUrl.trim() || !formData.caption.trim()) {
      toast.error('Imagem e legenda são obrigatórios');
      return;
    }
    setSubmitting(true);
    try {
      const url = editing ? `/api/admin/galleries/${editing.id}` : '/api/admin/galleries';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          displayOrder: Number(formData.displayOrder),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(editing ? 'Galeria atualizada' : 'Galeria criada');
      setShowModal(false);
      fetchGalleries();
    } catch {
      toast.error(editing ? 'Erro ao atualizar galeria' : 'Erro ao criar galeria');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      setShowDeleteConfirm(false);
      const idToDelete = deletingId;
      setDeletingId(null);
      handleDelete(idToDelete);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeletingId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/galleries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Galeria deletada');
      fetchGalleries();
    } catch {
      toast.error('Erro ao deletar galeria');
    }
  };

  const toggleActive = async (gallery: Gallery) => {
    try {
      const res = await fetch(`/api/admin/galleries/${gallery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !gallery.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(gallery.isActive ? 'Galeria desativada' : 'Galeria ativada');
      fetchGalleries();
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  // ── Carrossel (mesma arquitetura do TestimonialManager) ──────────────────────
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1, dragFree: false },
    reducedMotion ? [] : [Autoplay({ delay: 4000, stopOnInteraction: true })],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const pauseAutoplay = () => {
    const autoplay = emblaApi?.plugins()?.autoplay as { stop?: () => void } | undefined;
    autoplay?.stop?.();
  };

  const resumeAutoplay = () => {
    const autoplay = emblaApi?.plugins()?.autoplay as { play?: () => void } | undefined;
    autoplay?.play?.();
  };

  // ── Animações (DESIGN-ADMIN.md) ──────────────────────────────────────────────
  const entrance = (index: number) =>
    reducedMotion
      ? {
          initial: { opacity: 1, y: 0 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0 },
        }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { type: 'spring' as const, stiffness: 300, damping: 30, delay: index * 0.04 },
        };

  const hoverAnim = reducedMotion
    ? {}
    : {
        y: -2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        transition: { duration: 0.2, ease: 'easeOut' as const },
      };

  // ── Card ─────────────────────────────────────────────────────────────────────
  const renderCard = (gallery: Gallery, index: number) => (
    <motion.div {...entrance(index)} whileHover={hoverAnim} style={cardStyle} className="h-full">
      {/* Imagem */}
      <div className="relative h-48 w-full bg-white/5">
        {gallery.imageUrl && !brokenImages.has(gallery.id) ? (
          <Image
            src={gallery.imageUrl}
            alt={gallery.caption}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            onError={() => markImageBroken(gallery.id)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={24} style={{ color: '#AEB7C1' }} />
          </div>
        )}
        {/* Badge de status */}
        <span
          className="absolute top-3 right-3 px-2.5 py-0.5 rounded text-[0.65rem] font-medium uppercase tracking-[0.05em]"
          style={
            gallery.isActive
              ? { background: 'rgba(16,185,129,0.2)', color: '#10B981' }
              : { background: 'rgba(248,113,113,0.2)', color: '#F87171' }
          }
        >
          {gallery.isActive ? 'Ativa' : 'Inativa'}
        </span>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-[0.875rem] leading-snug line-clamp-2"
            style={{ color: '#F7F7F5', fontFamily: 'Inter, sans-serif' }}
            title={gallery.caption}
          >
            {gallery.caption}
          </p>
          <span
            className="text-[0.6875rem] shrink-0"
            style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}
          >
            #{gallery.displayOrder}
          </span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={() => openEdit(gallery)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[0.7rem] font-medium uppercase tracking-[0.05em] rounded-lg transition-colors duration-150"
            style={{ background: 'rgba(212,175,55,0.10)', color: '#D4AF37' }}
            aria-label={`Editar galeria: ${gallery.caption}`}
          >
            <Edit2 size={13} /> Editar
          </button>

          <button
            type="button"
            onClick={() => toggleActive(gallery)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[0.7rem] font-medium uppercase tracking-[0.05em] rounded-lg transition-colors duration-150"
            style={
              gallery.isActive
                ? { background: 'rgba(248,113,113,0.12)', color: '#F87171' }
                : { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
            }
            aria-label={gallery.isActive ? 'Desativar galeria' : 'Ativar galeria'}
          >
            <Power size={13} /> {gallery.isActive ? 'Desativar' : 'Ativar'}
          </button>

          <button
            type="button"
            onClick={() => handleDeleteClick(gallery.id)}
            className="flex items-center justify-center px-3 py-2 rounded-lg transition-colors duration-150"
            style={{ background: 'rgba(248,113,113,0.10)', color: '#F87171' }}
            aria-label={`Deletar galeria: ${gallery.caption}`}
            title="Deletar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const useCarousel = galleries.length > 3;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1
            className="text-[1.25rem] font-semibold mb-1"
            style={{ color: '#F7F7F5', fontFamily: 'Inter, sans-serif' }}
          >
            Gerenciar Galeria
          </h1>
          <p
            className="text-[0.8125rem]"
            style={{ color: '#AEB7C1', fontFamily: 'Inter, sans-serif' }}
          >
            Gerencie as imagens exibidas na galeria do site.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium uppercase tracking-wider hover:brightness-110 hover:shadow-[0_4px_20px_rgba(212,175,55,0.45)] transition-all duration-200 w-full sm:w-auto"
          style={primaryButtonStyle}
        >
          <Plus size={18} />
          Nova Imagem
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse" style={{ ...cardStyle, opacity: 0.4 }}>
              <div className="h-48 w-full bg-white/10" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && galleries.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3"
          style={{
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: '0.875rem',
          }}
        >
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.75rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImageIcon size={16} style={{ color: '#6B7280' }} />
          </div>
          <div className="text-center">
            <p
              style={{
                color: '#AEB7C1',
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
              }}
            >
              Nenhuma imagem cadastrada
            </p>
            <p
              style={{
                color: '#6B7280',
                fontSize: '0.75rem',
                fontFamily: 'Inter, sans-serif',
                marginTop: '0.25rem',
              }}
            >
              Clique em "Nova Imagem" para começar
            </p>
          </div>
        </div>
      )}

      {/* Grid simples (até 3) */}
      {!loading && galleries.length > 0 && !useCarousel && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery, i) => (
            <div key={gallery.id}>{renderCard(gallery, i)}</div>
          ))}
        </div>
      )}

      {/* Carrossel (4+) — mesma estrutura do TestimonialManager */}
      {!loading && useCarousel && (
        <div>
          <div className="flex items-center justify-end gap-2 mb-4">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canScrollPrev}
              aria-label="Slide anterior"
              className="flex items-center justify-center w-9 h-9 transition-opacity duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
              style={navButtonStyle}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canScrollNext}
              aria-label="Próximo slide"
              className="flex items-center justify-center w-9 h-9 transition-opacity duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
              style={navButtonStyle}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div
            className="overflow-hidden"
            ref={emblaRef}
            onMouseEnter={pauseAutoplay}
            onMouseLeave={resumeAutoplay}
          >
            <div className="flex gap-4 -ml-4 pl-4">
              {galleries.map((gallery, i) => (
                <div
                  key={gallery.id}
                  className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_31%] min-w-0"
                >
                  {renderCard(gallery, i)}
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="mt-5 flex justify-center items-center gap-2">
            {galleries.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Ir para imagem ${index + 1}`}
                className="h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: selectedIndex === index ? '1.25rem' : '0.375rem',
                  background: selectedIndex === index ? '#D4AF37' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      <DetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Editar Imagem' : 'Nova Imagem'}
      >
        <div className="space-y-5">
          {/* Imagem (upload) */}
          <div className="space-y-2">
            <label
              className="block text-sm font-medium"
              style={{ color: '#AEB7C1', fontFamily: 'Inter, sans-serif' }}
            >
              Imagem da Galeria
            </label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              folder="fly-crew/gallery"
            />
          </div>

          {/* Legenda */}
          <div className="space-y-2">
            <label
              className="block text-sm font-medium"
              style={{ color: '#AEB7C1', fontFamily: 'Inter, sans-serif' }}
            >
              Legenda
            </label>
            <textarea
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              onFocus={() => setFocusedField('caption')}
              onBlur={() => setFocusedField(null)}
              rows={3}
              placeholder="Descreva a imagem..."
              style={{ ...inputStyle(focusedField === 'caption'), resize: 'none' }}
            />
          </div>

          {/* Ordem + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                className="block text-sm font-medium"
                style={{ color: '#AEB7C1', fontFamily: 'Inter, sans-serif' }}
              >
                Ordem de Exibição
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                }
                onFocus={() => setFocusedField('displayOrder')}
                onBlur={() => setFocusedField(null)}
                min="0"
                style={inputStyle(focusedField === 'displayOrder')}
              />
            </div>

            <div className="space-y-2">
              <label
                className="block text-sm font-medium"
                style={{ color: '#AEB7C1', fontFamily: 'Inter, sans-serif' }}
              >
                Status
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-150"
                style={
                  formData.isActive
                    ? {
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        color: '#10B981',
                        borderRadius: '10px',
                      }
                    : {
                        background: 'rgba(248,113,113,0.12)',
                        border: '1px solid rgba(248,113,113,0.25)',
                        color: '#F87171',
                        borderRadius: '10px',
                      }
                }
              >
                <span
                  style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '99px',
                    background: formData.isActive ? '#10B981' : '#F87171',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  {formData.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </button>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2.5 text-sm font-medium hover:bg-white/10 hover:text-[#F7F7F5] transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#AEB7C1',
                borderRadius: '10px',
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !formData.imageUrl.trim() || !formData.caption.trim()}
              className="px-4 py-2.5 text-sm font-medium hover:brightness-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
              style={primaryButtonStyle}
            >
              {submitting ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </div>
      </DetailModal>
      {/* Modal de confirmação de exclusão */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </div>
  );
}
