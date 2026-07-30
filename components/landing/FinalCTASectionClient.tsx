'use client';

import dynamic from 'next/dynamic';

/**
 * FinalCTASectionClient — Client Component wrapper que importa
 * FinalCTASection de forma dinâmica com `ssr: false`. Único lugar legal
 * no App Router (Next 15) para hospedar `ssr: false`, já que `app/page.tsx`
 * é Server Component. Força FinalCTASection (scroll-driven motion com
 * useScroll/useTransform + useInView + ContactForm) a virar chunk lazy
 * separado, fora do First Load JS da rota `/`. O uso de useScroll/useTransform
 * dentro de Client Component é suportado e funciona normalmente — flag do
 * usuário observado, sem alteração de lógica.
 *
 * BÔNUS: FinalCTASection importa estaticamente ContactForm, que importa
 * `toast` de sonner. Por ssr:false aqui, sonner pode migrar do chunk inicial
 * (8720) para o chunk lazy desta seção — sera verificado no fingerprint final
 * e reportado se ocorrer.
 *
 * FinalCTASection não recebe props, então este wrapper também não recebe.
 *
 * Cor de fundo: <Section sectionId="contact" bg="black" ...overflow-hidden
 * isolate w-full max-w-full> → `bg-executive-black`. Id="contact" preservado
 * (âncora de scroll-nav). Footprint vertical py-24 sm:py-32 lg:py-40 do
 * <Section>, mais header (mb-16) e área de form max-w-2xl. Vive neste wrapper
 * (não em FinalCTASection.tsx) para não criar aresta estática que puxe
 * framer-motion/sonner.
 */
const FinalCTASection = dynamic(() => import('@/components/landing/FinalCTASection'), {
  ssr: false,
  loading: () => <FinalCTASkeleton />,
});

export default function FinalCTASectionClient() {
  return <FinalCTASection />;
}

function FinalCTASkeleton() {
  return (
    <section
      id="contact"
      aria-hidden="true"
      className="relative isolate w-full max-w-full overflow-hidden bg-executive-black py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Header footprint (mb-16) */}
        <div className="mx-auto mb-16 h-40 max-w-3xl" />
        {/* Form area footprint (max-w-2xl) */}
        <div className="mx-auto h-80 max-w-2xl rounded-lg bg-white/[0.02] ring-1 ring-white/[0.04]" />
      </div>
    </section>
  );
}
