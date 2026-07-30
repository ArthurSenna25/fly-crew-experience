'use client';

import { useEffect, useRef } from 'react';
import { Instagram, Mail } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Nome 'footer-render-start' (único — não
  // reutiliza nenhuma mark já usada na página /).
  const footerRenderMarkedRef = useRef(false);
  if (!footerRenderMarkedRef.current) {
    footerRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('footer-render-start');
    }
  }

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
  // terminou (passive effects rodaram). O delta real (mark → mount effects)
  // é calculado AQUI no cliente usando a mark 'footer-render-start' criada
  // no topo do componente, e enviado como msSinceMark — o servidor só o exibe.
  // (performance.now() é relativo à navegação da página; subtrair de Date.now()
  // epoch não representaria tempo real nenhum.) Footer não tinha useEffect de
  // mount pré-existente, então este foi criado novo.
  useEffect(() => {
    const markName = 'footer-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/debug-log',
        JSON.stringify({
          tag: 'Footer',
          msg: 'mount effects complete',
          msSinceMark,
        }),
      );
    } else {
      fetch('/api/debug-log', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'Footer',
          msg: 'mount effects complete',
          msSinceMark,
        }),
        keepalive: true,
      });
    }
  }, []);

  return (
    <footer
      className="bg-executive-black py-24 sm:py-32 border-t border-white/5"
      data-testid="footer"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <h3 className="font-cinzel text-2xl font-light tracking-wider text-white mb-6">
              FLY CREW
            </h3>
            <p className="text-sm text-silver-mist leading-relaxed font-montserrat max-w-md">
              Formamos profissionais preparados para viver a aviacao com elegancia, presenca,
              confianca e excelencia.
            </p>
          </div>
          <div>
            <h4 className="text-sm uppercase tracking-[0.2em] text-white font-semibold mb-6 font-inter">
              Navegacao
            </h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollTo('experience')}
                  className="text-sm text-silver-mist hover:text-gold-prestige transition-colors font-montserrat"
                >
                  Experiencia Fly Crew
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('founders')}
                  className="text-sm text-silver-mist hover:text-gold-prestige transition-colors font-montserrat"
                >
                  Fundadoras
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('workshops')}
                  className="text-sm text-silver-mist hover:text-gold-prestige transition-colors font-montserrat"
                >
                  Eventos Fly Crew
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('gallery')}
                  className="text-sm text-silver-mist hover:text-gold-prestige transition-colors font-montserrat"
                >
                  Galeria
                </button>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  className="text-sm text-silver-mist/50 hover:text-gold-prestige transition-colors font-montserrat"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm uppercase tracking-[0.2em] text-white font-semibold mb-6 font-inter">
              Conecte-se
            </h4>
            <div className="flex items-center gap-2 mb-6 -ml-2">
              <a
                href="https://www.instagram.com/flycrewexperience"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Fly Crew Experience"
                className="p-2 text-silver-mist hover:text-gold-prestige transition-colors"
              >
                <Instagram size={20} strokeWidth={1.5} />
              </a>
              <a
                href="mailto:flycrewexperience@gmail.com"
                aria-label="Enviar email para Fly Crew Experience"
                className="p-2 text-silver-mist hover:text-gold-prestige transition-colors"
              >
                <Mail size={20} strokeWidth={1.5} />
              </a>
            </div>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-xs text-silver-mist/70 hover:text-gold-prestige font-montserrat"
                >
                  Politica de Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 text-center">
          <p className="text-sm text-silver-mist/70 font-montserrat">
            © {new Date().getFullYear()} Fly Crew Experience. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
