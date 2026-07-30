'use client';

import dynamic from 'next/dynamic';

/**
 * TransformationSectionClient — Client Component wrapper que importa
 * TransformationSection de forma dinâmica com `ssr: false`. Único lugar legal
 * no App Router (Next 15) para hospedar `ssr: false`, já que `app/page.tsx`
 * é Server Component. Força TransformationSection (motion + useInViewSafe +
 * 4 StepRows editoriais) a virar chunk lazy separado, fora do First Load JS
 * da rota `/`.
 *
 * TransformationSection não recebe props, então este wrapper também não recebe.
 *
 * ATENÇÃO à cor de fundo: <Section bg="midnight"> mapeia para
 * `bg-midnight-premium/30` — NÃO é executive-black como as demais. O skeleton
 * replica essa cor para evitar layout shift visual. A seção passa nenhum
 * sectionId ao <Section>, então nenhum id fica no DOM — o skeleton também omite
 * id. Footprint vertical segue py-24 sm:py-32 lg:py-40 do <Section>. Vive
 * neste wrapper (não em TransformationSection.tsx) para não criar aresta
 * estática que puxe framer-motion.
 */
const TransformationSection = dynamic(() => import('@/components/landing/TransformationSection'), {
  ssr: false,
  loading: () => <TransformationSkeleton />,
});

export default function TransformationSectionClient() {
  return <TransformationSection />;
}

function TransformationSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="relative overflow-hidden bg-midnight-premium/30 py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Header footprint (mb-16 sm:mb-20 lg:mb-24) */}
        <div className="mb-16 h-36 max-w-4xl sm:mb-20 lg:mb-24" />
        {/* 4 StepRows footprint */}
        <div className="space-y-12 sm:space-y-16 lg:space-y-20">
          <div className="h-40 rounded bg-white/[0.02] ring-1 ring-white/[0.04]" />
          <div className="h-40 rounded bg-white/[0.02] ring-1 ring-white/[0.04]" />
          <div className="h-40 rounded bg-white/[0.02] ring-1 ring-white/[0.04]" />
          <div className="h-40 rounded bg-white/[0.02] ring-1 ring-white/[0.04]" />
        </div>
        {/* Footer accent (mt-16 sm:mt-20 lg:mt-24 pt-8 border-t) */}
        <div className="mt-16 h-24 max-w-3xl border-t border-white/[0.04] pt-8 sm:mt-20 lg:mt-24" />
      </div>
    </section>
  );
}
