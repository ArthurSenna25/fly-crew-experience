'use client';

import dynamic from 'next/dynamic';

// Estes componentes só podem usar { ssr: false } aqui dentro, porque este
// arquivo é um Client Component ('use client' acima). O app/layout.tsx é um
// Server Component e não pode chamar dynamic(..., { ssr: false }) diretamente.

// ⚠️ TESTE DE BISSEÇÃO (temporário) — Toaster e CookieConsent desativados
// para isolar possível causa do congelamento de 8-13s medido pelo heartbeat.
// Restaurar após o teste. Componentes já eliminados: SectionPrefetch, FLIP da
// Navigation, complexidade extra do Diagnostics. Restam estes dois.
// const CookieConsent = dynamic(() => import('@/components/CookieConsent'), {
//   ssr: false,
// });

const Diagnostics = dynamic(() => import('@/components/Diagnostics'), {
  ssr: false,
});

// const Toaster = dynamic(() => import('sonner').then((mod) => mod.Toaster), { ssr: false });

export default function ClientWidgets() {
  return (
    <>
      {/* ⚠️ TESTE DE BISSEÇÃO: Toaster + CookieConsent desativados temporariamente */}
      {/* <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0B1F33',
            color: '#F7F7F5',
            border: '1px solid rgba(212, 175, 55, 0.2)',
          },
        }}
      /> */}
      {/* <CookieConsent /> */}
      <Diagnostics />
    </>
  );
}
