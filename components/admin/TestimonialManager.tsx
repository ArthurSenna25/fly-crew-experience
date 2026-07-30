'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Plus, Edit2, Trash2, Power, Quote, Star, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { toast } from 'sonner';
import DetailModal from './DetailModal';
import ConfirmationModal from './ConfirmationModal';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import useEmblaCarousel from 'embla-carousel-react';
// FIX: o pacote exporta Autoplay como default, não nomeado.
// `import { Autoplay }` importava undefined e quebrava em runtime.
import Autoplay from 'embla-carousel-autoplay';
import ImageUpload from '@/components/admin/ImageUpload';

interface Testimonial {
  id: string;
  name: string;
  instagram: string;
  testimonial: string;
  rating: number;
  imageUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

// Tokens exatos do DESIGN-ADMIN.md em style inline — os mesmos usados em
// WorkshopManager.tsx/TagManager.tsx. Evita depender de classes Tailwind
// como bg-surface-low/text-cloud-white/bg-success/text-error, que nunca
// aparecem registradas em nenhum outro lugar do projeto e arriscam gerar
// nenhum CSS (mesma causa raiz do bug bg-glass-bg do DetailModal).
const cardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderTop: '1px solid rgba(255, 255, 255, 0.18)',
  borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
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

export default function TestimonialManager() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Ids de fotos que falharam ao carregar (Cloudinary fora do ar, URL
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
    name: '',
    instagram: '',
    testimonial: '',
    rating: 5,
    imageUrl: '',
    isActive: true,
    displayOrder: 0,
  });

  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/admin/testimonials');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erro ao carregar depoimentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      instagram: '',
      testimonial: '',
      rating: 5,
      imageUrl: '',
      isActive: true,
      displayOrder: testimonials.length,
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (testimonial: Testimonial) => {
    setEditing(testimonial);
    setFormData({
      name: testimonial.name || '',
      instagram: testimonial.instagram || '',
      testimonial: testimonial.testimonial || '',
      rating: testimonial.rating || 5,
      imageUrl: testimonial.imageUrl || '',
      isActive: testimonial.isActive,
      displayOrder: testimonial.displayOrder || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        rating: Number(formData.rating),
        displayOrder: Number(formData.displayOrder),
      };
      if (editing) {
        const res = await fetch(`/api/admin/testimonials/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success('Depoimento atualizado!');
      } else {
        const res = await fetch('/api/admin/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success('Depoimento criado!');
      }
      setShowModal(false);
      fetchTestimonials();
    } catch {
      toast.error('Erro ao salvar depoimento');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      await handleDelete(deletingId);
      handleDeleteCancel();
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeletingId(null);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao deletar depoimento');
    fetchTestimonials();
  };

  const toggleActive = async (testimonial: Testimonial) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${testimonial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !testimonial.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(testimonial.isActive ? 'Depoimento desativado' : 'Depoimento ativado');
      fetchTestimonials();
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const reducedMotion = useReducedMotion();

  // FIX: assinatura correta é useEmblaCarousel(options, plugins), e o
  // retorno é [emblaRef, emblaApi] NESSA ordem — a versão anterior pegava
  // só o primeiro item (a ref) e chamava de "emblaApi", então todo
  // método chamado nela (scrollSnaps, selectedSnap, canScrollPrev...)
  // estava sendo chamado no objeto errado.
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1, dragFree: false },
    reducedMotion ? [] : [Autoplay({ delay: 4000, stopOnInteraction: true })],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    // FIX: método certo é selectedScrollSnap(), não selectedSnap().
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

  // Pausa o autoplay no hover — numa tela de gerenciamento, o admin
  // precisa conseguir ler/editar sem o carrossel avançar sozinho embaixo
  // dele.
  const pauseAutoplay = () => {
    const autoplay: any = emblaApi?.plugins()?.autoplay;
    autoplay?.stop();
  };
  const resumeAutoplay = () => {
    const autoplay: any = emblaApi?.plugins()?.autoplay;
    autoplay?.play();
  };

  const entrance = (index: number) =>
    reducedMotion
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { type: 'spring' as const, stiffness: 300, damping: 30, delay: index * 0.04 },
        };

  const hoverStyle = reducedMotion
    ? {}
    : { y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', transition: { duration: 0.2, ease: 'easeOut' as const } };

  const renderTestimonialCard = (testimonial: Testimonial, index: number) => (
    <motion.div {...entrance(index)} whileHover={hoverStyle} style={cardStyle} className="h-full">
      <div className="relative h-48 w-full">
        {testimonial.imageUrl && !brokenImages.has(testimonial.id) ? (
          <Image
            src={testimonial.imageUrl}
            alt={testimonial.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            onError={() => markImageBroken(testimonial.id)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <User size={24} className="text-[#AEB7C1]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span
          className="absolute top-3 right-3 px-2.5 py-0.5 rounded text-[0.65rem] font-medium uppercase tracking-[0.05em]"
          style={
            testimonial.isActive
              ? { background: 'rgba(16,185,129,0.2)', color: '#10B981' }
              : { background: 'rgba(248,113,113,0.2)', color: '#F87171' }
          }
        >
          {testimonial.isActive ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-[1.0625rem] font-medium text-[#F7F7F5]">{testimonial.name}</h3>
          <p className="text-[0.75rem] text-[#AEB7C1] mt-0.5">{testimonial.instagram}</p>
        </div>

        <div className="flex items-center gap-0.5" aria-label={`Avaliação: ${testimonial.rating} de 5`}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < testimonial.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#AEB7C1]/30'}
              aria-hidden="true"
            />
          ))}
        </div>

        <p className="text-[0.875rem] text-[#AEB7C1] leading-relaxed line-clamp-4" title={testimonial.testimonial}>
          {testimonial.testimonial}
        </p>

        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          <button
            onClick={() => openEdit(testimonial)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[0.7rem] font-medium uppercase tracking-[0.05em] rounded-lg transition-colors duration-150"
            style={{ background: 'rgba(212,175,55,0.10)', color: '#D4AF37' }}
            aria-label={`Editar depoimento de ${testimonial.name}`}
          >
            <Edit2 size={14} /> Editar
          </button>
          <button
            onClick={() => toggleActive(testimonial)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[0.7rem] font-medium uppercase tracking-[0.05em] rounded-lg transition-colors duration-150"
            style={
              testimonial.isActive
                ? { background: 'rgba(248,113,113,0.15)', color: '#F87171' }
                : { background: 'rgba(16,185,129,0.15)', color: '#10B981' }
            }
            aria-label={testimonial.isActive ? `Desativar depoimento de ${testimonial.name}` : `Ativar depoimento de ${testimonial.name}`}
          >
            {/* FIX: "Ativar" usava o ícone Star (confunde com avaliação).
                Power representa ligar/desligar nos dois estados, igual ao
                resto do admin. */}
            <Power size={14} /> {testimonial.isActive ? 'Desativar' : 'Ativar'}
          </button>
          <button
            onClick={() => handleDeleteClick(testimonial.id)}
            className="flex items-center justify-center px-3 py-2 rounded-lg transition-colors duration-150"
            style={{ background: 'rgba(248,113,113,0.10)', color: '#F87171' }}
            aria-label={`Deletar depoimento de ${testimonial.name}`}
            title="Deletar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const useCarousel = testimonials.length > 3;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-[1.25rem] font-semibold text-[#F7F7F5] mb-2">Gerenciar Depoimentos</h1>
          <p className="text-[0.8125rem] text-[#AEB7C1]">
            Adicione, edite e organize os depoimentos exibidos no site.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium uppercase tracking-wider hover:brightness-110 hover:shadow-[0_4px_20px_rgba(212,175,55,0.45)] transition-all duration-200 w-full sm:w-auto"
          style={primaryButtonStyle}
        >
          <Plus size={20} />
          Novo Depoimento
        </button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="animate-pulse" style={{ ...cardStyle, opacity: 0.4 }}>
              <div className="h-48 w-full bg-white/10" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-24 rounded bg-white/10" />
                <div className="h-3 w-32 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && testimonials.length === 0 && (
        <div className="text-center py-12" style={{ ...cardStyle, background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Quote size={28} className="mx-auto mb-4 text-[#6B7280]" />
          <p className="text-sm text-[#AEB7C1] max-w-xl mx-auto">
            Nenhum depoimento cadastrado. Clique em "Novo Depoimento" para começar.
          </p>
        </div>
      )}

      {!loading && testimonials.length > 0 && !useCarousel && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <div key={t.id}>{renderTestimonialCard(t, i)}</div>
          ))}
        </div>
      )}

      {!loading && useCarousel && (
        <div>
          <div className="flex items-center justify-end gap-2 mb-4">
            <button
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canScrollPrev}
              aria-label="Slide anterior"
              className="flex items-center justify-center w-9 h-9 transition-opacity duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
              style={navButtonStyle}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canScrollNext}
              aria-label="Próximo slide"
              className="flex items-center justify-center w-9 h-9 transition-opacity duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
              style={navButtonStyle}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="overflow-hidden" ref={emblaRef} onMouseEnter={pauseAutoplay} onMouseLeave={resumeAutoplay}>
            <div className="flex gap-4 -ml-4 pl-4">
              {testimonials.map((t, i) => (
                <div key={t.id} className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_31%] min-w-0">
                  {renderTestimonialCard(t, i)}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex justify-center items-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Ir para depoimento ${index + 1}`}
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

      <p className="text-[0.7rem] tracking-[0.05em] text-[#AEB7C1]/50 uppercase text-right">
        Depoimentos capturados durante a formação Fly Crew
      </p>

      <DetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Editar Depoimento' : 'Novo Depoimento'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#AEB7C1]">Foto do Depoente</label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              folder="fly-crew/testimonials"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#AEB7C1]">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              required
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: focusedField === 'name' ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.10)',
                borderRadius: '10px',
                color: '#F7F7F5',
                boxShadow: focusedField === 'name' ? '0 0 0 3px rgba(255,255,255,0.06)' : 'none',
                outline: 'none',
                padding: '0.625rem 0.875rem',
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#AEB7C1]">Nome de Usuário do Instagram</label>
            <input
              type="text"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              onFocus={() => setFocusedField('instagram')}
              onBlur={() => setFocusedField(null)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: focusedField === 'instagram' ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.10)',
                borderRadius: '10px',
                color: '#F7F7F5',
                boxShadow: focusedField === 'instagram' ? '0 0 0 3px rgba(255,255,255,0.06)' : 'none',
                outline: 'none',
                padding: '0.625rem 0.875rem',
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#AEB7C1]">Depoimento</label>
            <textarea
              value={formData.testimonial}
              onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
              onFocus={() => setFocusedField('testimonial')}
              onBlur={() => setFocusedField(null)}
              required
              rows={5}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: focusedField === 'testimonial' ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.10)',
                borderRadius: '10px',
                color: '#F7F7F5',
                boxShadow: focusedField === 'testimonial' ? '0 0 0 3px rgba(255,255,255,0.06)' : 'none',
                outline: 'none',
                padding: '0.625rem 0.875rem',
                resize: 'none',
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#AEB7C1]">Avaliação</label>
              <div role="radiogroup" aria-label="Avaliação" className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={formData.rating >= star}
                    aria-label={`Avaliar com ${star} estrelas`}
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1 rounded hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    style={{ color: formData.rating >= star ? '#D4AF37' : '#AEB7C1' }}
                  >
                    <Star size={20} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#AEB7C1]">Ordem</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                onFocus={() => setFocusedField('displayOrder')}
                onBlur={() => setFocusedField(null)}
                min="0"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: focusedField === 'displayOrder' ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '10px',
                  color: '#F7F7F5',
                  boxShadow: focusedField === 'displayOrder' ? '0 0 0 3px rgba(255,255,255,0.06)' : 'none',
                  outline: 'none',
                  padding: '0.625rem 0.875rem',
                }}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2.5 text-sm font-medium hover:bg-white/10 hover:text-[#F7F7F5] transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#AEB7C1', borderRadius: '10px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formData.name || !formData.testimonial}
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
        title="Excluir depoimento"
        description={
          deletingId
            ? `Tem certeza que deseja excluir o depoimento de "${
                testimonials.find((t) => t.id === deletingId)?.name ?? ""
              }"? Esta ação não pode ser desfeita.`
            : "Tem certeza que deseja excluir este depoimento? Esta ação não pode ser desfeita."
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
