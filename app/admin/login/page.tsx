'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

/* ────────────────────────────────────────────────────────────
   Reduced-motion hook (Regra #14 — sempre dentro de useEffect,
   mesma implementação reutilizada nas outras seções do projeto)
──────────────────────────────────────────────────────────── */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

/* ────────────────────────────────────────────────────────────
   Noise texture (Apple-style grain) — DESIGN-ADMIN.md "Efeitos
   Especiais": 3% de opacidade sobre superfícies glass, dá a
   textura fosca característica.
──────────────────────────────────────────────────────────── */
const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/* ────────────────────────────────────────────────────────────
   Variants — spec DESIGN-ADMIN.md
   Modal open: y 20→0, opacity 0→1, 300ms, cubic-bezier(0.16,1,0.3,1)
   Stagger children: delay i * 40ms
──────────────────────────────────────────────────────────── */
const modalVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: 0.1 + i * 0.04, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });
      if (result.error) {
        toast.error(result.error.message || 'Email ou senha inválidos');
        return;
      }
      toast.success('Login realizado com sucesso!');
      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      toast.error('Erro ao fazer login. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6">
      {/* Ambient glow — "surfaces that breathe", extremamente sutil (6-8%) */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gold-prestige/[0.06] blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#0B1F33]/40 blur-[140px]" />

      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-10 text-center">
          <h1
            data-testid="admin-login-title"
            className="font-inter text-3xl font-semibold tracking-tight text-[#F7F7F5]"
          >
            FLY CREW
          </h1>
          <p className="mt-3 font-inter text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-gold-prestige">
            Admin Access
          </p>
        </div>

        {/* Card — Level 4 (Modal), spec DESIGN-ADMIN.md */}
        <motion.div
          initial={reducedMotion ? false : 'hidden'}
          animate="visible"
          variants={modalVariants}
          className="relative overflow-hidden rounded-[20px] p-8 lg:p-10"
          style={{
            background: 'rgba(14,14,14,0.85)',
            backdropFilter: 'blur(40px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
            borderTop: '1px solid rgba(255,255,255,0.20)',
            borderLeft: '1px solid rgba(255,255,255,0.12)',
            borderRight: '1px solid rgba(255,255,255,0.12)',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          }}
        >
          {/* Grain sutil, característico Apple-glass */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[20px] opacity-[0.03]"
            style={{ backgroundImage: NOISE_SVG }}
          />

          <form onSubmit={handleSubmit} className="relative space-y-5" noValidate>
            {/* Email */}
            <motion.div
              custom={0}
              initial={reducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              variants={fieldVariants}
            >
              <label htmlFor="admin-email" className="sr-only">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#AEB7C1]"
                  strokeWidth={1.5}
                />
                <input
                  id="admin-email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  data-testid="admin-email-input"
                  className={[
                    'w-full rounded-[10px] py-3 pl-11 pr-4 font-inter text-sm text-[#F7F7F5]',
                    'bg-white/[0.04] border border-white/[0.10] placeholder:text-[#6B7280]',
                    'outline-none transition-[border-color,box-shadow] duration-200 ease-out',
                    'focus:border-white/25 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]',
                  ].join(' ')}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              custom={1}
              initial={reducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              variants={fieldVariants}
            >
              <label htmlFor="admin-password" className="sr-only">
                Senha
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#AEB7C1]"
                  strokeWidth={1.5}
                />
                <input
                  id="admin-password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  minLength={8}
                  data-testid="admin-password-input"
                  className={[
                    'w-full rounded-[10px] py-3 pl-11 pr-4 font-inter text-sm text-[#F7F7F5]',
                    'bg-white/[0.04] border border-white/[0.10] placeholder:text-[#6B7280]',
                    'outline-none transition-[border-color,box-shadow] duration-200 ease-out',
                    'focus:border-white/25 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]',
                  ].join(' ')}
                />
              </div>
            </motion.div>

            {/* Botão Primário — Gold Prestige, ação crítica */}
            <motion.button
              type="submit"
              disabled={submitting}
              data-testid="admin-login-btn"
              custom={2}
              initial={reducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              variants={fieldVariants}
              className={[
                'flex w-full items-center justify-center gap-2 rounded-[10px] py-3.5',
                'font-inter text-sm font-semibold uppercase tracking-wider',
                'bg-gold-prestige text-[#0A0A0A]',
                'shadow-[0_2px_12px_rgba(212,175,55,0.35)]',
                'transition-[filter,box-shadow] duration-200 ease-out',
                'hover:brightness-110 hover:shadow-[0_4px_20px_rgba(212,175,55,0.45)]',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100',
              ].join(' ')}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              {submitting ? 'Entrando...' : 'Entrar'}
            </motion.button>
          </form>

          <div className="relative mt-8 text-center">
            <button
              onClick={() => router.push('/')}
              className="font-inter text-sm text-[#AEB7C1] transition-colors duration-200 ease-out hover:text-gold-prestige"
            >
              ← Voltar ao site
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
