'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type WorkshopsSectionDefault from '@/components/landing/WorkshopsSection';

type WorkshopsSectionProps = ComponentProps<typeof WorkshopsSectionDefault>;

/**
 * WorkshopsSectionClient — Client Component wrapper que importa
 * WorkshopsSection de forma dinâmica com `ssr: false`. Único lugar legal
 * no App Router (Next 15) para hospedar `ssr: false`, já que `app/page.tsx`
 * é Server Component. Força WorkshopsSection + WorkshopBookingForm (+ sonner,
 * que o formulário importa estaticamente) + framer-motion a virarem um chunk
 * lazy separado, fora do First Load JS da rota `/`.
 *
 * O `loading` renderiza um skeleton estático (sem JS) com a mesma cor de fundo
 * e roughly o mesmo footprint vertical do <Section bg="black"> real
 * (py-24 sm:py-32 lg:py-40 + header + grid/carrossel + separador editorial
 * + form), para não introduzir layout shift enquanto o chunk real carrega.
 * Vive neste wrapper (não em WorkshopsSection.tsx) para não criar aresta
 * estática que puxe framer-motion/sonner.
 */
const WorkshopsSection = dynamic(() => import('@/components/landing/WorkshopsSection'), {
  ssr: false,
  loading: () => <WorkshopsSkeleton />,
});

export default function WorkshopsSectionClient(props: WorkshopsSectionProps) {
  return <WorkshopsSection {...props} />;
}

function WorkshopsSkeleton() {
  return (
    <section
      id="workshops"
      aria-hidden="true"
      className="relative bg-executive-black py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        {/* Header footprint (eyebrow + h2 + divider, mb-16 lg:mb-20) */}
        <div className="mx-auto mb-16 h-40 max-w-3xl lg:mb-20" />

        {/* Workshops display footprint (mb-16): 3-card grid placeholder */}
        <div className="mb-16 grid min-h-[42vh] gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="hidden rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.04] md:block md:col-span-2 lg:col-span-1" />
          <div className="rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.04]" />
          <div className="hidden rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.04] lg:block" />
        </div>

        {/* Editorial separator (my-20) */}
        <div className="mx-auto my-20 h-px w-full bg-gold-prestige/[0.04]" />

        {/* Booking form footprint (max-w-2xl) */}
        <div className="mx-auto h-40 max-w-2xl rounded-lg bg-white/[0.02] ring-1 ring-white/[0.04]" />
      </div>
    </section>
  );
}
