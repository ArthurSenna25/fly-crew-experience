  # DESIGN-ADMIN.md

  ## Direção Visual do Admin (área administrativa)

  **Posicionamento:** Apple-inspired premium dark interface com liquid glass
  seletivo. Densidade de dados do Linear/Vercel, mas com profundidade visual
  e personalidade — não um painel genérico escuro e sem vida.

  **Princípio central:** "Surfaces that breathe" — cada elemento flutua sobre
  a superfície com profundidade sutil. Glass onde comunica hierarquia,
  escuridão onde facilita leitura de dados.

  ---

  ### Paleta de Cores

  | Uso | Cor | HEX | Observações |
  |---|---|---|---|
  | **Base (fundo)** | Deep Black | `#0A0A0A` | Mais profundo que antes — cria contraste com glass |
  | **Superfície 1** | Surface Low | `#111111` | Cards de tabela, linhas |
  | **Superfície 2** | Surface Mid | `#161616` | Cards de dados, painéis |
  | **Superfície 3** | Surface High | `#1C1C1E` | Apple-style elevated cards |
  | **Glass** | Glass White | `rgba(255,255,255,0.06)` | Background de componentes glass |
  | **Glass Border** | Glass Edge | `rgba(255,255,255,0.12)` | Borda luminosa dos glass cards |
  | **Glass Highlight** | Glass Top | `rgba(255,255,255,0.08)` | Borda superior (reflexo de luz) |
  | **Texto primário** | Cloud White | `#F7F7F5` | Títulos, valores principais |
  | **Texto secundário** | Silver Mist | `#AEB7C1` | Labels, helpers, metadata |
  | **Texto terciário** | Dim | `#6B7280` | Placeholders, desabilitados |
  | **Marca estrutural** | Midnight Premium | `#0B1F33` | Sidebar, header — não em conteúdo |
  | **Acento crítico** | Gold Prestige | `#D4AF37` | Ações destrutivas, métricas-chave |
  | **Status Sucesso** | Green | `#10B981` | |
  | **Status Erro** | Red | `#F87171` | |
  | **Status Alerta** | Yellow | `#FBBF24` | |
  | **Status Info** | Blue | `#60A5FA` | |

  ---

  ### Sistema de Elevação (o que mudou)

  Elevação é comunicada por **três camadas combinadas**:
  1. **Background tone** — superfície mais clara = mais alta
  2. **Border glow** — borda com opacidade branca = flutua
  3. **Shadow** — sombra escura sutil = separa do fundo

  | Nível | Onde usar | Background | Border | Shadow |
  |---|---|---|---|---|
  | **0 — Base** | Fundo da página | `#0A0A0A` | — | — |
  | **1 — Table** | Linhas de tabela | `#111111` | `rgba(255,255,255,0.04)` | — |
  | **2 — Card** | StatCards, painéis | `rgba(255,255,255,0.05)` + blur(12px) | `rgba(255,255,255,0.10)` | `0 4px 24px rgba(0,0,0,0.4)` |
  | **3 — Float** | Cards de destaque, KPIs | `rgba(255,255,255,0.07)` + blur(20px) | `rgba(255,255,255,0.14)` | `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset` |
  | **4 — Modal** | Modais, dropdowns | `rgba(20,20,20,0.85)` + blur(40px) | `rgba(255,255,255,0.12)` | `0 24px 64px rgba(0,0,0,0.7)` |

  **Regra do reflexo superior (Apple signature):**
  Todo card elevado tem uma borda superior mais brilhante que as outras:
  ```css
  border-top: 1px solid rgba(255,255,255,0.18);
  border-left: 1px solid rgba(255,255,255,0.08);
  border-right: 1px solid rgba(255,255,255,0.08);
  border-bottom: 1px solid rgba(255,255,255,0.04);
  ```
  Isso simula luz vindo de cima — o efeito "floating" da Apple.

  ---

  ### Tipografia

  - **Família principal:** `Inter` — para toda interface admin
  - **Escala:**
    - Corpo: `0.875rem` (14px) Regular
    - Labels: `0.75rem` (12px) Medium, uppercase, tracking 0.05em
    - Títulos de seção: `1.25rem` (20px) SemiBold
    - Títulos de card: `1.125rem` (18px) Medium
    - Métricas grandes: `1.75rem` (28px) Bold — aumentado para impacto
    - Micro labels: `0.65rem` (10.4px) Medium, uppercase

  ---

  ### Animações (novo — antes inexistente)

  Todas as animações seguem **emil-design-eng**: transform + opacity apenas.

  | Elemento | Animação | Duration | Easing |
  |---|---|---|---|
  | **Card entrance** | `y: 16 → 0, opacity: 0 → 1` | 350ms | `spring(stiffness:300, damping:30)` |
  | **Card hover** | `y: -2px, shadow increase` | 200ms | ease-out |
  | **Stat number** | `opacity: 0 → 1, scale: 0.96 → 1` | 400ms | `spring(stiffness:200, damping:25)` |
  | **Dropdown open** | `y: -6 → 0, opacity: 0 → 1, scale: 0.97 → 1` | 180ms | ease-out |
  | **Modal open** | `y: 20 → 0, opacity: 0 → 1` | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
  | **Stagger children** | cada item: delay `i * 40ms` | — | — |
  | **Page tab switch** | `x: ±12 → 0, opacity: 0 → 1` | 250ms | ease-out |
  | **Skeleton pulse** | `opacity: 0.4 ↔ 0.8` | 1200ms | ease-in-out, infinite |

  **Reduced motion:** todas as animações caem para fade simples de 100ms.

  ---

  ### Componentes — especificação visual

  #### StatCard / EnhancedStatCard (Level 3 — Float)
  ```
  background: rgba(255,255,255,0.05)
  backdrop-filter: blur(20px)
  border-top: 1px solid rgba(255,255,255,0.18)
  border-left/right: 1px solid rgba(255,255,255,0.08)
  border-bottom: 1px solid rgba(255,255,255,0.04)
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset
  border-radius: 16px
  hover: translateY(-2px), shadow aumenta para 0 12px 40px rgba(0,0,0,0.6)
  ```

  #### ChartCard / AnalyticsCharts (Level 2 — Card)
  ```
  background: rgba(255,255,255,0.04)
  backdrop-filter: blur(12px)
  border: 1px solid rgba(255,255,255,0.08)
  border-top: 1px solid rgba(255,255,255,0.12)
  box-shadow: 0 4px 24px rgba(0,0,0,0.4)
  border-radius: 16px
  ```

  #### Tabelas (Level 1 — sem glass, legibilidade prioritária)
  ```
  header: background #1A1A1A, border-bottom rgba(255,255,255,0.06)
  row: background alternado #111111 / #0F0F0F
  row hover: background #1A1A1A, transition 150ms
  border-bottom cada linha: rgba(255,255,255,0.04)
  ```

  #### Inputs e Selects
  ```
  background: rgba(255,255,255,0.04)
  border: 1px solid rgba(255,255,255,0.10)
  border-radius: 10px
  focus: border rgba(255,255,255,0.25), box-shadow 0 0 0 3px rgba(255,255,255,0.06)
  placeholder: #6B7280
  ```

  #### Botão Primário (Gold Prestige — ações críticas)
  ```
  background: #D4AF37
  color: #0A0A0A
  border-radius: 10px
  box-shadow: 0 2px 12px rgba(212,175,55,0.35)
  hover: brightness(1.1), shadow 0 4px 20px rgba(212,175,55,0.45)
  ```

  #### Botão Secundário
  ```
  background: rgba(255,255,255,0.06)
  border: 1px solid rgba(255,255,255,0.12)
  color: #AEB7C1
  border-radius: 10px
  hover: background rgba(255,255,255,0.10), color #F7F7F5
  ```

  #### Modal (Level 4)
  ```
  background: rgba(14,14,14,0.85)
  backdrop-filter: blur(40px) saturate(1.5)
  border: 1px solid rgba(255,255,255,0.12)
  border-top: 1px solid rgba(255,255,255,0.20)
  box-shadow: 0 24px 64px rgba(0,0,0,0.7)
  border-radius: 20px
  ```

  #### Sidebar
  ```
  background: rgba(11,31,51,0.85) — Midnight Premium glass
  backdrop-filter: blur(20px)
  border-right: 1px solid rgba(255,255,255,0.06)
  ```

  ---

  ### Efeitos Especiais

  #### Ambient glow nos KPI cards (opcional, seletivo)
  Apenas nos 4 KPI cards de destaque do dashboard.
  Um glow colorido sutil que corresponde à métrica:
  ```css
  /* Conversão — gold */
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08);
  /* Pendentes — warning */
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 40px rgba(251,191,36,0.06);
  ```
  Extremamente sutil — 6-8% opacidade máxima. Informa sem grita.

  #### Noise texture (Apple-style grain)
  Sobre os glass cards, um pseudo-element com noise SVG em 3% opacidade.
  Dá a textura "fosca" do glass da Apple.
  ```css
  ::before {
    content: '';
    background-image: url("data:image/svg+xml,...noise...");
    opacity: 0.03;
    border-radius: inherit;
  }
  ```

  ---

  ### O que NÃO mudar

  - Tabelas: sem glass — legibilidade de dados é prioridade absoluta
  - Inputs dentro de formulários em modais: sem glass excessivo
  - Gold Prestige: continua reservado para ações críticas
  - Inter: única fonte no admin
  - Cores de status: imutáveis (#10B981, #F87171, #FBBF24, #60A5FA)
  - Acessibilidade: contraste AA mínimo em todos os textos

  ---

  ### Resumo das mudanças vs versão anterior

  | Aspecto | Antes | Agora |
  |---|---|---|
  | Cards | `bg-[#161616] border-[#1B1B1B]` | Glass com backdrop-blur, borda luminosa |
  | Sombra | Nenhuma | `0 8px 32px rgba(0,0,0,0.5)` nos cards principais |
  | Hover | `bg-[#1A1A1A]` | `translateY(-2px)` + shadow increase |
  | Animações | Fade simples | Spring physics nos cards, stagger nos filhos |
  | Border | Uniforme em todos os lados | Reflexo superior mais brilhante |
  | Radius | `0` (sem radius) | `16px` nos cards, `10px` nos inputs |
  | Backdrop blur | Nenhum | blur(20px) nos cards float, blur(12px) nos chart cards |
