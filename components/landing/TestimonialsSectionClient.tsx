'use client';

import dynamic from 'next/dynamic';

/**
 * TestimonialsSectionClient — Client Component wrapper que importa
 * TestimonialsSection de forma dinâmica com `ssr: false`. Único lugar legal
 * no App Router (Next 15) para hospedar `ssr: false`, já que `app/page.tsx`
 * é Server Component. Força TestimonialsSection + seu uso pesado de
 * framer-motion (motion, AnimatePresence, PanInfo, Variants) a virarem um
 * chunk lazy separado, fora do First Load JS da rota `/`.
 *
 * TestimonialsSection não recebe props (faz fetch interno a /api/testimonials),
 * então este wrapper também não recebe — `<TestimonialsSection />` em
 * app/page.tsx não passa nada. (Diferente de Gallery/Workshops, onde há props
 * serializáveis repassadas via ComponentProps — aqui não há o que repassar.)
 *
 * O `loading` renderiza um skeleton estático (sem JS) com a mesma cor de fundo
 * e roughly o mesmo footprint vertical do <section id="testimonials"> real
 * (py-24 sm:py-32 lg:py-40 + header + carrossel), para não introduzir layout
 * shift enquanto o chunk real carrega. Vive neste wrapper (não em
 * TestimonialsSection.tsx) para não criar aresta estática que puxe framer-motion.
 */
const TestimonialsSection = dynamic(() => import('@/components/landing/TestimonialsSection'), {
  ssr: false,
  loading: () => <TestimonialsSkeleton />,
});

export default function TestimonialsSectionClient() {
  return <TestimonialsSection />;
}

function TestimonialsSkeleton() {
  return (
    <section
      id="testimonials"
      aria-hidden="true"
      className="relative overflow-hidden bg-executive-black py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="mx-auto mb-16 h-32 max-w-3xl" />
        <div className="mx-auto h-[42vh] max-w-2xl rounded-lg bg-white/[0.02] ring-1 ring-white/[0.04]" />
      </div>
    </section>
  );
}
