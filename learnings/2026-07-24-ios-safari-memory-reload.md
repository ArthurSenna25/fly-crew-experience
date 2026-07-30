# iOS Safari — reload de página por pressão de memória (não bug de React)

**Data:** 2026-07-24

## Problema (uma linha)
Safari no iPhone descarta e recarrega a página inteira da landing sob pressão
de memória (~4 reloads em ~100s de teste, cada um com `requestId` novo e cache
MISS) — suspeita histórica do projeto: decode de imagem grande demais.

## Abordagem de diagnóstico (passos simples)
1. **Confirmar a correlação first:** casar timestamps de `GET /` reais com os
   ciclos de remount (requestId novo + cache MISS a cada reload). Isso é
   reload de documento, não remount de componente.
2. **Excluir causas React antes de culpar imagem:** `key` instável, `return null`
   condicional, providers client-only, `Suspense` boundary remontando — todos
   descartados por inspeção.
3. **Reconhecer o padrão iOS:** tab-process discard por pressão de memória →
   reload ao reinteragir. Esse é o diagnóstico, não um defeito do app.
4. **Auditoria somente-leitura de imagem/memória** sobre os 8 componentes que
   renderizam imagem (Hero, Gallery, Founders, Workshops, Testimonials, Nav,
   FinalCTA, Manifesto/ParallaxImage): contagem de `<Image>`/`<img>`,
   atributos (sizes/quality/fill/priority/loading/unoptimized), DOM do
   carrossel, re-decode por frame no Parallax, `<video>`/poster/background-image,
   `next.config.formats`.
5. **Localizar os culpados concretos do buffer:**
   - `logo.png` **2000×2000** com `priority` → ~**16 MB** de decode para servir
     48px (prioridade máx no boot).
   - Carrossel **Gallery** = `<img>` cru sem `srcset`/`sizes`/`quality`/optimizer,
     com **todos os slides montados** (Embla não unmounta) → **N** decodificações
     full-res coexistes (= nº de galerias no DB, dinâmico).
   - **FinalCTA** full-screen PNG decodificado a `opacity 0.07` (~4 MB por quase
     nada visual).
   - **Hero** 1024×1024 priority (~4 MB): surpreendentemente o *menor* dos
     culpados — não o centro do problema.

## Decisões de julgamento (o que foi deliberadamente NÃO feito)
- **Não tratar como bug de React.** Reload com `requestId` novo + cache MISS é
  descarte do processo da aba; caçar `key`/provider/Suspense como causador
  desperdiça a sessão. Confirmou-se React íntegro.
- **Não generalizar "toda imagem grande é a causa".** Hero 1024² ~4 MB é
  aceitável como LCP; o sintoma é *buffer coexistente*, não uma única imagem.
  Ação correta é reduzir o que coexiste no boot e nos carrosséis, não trocar
  o Hero cegamente.
- **Não culpar o `priority` por princípio.** Founders idx0 `priority` é LCP
  secundário abaixo da dobra — intencional e razoável. Quem é desperdício puro:
  o logo 2000² (16 MB p/ 48px) e o `<img>` cru do Gallery (sem optimizer).
- **Não culpar o ParallaxImage.** É `transform`-only (compositor) → decode
   único, zero re-decode por frame. Re-leitura confirmou os bugs antigos
   (`speed` undefined, `group` class faltando) já corrigidos.
- **Não relançar /graphify nesta etapa.** O graph já está mapeado
  (`graphify-out/graph.json`, ~2966 nós) e a sessão deve priorizar limite de
  rate NVIDIA NIM; re-indexar por 1 arquivo pequeno pode esperar uma sessão
  futura. (A skill `extract-approach` recomenda re-rodar `/graphify` — deixe
  isso como follow-up explícito, não automático aqui.)

## Regra reusável (uma linha)
> Quando a página recarrega sozinha no iOS com `requestId` novo e cache MISS
> (não remount de componente), trate como pressão de memória do processo da
> aba — audite o **buffer de imagem coexistente**: no boot (`priority`/eager) e
> nos carrosséis (slides montados vs. `<img>` cru sem optimizer `srcset`) —
> não o código de React.
