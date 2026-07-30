'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type GallerySectionDefault from '@/components/landing/GallerySection';

type GallerySectionProps = ComponentProps<typeof GallerySectionDefault>;

/**
 * GallerySectionClient — Client Component wrapper que importa GallerySection
 * de forma dinâmica com `ssr: false`. É o único lugar legal no App Router
 * (Next 15) para hospedar `ssr: false`, já que `app/page.tsx` é um Server
 * Component. O import dinâmico força GallerySection + embla + embla-autoplay
 * a virarem um chunk lazy separado, fora do First Load JS da rota `/`.
 *
 * O `loading` renderiza um skeleton estático com a mesma cor de fundo e roughly
 * o mesmo footprint vertical do <Section bg="black"> real, para não introduzir
 * layout shift enquanto o chunk real carrega.
 */
const GallerySection = dynamic(() => import('@/components/landing/GallerySection'), {
  ssr: false,
  loading: () => <GallerySkeleton />,
});

export default function GallerySectionClient(props: GallerySectionProps) {
  return <GallerySection {...props} />;
}

function GallerySkeleton() {
  return (
    <section
      id="gallery"
      aria-hidden="true"
      className="relative bg-executive-black py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto min-h-[60vh] max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="mb-12 h-40 sm:mb-16 lg:mb-20" />
        <div className="h-[42vh] w-full rounded-lg bg-white/[0.02] ring-1 ring-white/[0.04]" />
      </div>
    </section>
  );
}
