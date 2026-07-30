'use client';

import dynamic from 'next/dynamic';

/**
 * ExperienceSectionClient — Client Component wrapper que importa
 * ExperienceSection de forma dinâmica com `ssr: false`. Único lugar legal
 * no App Router (Next 15) para hospedar `ssr: false`, já que `app/page.tsx`
 * é Server Component. Força ExperienceSection (4 pilares editoriais com numerais
 * grandes via framer-motion + useInViewSafe) a virar chunk lazy separado,
 * fora do First Load JS da rota `/`.
 *
 * ExperienceSection não recebe props, então este wrapper também não recebe.
 *
 * O `loading` renderiza um skeleton estático (sem JS) com a mesma cor de fundo
 * e roughly o mesmo footprint vertical do <Section bg="black" sectionId=
 * "experience" ...overflow-hidden isolate w-full max-w-full> real (py-24
 * sm:py-32 lg:py-40 + header + 4 pilares altos = seção bem alta), para não
 * introduzir layout shift. Vive neste wrapper (não em ExperienceSection.tsx)
 * para não criar aresta estática que puxe framer-motion.
 */
const ExperienceSection = dynamic(() => import('@/components/landing/ExperienceSection'), {
  ssr: false,
  loading: () => <ExperienceSkeleton />,
});

export default function ExperienceSectionClient() {
  return <ExperienceSection />;
}

function ExperienceSkeleton() {
  return (
    <section
      id="experience"
      aria-hidden="true"
      className="relative isolate w-full max-w-full overflow-hidden bg-executive-black py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        {/* Header footprint (mb-12 sm:mb-16 lg:mb-20) */}
        <div className="mb-12 h-32 max-w-4xl sm:mb-16 lg:mb-20" />
        {/* 4 pillars footprint — divide-y divide-white/[0.04], each py-12 sm:py-16 lg:py-20 */}
        <div className="min-h-[60vh] divide-y divide-white/[0.04]">
          <div className="h-48" />
          <div className="h-48" />
          <div className="h-48" />
          <div className="h-48" />
        </div>
      </div>
    </section>
  );
}
