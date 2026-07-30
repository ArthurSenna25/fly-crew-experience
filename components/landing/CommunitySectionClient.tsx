'use client';

import dynamic from 'next/dynamic';

/**
 * CommunitySectionClient — Client Component wrapper que importa
 * CommunitySection de forma dinâmica com `ssr: false`. Único lugar legal
 * no App Router (Next 15) para hospedar `ssr: false`, já que `app/page.tsx`
 * é Server Component. Força CommunitySection (motion + useInViewSafe + grid
 * 2 colunas com NewsletterForm) a virar chunk lazy separado, fora do First
 * Load JS da rota `/`.
 *
 * BÔNUS: CommunitySection importa estaticamente NewsletterForm, que importa
 * `toast` de sonner. Por ssr:false aqui, sonner pode migrar do chunk inicial
 * (onde está hoje em 8720) para o chunk lazy desta seção — sera verificado
 * no fingerprint final e reportado se ocorrer.
 *
 * CommunitySection não recebe props, então este wrapper também não recebe.
 *
 * ATENÇÃO à cor de fundo: <Section bg="midnight" sectionId="community" ...
 * overflow-hidden isolate w-full max-w-full> mapeia para `bg-midnight-premium/30`
 * — NÃO é executive-black. O skeleton replica essa cor. Id="community"
 * preservado (âncora de scroll-nav). Footprint vertical py-24 sm:py-32
 * lg:py-40 do <Section>. Vive neste wrapper (não em CommunitySection.tsx)
 * para não criar aresta estática que puxe framer-motion/sonner.
 */
const CommunitySection = dynamic(() => import('@/components/landing/CommunitySection'), {
  ssr: false,
  loading: () => <CommunitySkeleton />,
});

export default function CommunitySectionClient() {
  return <CommunitySection />;
}

function CommunitySkeleton() {
  return (
    <section
      id="community"
      aria-hidden="true"
      className="relative isolate w-full max-w-full overflow-hidden bg-midnight-premium/30 py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* 2-col grid (lg:grid-cols-2 gap-12 lg:gap-24): left content / right NewsletterForm footprint */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
          {/* Left — content column footprint */}
          <div className="space-y-8">
            <div className="h-28 max-w-md" />
            <div className="space-y-6">
              <div className="h-24 max-w-xl rounded bg-white/[0.02]" />
              <div className="h-20 max-w-lg rounded bg-white/[0.02]" />
            </div>
          </div>
          {/* Right — NewsletterForm footprint */}
          <div className="rounded-lg bg-white/[0.02] p-8 ring-1 ring-white/[0.04]">
            <div className="mb-6 h-8 w-40 rounded bg-white/[0.03]" />
            <div className="space-y-4">
              <div className="h-12 w-full rounded bg-white/[0.03]" />
              <div className="h-12 w-full rounded bg-white/[0.03]" />
              <div className="h-12 w-32 rounded bg-white/[0.03]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
