'use client';

import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ParallaxImage } from '@/components/ui/ParallaxImage';

export default function ManifestoSection() {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Nome 'manifesto-render-start' (único — não
  // reutiliza 'hero-', 'nav-', 'testimonials-', 'founders-', 'workshops-',
  // 'newsletter-form-' nem 'transformation-render-start', que já existem
  // na mesma página /; cada componente precisa de nome único na timeline
  // do performance para o getEntriesByName não-ambíguo).
  const manifestoRenderMarkedRef = useRef(false);
  if (!manifestoRenderMarkedRef.current) {
    manifestoRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('manifesto-render-start');
    }
  }

  const { ref } = useScrollReveal();

  // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
  // terminou (passive effects rodaram). O delta real (mark → mount effects)
  // é calculado AQUI no cliente usando a mark 'manifesto-render-start' criada
  // no topo do componente, e enviado como msSinceMark — o servidor só o exibe.
  // (performance.now() é relativo à navegação da página; subtrair de Date.now()
  // epoch não representaria tempo real nenhum.) ManifestoSection não tinha
  // useEffect de mount pré-existente, então este foi criado novo.
  useEffect(() => {
    const markName = 'manifesto-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/debug-log',
        JSON.stringify({
          tag: 'ManifestoSection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
      );
    } else {
      fetch('/api/debug-log', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'ManifestoSection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
        keepalive: true,
      });
    }
  }, []);

  return (
    <Section ref={ref} sectionId="manifesto" bg="black" data-testid="manifesto-section">
      {/* Ambient glow — duplo e assimétrico, pra dar profundidade tonal sem
          recair no glow único centralizado (Regra #10: elevação, não sombra) */}
      <div className="pointer-events-none absolute top-1/3 right-0 h-96 w-96 rounded-full bg-gold-prestige/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-gold-prestige/[0.03] blur-3xl" />

      <Container className="relative z-10">
        {/* Gutter editorial — linha vertical discreta entre as colunas,
            só em telas grandes, como uma dobra de revista */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block"
        />

        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 xl:gap-24">
          <ScrollReveal direction="left" className="order-2 space-y-8 lg:order-1">
            <div>
              {/* Eyebrow com numeral editorial — ecoa a numeração da
                  navegação (01, 02...), reforça o sistema de marca */}
              <div className="mb-6 flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="font-cinzel text-3xl leading-none text-gold-prestige/20 sm:text-4xl"
                >
                  01
                </span>
                <span
                  aria-hidden="true"
                  className="h-px w-10 bg-gradient-to-r from-gold-prestige to-transparent"
                />
                <p className="font-inter text-xs font-semibold uppercase tracking-[0.25em] text-gold-prestige sm:text-sm">
                  UMA NOVA EXPERIÊNCIA EM AVIAÇÃO
                </p>
              </div>

              <h2 className="font-cinzel text-[clamp(1.9rem,4.5vw,3.5rem)] font-light leading-[1.15] tracking-tight text-white">
                Nós Não Formamos
                <br />
                Apenas Currículos...
                <br />
                <span className="text-gold-prestige">Formamos Presença.</span>
              </h2>

              <span
                aria-hidden="true"
                className="mt-6 block h-px w-16 bg-gradient-to-r from-gold-prestige to-transparent"
              />
            </div>

            <div className="max-w-xl space-y-6">
              {/* Parágrafo de abertura em destaque — lead editorial, mesmo
                  texto, apenas com mais peso visual */}
              <p className="font-montserrat text-lg font-light leading-relaxed text-white/90">
                A Fly Crew nasceu para transformar pessoas comuns em profissionais preparados para
                viver a aviação com elegância, confiança e excelência.
              </p>
              <p className="font-montserrat text-base leading-relaxed text-silver-mist">
                Aqui, você não aprende apenas como passar em entrevistas. Você desenvolve postura,
                comunicação, presença e comportamento profissional alinhados ao padrão da aviação
                executiva.
              </p>
              <p className="font-montserrat text-base leading-relaxed text-silver-mist">
                Mais do que um curso, a Fly Crew é uma experiência de transformação pessoal e
                profissional.
              </p>
            </div>

            {/* Micro-CTA — dá continuidade narrativa até a seção de
                Experiência, mesmo padrão de sublinhado (scale-x, GPU-only)
                usado na navegação */}
            <a
              href="#experience"
              className="group relative inline-flex w-fit items-center gap-2 pb-1 font-inter text-sm font-semibold uppercase tracking-wider text-gold-prestige transition-colors duration-200 hover:text-white"
            >
              Descubra a Experiência
              <ArrowUpRight
                size={16}
                className="shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 ease-out group-hover:scale-x-100"
              />
            </a>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.2} className="group relative order-1 lg:order-2">
            {/* Selo flutuante — reforça a marca sobre a imagem sem
                depender de texto sobreposto direto na foto */}
            <div className="absolute -top-4 left-6 z-20 flex items-center gap-2 rounded-full border border-gold-prestige/40 bg-executive-black/80 px-4 py-1.5 backdrop-blur-sm">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold-prestige" />
              <span className="font-inter text-[0.65rem] uppercase tracking-[0.2em] text-gold-prestige">
                Fly Crew Experience
              </span>
            </div>

            <div className="relative overflow-hidden rounded-2xl">
              <div className="transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                <ParallaxImage
                  src="/images/manifesto/manifesto-image.png"
                  alt="Aviation crew"
                  aspectRatio="5/6"
                  speed={150}
                />
              </div>

              {/* Cantos decorativos — motivo "janela de cabine", reforça o
                  universo de aviação sem recorrer a ícone genérico */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-4 h-8 w-8 border-l border-t border-gold-prestige/50"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-4 h-8 w-8 border-r border-t border-gold-prestige/50"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-4 left-4 h-8 w-8 border-b border-l border-gold-prestige/50"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 border-b border-r border-gold-prestige/50"
              />
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  );
}
