'use client';

import { useState, useEffect, useRef } from 'react';
import { queueDebugLog } from '@/lib/debug-log-batch';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronDown, CheckCircle } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Workshop {
  id: string;
  title: string;
}

interface WorkshopBookingFormProps {
  workshops: Workshop[];
}

export default function WorkshopBookingForm({ workshops }: WorkshopBookingFormProps) {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Fica antes do early return 'if (success)'
  // para respeitar as Rules of Hooks. Nome 'workshop-booking-form-render-start'
  // (único — distinto de 'workshops-render-start' da WorkshopsSection; não
  // reutiliza nenhuma mark já usada na página /).
  const workshopBookingFormRenderMarkedRef = useRef(false);
  if (!workshopBookingFormRenderMarkedRef.current) {
    workshopBookingFormRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('workshop-booking-form-render-start');
    }
  }

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    workshopType: '',
    preferredDate: null as string | null,
    message: '',
    lgpdConsent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const reducedMotion = useReducedMotion();

  // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
  // terminou (passive effects rodaram). O delta real (mark → mount effects)
  // é calculado AQUI no cliente usando a mark 'workshop-booking-form-render-start'
  // criada no topo do componente, e enviado como msSinceMark — o servidor só
  // o exibe. (performance.now() é relativo à navegação da página; subtrair de
  // Date.now() epoch não representaria tempo real nenhum.) WorkshopBookingForm
  // não tinha useEffect de mount pré-existente, então este foi criado novo.
  // Posicionado antes do early return 'if (success)' (Rules of Hooks).
  useEffect(() => {
    const markName = 'workshop-booking-form-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    queueDebugLog({
      tag: 'WorkshopBookingForm',
      msg: 'mount effects complete',
      msSinceMark,
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lgpdConsent) {
      toast.error('Você precisa concordar com nossa política de privacidade.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/workshops/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success('Reserva recebida! Entraremos em contato em breve.');
        setSuccess(true);
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            phone: '',
            workshopType: '',
            preferredDate: '',
            message: '',
            lgpdConsent: false,
          });
          setSuccess(false);
        }, 5000);
      } else {
        toast.error('Erro ao enviar reserva. Tente novamente.');
      }
    } catch {
      toast.error('Erro ao enviar reserva.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl focus:border-gold-prestige focus:outline-none text-white placeholder:text-silver-mist/40 px-5 py-3.5 font-montserrat text-sm transition-all duration-300';

  if (success) {
    return (
      <div className="text-center space-y-6 py-16">
        <CheckCircle className="mx-auto text-gold-prestige" size={48} strokeWidth={1.5} />
        <h2 className="text-2xl font-cinzel font-light text-white">Reserva enviada!</h2>
        <p className="font-montserrat text-silver-mist/80 max-w-md mx-auto">
          Entraremos em contato em breve.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-16">
        {/* Left column — editorial intro */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:w-[38%] flex-shrink-0 mb-10 lg:mb-0"
        >
          <span className="block text-xs uppercase tracking-[0.3em] text-gold-prestige font-semibold mb-6">
            RESERVE SUA EXPERIÊNCIA
          </span>
          <h2 className="font-cinzel font-light text-white text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-6">
            Transforme Sua
            <br />
            <span className="text-gold-prestige">Jornada</span>
          </h2>
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-gold-prestige to-transparent mb-6" />
          <p className="font-montserrat font-light text-silver-mist/80 text-base leading-relaxed">
            Entre em contato e dê o primeiro passo rumo à excelência na aviação civil.
          </p>
          <div className="mt-12 text-gold-prestige/20 font-cinzel text-[8rem] leading-none select-none">
            ✦
          </div>
        </motion.div>

        {/* Right column — form fields */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 space-y-5"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input
                type="text"
                placeholder="Seu Nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className={inputClass}
              />
              <input
                type="email"
                placeholder="Seu Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <input
              type="tel"
              placeholder="Telefone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className={inputClass}
            />

            {/* Workshop select */}
            <div className="relative">
              <select
                value={formData.workshopType}
                onChange={(e) => setFormData({ ...formData, workshopType: e.target.value })}
                required
                className={`${inputClass} appearance-none`}
              >
                <option value="" className="bg-executive-black">
                  Selecione a Experiência
                </option>
                {workshops.map((ws) => (
                  <option key={ws.id} value={ws.title} className="bg-executive-black">
                    {ws.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-mist/40 pointer-events-none" />
            </div>

            {/* Preferred date */}
            <div className="relative">
              <input
                type="text"
                placeholder="Data preferida — dd/mm/aaaa (opcional)"
                value={formData.preferredDate || ''}
                onChange={(e) => {
                  // Máscara automática: só permite dígitos, insere / nas posições 2 e 5
                  let v = e.target.value.replace(/\D/g, '').slice(0, 8);
                  if (v.length >= 5) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
                  else if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                  setFormData({ ...formData, preferredDate: v });
                }}
                maxLength={10}
                inputMode="numeric"
                className="w-full bg-white/5 border border-white/10 rounded-xl focus:border-gold-prestige focus:outline-none text-white placeholder:text-silver-mist/40 px-5 py-3.5 font-montserrat text-sm transition-all duration-300"
              />
            </div>

            {/* Message */}
            <textarea
              placeholder="Mensagem Adicional (Opcional)"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className={`${inputClass} resize-none`}
            />

            {/* LGPD */}
            <label className="flex items-start gap-3 text-sm text-silver-mist cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.lgpdConsent}
                onChange={(e) => setFormData({ ...formData, lgpdConsent: e.target.checked })}
                required
                className="mt-1 accent-gold-prestige flex-shrink-0"
              />
              <span className="group-hover:text-white transition-colors duration-300 leading-relaxed">
                Concordo com o processamento dos meus dados pessoais de acordo com a Política de
                Privacidade (LGPD).
              </span>
            </label>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={submitting}
              className="w-full bg-gold-prestige text-executive-black font-semibold py-4 rounded-xl uppercase tracking-[0.2em] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-gold-prestige/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? 'Enviando...' : 'Reservar Meu Lugar'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
