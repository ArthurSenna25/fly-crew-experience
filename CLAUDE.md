# CLAUDE.md — Fly Crew Experience

## Contexto do Projeto
Site institucional premium para empresa brasileira de preparação profissional
para aviação civil (comissários de bordo).

**Stack:** Next.js 15.0.3 (App Router) + React 18.3.1 + TypeScript 6.0.3 +
TailwindCSS 3.4 + Shadcn/ui (Radix) + Framer Motion 11 + Drizzle ORM 0.45 +
NeonDB (PostgreSQL serverless) + Better Auth 1.6.11 + Zod 3.23 + React Hook
Form 7.53 + Recharts 2.13 + SWR 2.4.

**Ambiente:** Claude Code via free-claude-code (proxy NVIDIA NIM, free tier).

**Direção de design:** Luxury Editorial Aviation — magazine-quality,
assimetria, tipografia como elemento de design, motion com propósito.
Referência validada: FoundersSection.

**Contexto de design persistente:** PRODUCT.md e DESIGN.md (gerados via
`/impeccable init`) são a fonte de verdade de marca/voz/paleta deste projeto
— Norte criativo: "The Editorial Hangar". Não inventar direção criativa nova
sem consultá-los primeiro.

---

## SKILLS INSTALADAS — usar automaticamente quando relevante

As seguintes skills estão instaladas (globalmente, em C:\dev e ~/.claude) e
devem ser consultadas **sem precisar de comando explícito do usuário**:

### emil-design-eng (emilkowalski/skill)
**Quando usar:** SEMPRE que tocar em qualquer animação, transição, hover
effect, motion ou componente visual. Antes de escrever qualquer código de
animação, responder internamente:
1. Com que frequência o usuário vai ver isso? (>10x/dia → sem animação)
2. A animação serve ao conteúdo ou é decorativa?
3. O easing está correto? (ease-out para entradas, ease-in para saídas)
4. A duração é proporcional à distância percorrida?

Princípios obrigatórios desta skill:
- Nunca animar ações iniciadas por teclado
- Preferir `transform` e `opacity` (GPU) — nunca `width`, `height`, `top`, `left`
- Hover effects: máx 200ms, ease-out
- Transições de página/modal: 300-500ms
- Ao revisar código de animação, usar tabela Before/After/Why

### taste-skill v1 e v2 / design-taste-frontend (Leonxlnx/taste-skill)
**Quando usar:** Sempre que tomar decisões visuais (escolha de cores,
espaçamento, tipografia, composição). Esta skill calibra o "bom gosto"
para o projeto — direção luxury editorial aviation, não SaaS genérico.
A v2 (`design-taste-frontend`) é a recomendada como default para novas
decisões; a v1 permanece instalada para compatibilidade.

### frontend-design (emilkowalski/skill)
**Quando usar:** Ao criar qualquer novo componente UI ou redesenhar
seções. Garante interfaces de produção com alta qualidade visual,
evitando a estética genérica de IA. Consultar antes de definir qualquer
paleta, grid ou hierarquia tipográfica.

### Impeccable (pbakaus/impeccable)
**Quando usar:** SEMPRE, em qualquer tarefa que toque arquivos de UI. O hook
de auditoria automática já roda em todo edit de arquivo de interface — não
precisa de comando explícito para a auditoria básica disparar.

Além do hook automático, invocar explicitamente os comandos certos em cada
etapa do fluxo de redesign (ver REGRA #2 atualizada):
- `/impeccable audit <secao>` na Etapa 1 (Audit)
- `/impeccable critique <secao>` para revisão de hierarquia/clareza/UX
- `/impeccable polish <secao>` antes de considerar a seção finalizada
- `/impeccable harden <secao>` ao tratar edge cases, i18n, overflow de texto

O PRODUCT.md e DESIGN.md deste projeto (gerados via `/impeccable init`) são
lidos automaticamente por todos esses comandos — não repetir contexto de
marca manualmente nos prompts.

### Playwright MCP (microsoft/playwright-mcp)
**Quando usar:** SEMPRE antes de reportar qualquer tarefa de UI/frontend
como concluída. Build limpo NÃO garante visual correto (ver Checklist).
Usar o Playwright MCP para navegar até a seção alterada e tirar um
screenshot real, confirmando visualmente o resultado antes de finalizar.

### brainstorming (leadgenjay/claude-skills)
**Quando usar:** Antes de implementar qualquer redesign de seção nova.
Explorar alternativas de layout/composição e apresentar opções para
validação ANTES de escrever código. Não implementar sem aprovação.

### superpowers (obra/superpowers)
**Quando usar:** Para tarefas de desenvolvimento complexas que envolvem
múltiplos arquivos, refatorações grandes ou decisões arquiteturais.
Garante metodologia correta de agente de código.

### Agent-Skills-for-Context-Engineering (muratcankoylan)
**Quando usar:** Para manter contexto relevante durante sessões longas e
evitar degradação do contexto (principal causa de timeouts e erros).

### huashu-design (alchaincyf/huashu-design)
**Quando usar:** Para protótipos interativos, decks de apresentação,
animações de produto ou infográficos a partir de descrição em linguagem
natural — útil em material de apoio (ex: apresentações internas, mockups
de pitch) que não faz parte do código de produção do site.

**Regra geral:** Não esperar comando do usuário para usar as skills.
Aplicá-las automaticamente conforme o tipo de tarefa.

## ARSENAL DE SKILLS — referência completa

### Plugins (automáticos, sem comando explícito)

| Plugin | Quando usar automaticamente |
|---|---|
| **Superpowers** | Tarefas complexas: múltiplos arquivos, refatorações, debugging sistemático, TDD, git worktrees |
| **frontend-design** | Qualquer componente UI novo ou redesign — evita estética genérica de IA |
| **Agent-Skills-for-Context-Engineering** | Sessões longas — mantém contexto coerente, evita timeout |
| **Taste Skill v1** | Decisões visuais gerais (cores, espaçamento, composição) |
| **Skill Creator** | Criar/testar novas skills personalizadas (sob demanda) |

### Impeccable — comandos explícitos (`/impeccable <cmd> <alvo>`)

| Comando | O que faz | Quando usar |
|---|---|---|
| `/impeccable init` | Gera PRODUCT.md + DESIGN.md | Uma vez por projeto — já feito |
| `/impeccable audit <s>` | 44 detectores anti-slop, a11y, performance | Etapa 1 de todo redesign |
| `/impeccable critique <s>` | Revisão UX: hierarquia, clareza, emoção | Junto ou após o audit |
| `/impeccable shape <s>` | Planeja UX/UI antes de código | Blueprint, antes de implementar |
| `/impeccable polish <s>` | Passe final, alinha ao design system | SEMPRE antes de reportar seção concluída |
| `/impeccable bolder <s>` | Amplifica design sem graça | Se resultado parecer fraco/genérico |
| `/impeccable quieter <s>` | Reduz excesso visual | Se resultado parecer carregado/gritante |
| `/impeccable distill <s>` | Remove complexidade, simplifica | Quando visualmente poluído |
| `/impeccable harden <s>` | Edge cases, i18n, overflow, erros | Antes de finalizar, para robustez |
| `/impeccable onboard <s>` | Empty states, primeiro acesso, ativação | Fluxos de cadastro/primeiro uso |
| `/impeccable animate <s>` | Motion com propósito | Planejar animações novas (+ emil-design-eng) |
| `/impeccable colorize <s>` | Cor estratégica | Paleta atual parecer monótona |
| `/impeccable typeset <s>` | Hierarquia tipográfica | Headlines/corpo desalinhados |
| `/impeccable layout <s>` | Espaçamento, ritmo visual | Layout desequilibrado |
| `/impeccable delight <s>` | Momentos de encantamento | Detalhes finais de polimento |
| `/impeccable overdrive <s>` | Efeitos extraordinários | Seções-vitrine (Hero, FinalCTA) |
| `/impeccable clarify <s>` | Copy de UX confusa | Textos de interface ambíguos |
| `/impeccable adapt <s>` | Adaptação multi-dispositivo | Revisão de responsividade |
| `/impeccable optimize <s>` | Performance, Core Web Vitals | Ao revisar carregamento |
| `/impeccable extract <s>` | Extrai componentes/tokens reutilizáveis | Padrões repetidos sem abstração |
| `/impeccable document` | Gera DESIGN.md a partir do código | Se o design mudar muito |
| `/impeccable live` | Iteração visual no browser | Ajustar variantes interativamente |
| `/impeccable craft` | shape + build + iteração completa | Seção nova do zero |
| `/impeccable pin <cmd>` | Cria atalho fixo | Comando muito frequente |

O hook automático do impeccable já roda em todo edit de arquivo de UI —
os comandos acima são para análise/ação intencional e mais profunda.

### Skills com invocação explícita

**Brainstorming:** pedir "use a brainstorming skill" antes de qualquer
redesign de seção nova. Explora 2-3 direções, valida uma antes de codificar.

**Taste Skill v2 (design-taste-frontend):** "aplique a taste-skill nesta
decisão". Dials: DESIGN_VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY.

**emil-design-eng:** automática em animações; invocar explicitamente com
"aplique emil-design-eng". Regras: transform/opacity apenas (GPU),
hover ≤200ms ease-out, transições 300-500ms, nunca animar teclado.

**huashu-design:** linguagem natural — "faça um protótipo clicável de X".
Para material de apoio (decks, mockups) — não vai para código de produção.

---

## REGRA #0 — BUILD ESTÁVEL É SEMPRE PRIORIDADE MÁXIMA

Nenhuma alteração visual começa enquanto o build não estiver 100% limpo.

1. `npx tsc --noEmit` → 0 erros
2. `npm run build` → compila 100%
3. Só então prosseguir

Se redesign começar sem build limpo, interromper com:
```
STOP. Fix all TypeScript errors and confirm npm run build passes
before any visual changes. Build stability is the priority.
```

---

## REGRA #1 — Framer Motion v11 + Next.js 15 + TypeScript

- `useRef` tipado: `useRef<HTMLDivElement>(null)`
- Sem `any` em props de animação — usar `Variants`, `Transition`, `MotionProps`
- Consultar **emil-design-eng skill** antes de qualquer código de animação
- `prefers-reduced-motion`: usar hook da Regra #14, reutilizar entre seções

---

## REGRA #2 — Processo de Redesign por Seção (VALIDADO ✅ + Impeccable + Playwright)

```
Brainstorming skill (2-3 direções, aprovar uma)
  → /impeccable audit + taste-skill + frontend-design
  → Strategy + Blueprint (documentos curtos, sem código)
  → Implementation (emil-design-eng em animações, /impeccable polish ao final)
  → Build: tsc + npm run build
  → /impeccable critique (revisão final de UX/qualidade)
```

**Para o Admin especificamente:**
```
/impeccable shape <componente>  (uma vez antes de começar a lista)
  → Para cada componente, na ordem do plano-redesign-admin.md:
    /impeccable audit <componente>
    Implementation (tokens do DESIGN-ADMIN.md, não decisões novas)
    /impeccable polish <componente>
```

Ordem: **Brainstorming skill** → Audit (impeccable) → Strategy → Blueprint
→ Implementation → Build + Revisão Visual (Playwright MCP)

### Etapa 0 — Brainstorming
Antes do audit, usar a brainstorming skill para explorar direções visuais
alternativas e apresentar opções ao usuário. Não começar implementação
sem aprovação de uma direção.

### Etapa 1 — Audit
Auditoria concisa: layout, tipografia, hierarquia visual, motion, spacing,
qualidade editorial, mobile, acessibilidade. Comparar com FoundersSection.
Salvar em `<secao>-audit.md`. Usar **taste-skill**, **frontend-design** e
`/impeccable audit <secao>` para calibrar o que precisa melhorar — o
impeccable roda os 44 detectores determinísticos contra anti-padrões
visuais (AI slop) além da análise qualitativa das outras skills.

### Etapa 2 — Strategy
Estratégia baseada no audit. Salvar em `<secao>-redesign-strategy.md`.

### Etapa 3 — Blueprint (ENXUTO)
Blueprint curto e prático. Não gerar código ainda. Não pedir blueprint
exaustivo (causa timeout — ver Regra #4).

### Etapa 4 — Implementation
```
Implementation approved.
Execute the redesign of <SectionName> exactly as specified.
Apply emil-design-eng skill to all animations.
Apply frontend-design skill to all visual decisions.
Apply /impeccable polish to the final result before reporting completion.

Rules:
- Preserve all content, SEO, accessibility, TypeScript strict mode
- Preserve Next.js 15 compatibility and build success
- Do not modify unrelated files
- If response would become very long, stop and ask to continue

After implementation:
1. Run npx tsc --noEmit (0 errors)
2. Run npm run build (must pass)
3. Use Playwright MCP to screenshot the section and confirm it visually
   matches the approved blueprint
4. Report every modified file and every visual change
```

### Etapa 5 — Validação
- Build limpo NÃO garante visual correto — confirmar com **Playwright MCP**
  (screenshot real da seção), não apenas descrição textual
- `/clear` antes de iniciar a próxima seção

---

## REGRA #3 — Nunca pedir "redesenhe o site inteiro"

Landing: Hero → Founders ✅ → Transformation → Workshops ✅ →
Gallery → Testimonials → Community → Footer.

Admin (ordem do plano): StatusBadge ✅ → StatCard ✅ → EnhancedStatCard ✅
→ AnalyticsCharts → FilterBar → AdvancedFilters → TagSelector →
TagManager → ImageUpload → GalleryManager → WorkshopManager →
TestimonialManager → DetailModal.

---

## REGRA #4 — Evitar respostas gigantes (causa de timeouts)

- Dividir pedidos grandes em partes menores
- Sempre incluir nos prompts: *"If response would become very long,
  stop and ask to continue"*
- `/clear` entre seções grandes
- Se `/compact` falhar → usar `/clear` e recomeçar
- Considerar o rate limit real do provedor (ver Regra #5) ao planejar quantas
  chamadas em sequência uma tarefa vai exigir — tarefas com 20+ chamadas
  esperadas devem ser quebradas em sub-tarefas menores antes de começar

---

## REGRA #5 — Modelo e Rate Limits (NVIDIA NIM)

Modelo único em uso neste projeto: **nvidia_nim/nvidia/nemotron-3-super-120b-a12b**,
via NVIDIA NIM API (cloud, free tier). Não há modelos alternativos configurados
atualmente (DeepSeek, Qwen, Llama não estão em uso neste projeto).

O free tier real da NVIDIA NIM tem limite de até 40 requisições/minuto. A
configuração abaixo mantém margem de segurança para não bater 429 durante
tarefas agentic (que fazem várias chamadas em sequência: ler → editar →
rodar comando → verificar resultado):

```env
MODEL="nvidia_nim/nvidia/nemotron-3-super-120b-a12b"
HTTP_READ_TIMEOUT=600
HTTP_WRITE_TIMEOUT=300
HTTP_CONNECT_TIMEOUT=60
PROVIDER_RATE_LIMIT=30
PROVIDER_RATE_WINDOW=60
PROVIDER_MAX_CONCURRENCY=3
```

Se uma tarefa específica exigir mais throughput pontualmente, preferir
quebrar a tarefa em etapas menores (ver Regra #4) em vez de aumentar o rate
limit acima de 35/60s — valores mais agressivos arriscam 429 em picos de uso
real da sessão.

---

## REGRA #6 — Permissões de sessão

- **"Yes, allow all edits"** → padrão para trabalho normal
- **"Yes, allow Claude to edit its own settings"** → evitar, só se necessário
- **Skills com prompt "Use skill X? ... Do you want to proceed?"** → responder
  "Yes, and don't ask again for [skill] in [diretório]" na primeira vez que
  cada skill disparar nesta máquina, para não repetir a confirmação em toda
  sessão futura

---

## REGRA #7 — Segurança (CRÍTICO — resolver antes de features novas)

- P1: `/api/setup-admin` e `/api/delete-admin` são públicos → proteger
- P2: `.env` versionado com secrets → `.gitignore` + remover do histórico
- P3: `CORS_ORIGINS=*` → restringir em produção
- P4: sem rate limiting em `/api/contact`, `/api/newsletter`,
  `/api/workshops/book` → implementar (tabela `login_attempts` já existe)

---

## REGRA #8 — Padrões de código

- Auth admin: sempre `requireAdmin()` de `lib/session.ts`
- Sem `console.log` de debug no código final
- Sem `any` sem justificativa
- Schemas Zod: consolidar create/update com `.partial()`
- `next-intl`: instalado mas não usado — remover ou migrar

---

## REGRA #9 — Performance / Escala

- `/api/admin/*`: `LIMIT 1000` + filtro client-side não escala →
  paginação server-side ao tocar nesses endpoints
- Dashboard admin monolítico (~1000 linhas) → extrair hooks ao tocar nele

---

## REGRA #10 — Anti-padrões visuais (luxury editorial aviation)

**Evitar** (verificar com taste-skill, frontend-design e `/impeccable audit`):
- Glassmorphism, cards genéricos com drop shadow
- Layouts centralizados e simétricos previsíveis
- Animações simultâneas sem propósito narrativo
- Padrões "startup SaaS" (badges, gradientes neon)
- Painéis vazios decorativos (ver Regra #12)
- Durations de animação acima de 500ms em elementos repetitivos
- Fontes superusadas (Arial, Inter, system defaults) — ver detectores do
  impeccable
- Texto cinza sobre fundo colorido; preto/cinza puro sem tint

**Buscar:**
- Assimetria editorial, hierarquia visual clara
- Cinzel para headlines grandes, Montserrat para corpo
- Motion com propósito narrativo (não decorativo)
- Espaçamento editorial variável
- Numerais decorativos em baixa opacidade (validado: FoundersSection)
- `prefers-reduced-motion` sempre respeitado
- Elevação tonal/refinada (cores e transparência) em vez de sombras pesadas
  — consistente com o Norte criativo "The Editorial Hangar" do DESIGN.md

**Admin - seguir DESIGN-ADMIN.md:**

- Inter para toda tipografia (não Cinzel)
- Executive Black (#111111) como base
- Gold Prestige apenas para ações críticas (não decorativo)
- Status colors: #10B981 / #F87171 / #FBBF24 / #60A5FA
- Borders: #1B1B1B, hover: #AEB7C1/40

---

## REGRA #11 — "Evoluir, não recriar" quando há versão funcional

Pedir melhorias incrementais com:
- Lista explícita do que NÃO pode mudar
- Melhorias específicas e limitadas (não "refazer tudo")
- Descrição do plano ANTES do código

---

## REGRA #12 — Bugs de imagem e painéis vazios

Build limpo NÃO detecta esses problemas.

- **Aspect-ratio inconsistente** → usar ratio único por família de imagem
- **`object-cover` sem posição** → `object-top` para fotos retrato
- **Painéis vazios** → bug de `useInView`/`whileInView` com `opacity: 0`
  travado → usar `whileInView` no card inteiro com `amount: 0.25`

---

## REGRA #13 — SWR Cache e Image Cache

- Ghost cards: adicionar `revalidateOnMount: true` ao `useSWR`
- Imagem não atualiza: cache-busting `${imageUrl}?v=${updatedAt}`

---

## REGRA #14 — useReducedMotion: implementação obrigatória

**NUNCA** (causa "Too many re-renders"):
```tsx
// ❌ setState fora de useEffect = loop infinito
if (typeof window !== 'undefined') {
  setV(window.matchMedia(...).matches);
}
```

**SEMPRE:**
```tsx
function useReducedMotion() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setV(mq.matches);
    const h = (e: MediaQueryListEvent) => setV(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return v;
}
```

Todo acesso a `window`/`document` DEVE estar dentro de `useEffect`.

---

## REGRA #15 — Diretrizes de animação (emil-design-eng skill)

Aplicar automaticamente em TODO código de animação:

| Contexto | Duration | Easing |
|---|---|---|
| Hover micro-interactions | 150-200ms | ease-out |
| Entrada de elementos | 300-500ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Modais / overlays | 300ms | ease-out (in), ease-in (out) |
| Carrossel / slide | 350-450ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Auto-advance carrossel | 3000ms intervalo | — |

Propriedades permitidas (GPU): `transform`, `opacity`
Propriedades proibidas: `width`, `height`, `top`, `left`, `margin`

---

## REGRA #16 — Escopo de skills e contexto de design

- Skills (impeccable, huashu-design, taste-skill v2/design-taste-frontend)
  são instaladas **globalmente** em C:\dev, não dentro do repositório deste
  projeto. Não versionar `.claude/skills` no Git deste repo.
- O **contexto** de design (`PRODUCT.md`, `DESIGN.md`, `.impeccable/`) É
  específico deste projeto e deve viver dentro da pasta do repositório
  (`fly-crew-site/`), versionado junto com o código (exceto `.impeccable/`,
  que é cache local e fica no `.gitignore`).
- Se este projeto for clonado em outra máquina, as skills precisam ser
  reinstaladas globalmente naquele ambiente antes de comandos como
  `/impeccable` funcionarem — eles não vêm junto com o `git clone`.

---

## REGRA #17 — Playwright MCP: uso correto (sem loop de debug)

O Playwright MCP deve ser usado APENAS para tirar screenshots de validação.
Nunca usar para debugar erros de código — isso causa loop infinito de
requisições que esgota o rate limit.

Uso correto:


Navegar até a URL
Tirar screenshot
Reportar o que está visível
PARAR — não tentar "corrigir" o que o Playwright mostrar via mais calls


Se o Playwright encontrar erro (página não carrega, componente quebrado):
STOP imediatamente. Reportar o erro textualmente ao usuário.
NÃO tentar debugar via Playwright. NÃO fazer mais calls ao MCP.
Aguardar instrução do usuário.

Limite de calls Playwright por tarefa: máximo 3 screenshots por validação.
Após 3 screenshots, parar e reportar mesmo que nem tudo tenha sido validado.

Nunca usar Playwright para:


Debugar erros de TypeScript ou build
Testar interações (cliques, formulários)
Iterar sobre correções visuais em loop
Verificar se animações funcionam

---

## Checklist antes de finalizar QUALQUER tarefa

- [ ] `npx tsc --noEmit` → 0 erros
- [ ] `npm run build` → passa 100%
- [ ] Revisão visual com **Playwright MCP** (screenshot real — build ≠ visual correto)
- [ ] `/impeccable polish` rodado na seção antes de reportar como concluída
- [ ] `/impeccable critique` para revisão final de UX
- [ ] Aspect-ratio consistente entre variações de layout
- [ ] `object-position` testado para fotos retrato
- [ ] Nenhuma área vazia sem explicação (suspeitar de bug de `inView`)
- [ ] `console.log` de debug removidos
- [ ] Sem `any` novo sem justificativa
- [ ] Conteúdo, SEO, acessibilidade preservados
- [ ] `prefers-reduced-motion` respeitado (Regra #14)
- [ ] `prefers-reduced-motion: initial={reducedMotion ? false : {...}}`
- [ ] Animações seguem Regra #15
- [ ] SWR: `revalidateOnMount: true` se dados mudam frequentemente
- [ ] Cache-busting em imagens atualizáveis (`?v=${timestamp}`)
- [ ] Resposta dividida em partes se ficaria muito longa

## Design Context

- **PRODUCT.md** — marca, usuários, personalidade, anti-referências
- **DESIGN.md** — sistema visual da landing (cores, tipografia, elevação)
- **DESIGN-ADMIN.md** — sistema visual do admin (paleta híbrida, Inter, status colors)
- **plano-redesign-admin.md** — ordem e lógica do redesign do admin
- **.impeccable/design.json** — sidecar para live panel (extensões only)
/
