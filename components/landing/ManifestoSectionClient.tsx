'use client';

import dynamic from 'next/dynamic';

/**
 * ManifestoSectionClient — Client Component wrapper que importa
 * ManifestoSection de forma dinâmica com `ssr: false`. Único lugar legal
 * no App Router (Next 15) para hospedar `ssr: false`, já que `app/page.tsx`
 * é Server Component. Força ManifestoSection + ParallaxImage (useScroll/
 * useTransform) + framer-motion a virarem um chunk lazy separado, fora do
 * First Load JS da rota `/`.
 *
 * ManifestoSection não recebe props, então este wrapper também não recebe
 * — `<ManifestoSection />` em app/page.tsx não passa nada.
 *
 * O `loading` renderiza um skeleton estático (sem JS) com a mesma cor de fundo
 * e roughly o mesmo footprint vertical do <Section bg="black" sectionId=
 * "manifesto"> real (py-24 sm:py-32 lg:py-40 + grid 2 colunas: texto à
 * esquerda, ParallaxImage 5/6 à direita), para não introduzir layout shift
 * enquanto o chunk real carrega. Vive neste wrapper (não em
 * ManifestoSection.tsx) para não criar aresta estática que puxe
 * framer-motion/ParallaxImage.
 */
const ManifestoSection = dynamic(() => import('@/components/landing/ManifestoSection'), {
  ssr: false,
  loading: () => <ManifestoSkeleton />,
});

export default function ManifestoSectionClient() {
  return <ManifestoSection />;
}

function ManifestoSkeleton() {
  return (
    <section
      id="manifesto"
      aria-hidden="true"
      className="relative bg-executive-black py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 xl:gap-24">
          {/* Left — text column footprint */}
          <div className="order-2 space-y-8 lg:order-1">
            <div className="h-28 max-w-md" />
            <div className="space-y-6">
              <div className="h-20 max-w-xl rounded bg-white/[0.02]" />
              <div className="h-20 max-w-xl rounded bg-white/[0.02]" />
            </div>
          </div>
          {/* Right — ParallaxImage 5/6 footprint */}
          <div className="relative order-1 overflow-hidden rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.04] lg:order-2">
            <div className="aspect-[5/6] w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
