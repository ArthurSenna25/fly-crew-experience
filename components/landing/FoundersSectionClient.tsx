'use client';

import dynamic from 'next/dynamic';

/**
 * FoundersSectionClient — Client Component wrapper que importa
 * FoundersSection de forma dinâmica com `ssr: false`. Único lugar legal
 * no App Router (Next 15) para hospedar `ssr: false`, já que `app/page.tsx`
 * é Server Component. Força FoundersSection (scroll-driven motion com
 * useScroll/useTransform + useInViewSafe/useReducedMotion/useIsMobile + 2
 * FounderCards) a virar chunk lazy separado, fora do First Load JS da rota
 * `/`. O uso de useScroll/useTransform dentro de Client Component é suportado
 * e funciona normalmente — flag do usuário observado, sem alteração de lógica.
 *
 * FoundersSection não recebe props, então este wrapper também não recebe.
 *
 * ATENÇÃO ao footprint: FoundersSection NÃO usa o wrapper <Section> — usa
 * <section> cru com padding MAIOR (py-32 sm:py-40 lg:py-48) que as demais
 * (que são py-24 sm:py-32 lg:py-40). O skeleton replica exatamente esse
 * padding maior para não introduzir layout shift. Id="founders" preservado
 * (âncora de scroll-nav). Vive neste wrapper (não em FoundersSection.tsx)
 * para não criar aresta estática que puxe framer-motion.
 *
 * Nota bônus: distinto das seções com bg="midnight" — aqui bg="executive-black"
 * (section cru, não o wrapper Section bg="black" que mapeia igual).
 */
const FoundersSection = dynamic(() => import('@/components/landing/FoundersSection'), {
  ssr: false,
  loading: () => <FoundersSkeleton />,
});

export default function FoundersSectionClient() {
  return <FoundersSection />;
}

function FoundersSkeleton() {
  return (
    <section
      id="founders"
      aria-hidden="true"
      className="relative overflow-hidden bg-executive-black py-32 sm:py-40 lg:py-48"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Header footprint (mb-24 lg:mb-32) */}
        <div className="mb-24 h-40 max-w-4xl lg:mb-32" />
        {/* 2 FounderCards footprint — space-y-[60px] lg:space-y-[80px], each lg:grid-cols-12, image aspect-[3/4] */}
        <div className="space-y-[60px] lg:space-y-[80px]">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.04] lg:col-span-5" />
            <div className="space-y-6 lg:col-span-7">
              <div className="h-24 max-w-xl rounded bg-white/[0.02]" />
              <div className="h-20 max-w-xl rounded bg-white/[0.02]" />
              <div className="h-20 max-w-lg rounded bg-white/[0.02]" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-6 lg:order-1 lg:col-span-7">
              <div className="h-24 max-w-xl rounded bg-white/[0.02]" />
              <div className="h-20 max-w-xl rounded bg-white/[0.02]" />
              <div className="h-20 max-w-lg rounded bg-white/[0.02]" />
            </div>
            <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.04] lg:order-2 lg:col-span-5" />
          </div>
        </div>
      </div>
    </section>
  );
}
