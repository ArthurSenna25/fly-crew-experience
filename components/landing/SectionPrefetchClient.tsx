'use client';

import SectionPrefetch from '@/components/SectionPrefetch';

/**
 * SectionPrefetchClient — thin Client Component wrapper que monta
 * `<SectionPrefetch />` a partir de `app/page.tsx` (Server Component).
 *
 * POR QUE ESTE WRAPPER EXISTE (causa raiz de duplicação de chunk):
 * Antes, `<SectionPrefetch />` era montado por `ClientWidgets` no
 * `app/layout.tsx` (root layout, compartilhado por TODAS as rotas).
 * Os 9 `import('@/components/landing/<Section>')` dentro do prefetch
 * viviam, assim, no chunk-group do root layout. Cada wrapper
 * `*SectionClient.tsx` faz o MESMO `import()` dinâmico, mas no
 * chunk-group da rota `/` (via `app/page.tsx`). Dois chunk-groups
 * distintos referenciando o mesmo módulo dinâmico → o webpack/turbopack
 * emitia DUAS cópias de cada chunk de seção (uma por contexto de rota).
 * Isso duplicava o código de 8 das 9 seções (Workshops, por ser o mais
 * pesado, cruzava o threshold de splitChunks e deduplicava sozinho).
 *
 * A correção: alinhar o prefetch ao mesmo chunk-group da rota `/`.
 * Montar `<SectionPrefetch />` a partir de `app/page.tsx` coloca seus
 * 9 `import()` dinâmicos no mesmo chunk-group dos wrappers
 * `*SectionClient.tsx` → webpack agora deduplica por path de módulo
 * resolvido entre o prefetch e os wrappers, emitindo UM chunk por seção.
 *
 * Wrapper client é necessário porque `app/page.tsx` é Server Component
 * e não pode montar um componente que usa `useEffect` (SectionPrefetch
 * depende de hook de ciclo de vida client). Mesmo padrão dos 9 wrappers
 * `*SectionClient.tsx` que já existem para `dynamic(ssr:false)`.
 *
 * Não recebe props (SectionPrefetch não tem props). `<SectionPrefetch/>`
 * em app/page.tsx não passa nada.
 */
export default function SectionPrefetchClient() {
  return <SectionPrefetch />;
}
