"use client";

import { useState, useEffect, useRef } from "react";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "flycrew_cookie_consent";
// Duração da transição de saída em ms — precisa bater com a classe
// `duration-*` usada no CSS abaixo, já que controlamos o unmount por
// timer (sem Framer Motion não temos onAnimationComplete/exit).
const EXIT_DURATION_MS = 300;

export default function CookieConsent() {
  // `mounted` = o banner existe no DOM. `visible` = está na posição
  // "aberta" (translate-y-0, opacity-100). Separar os dois é o que
  // permite a transição de saída em CSS puro: primeiro tiramos
  // `visible` (dispara a transição pra fora da tela), só depois
  // desmontamos de fato, quando a transição já terminou.
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const acceptAllRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // localStorage pode lançar exceção em contextos restritos (modo
    // privado antigo, políticas de MDM corporativo, storage bloqueado por
    // configuração do navegador) — sem o try/catch, isso derrubaria o
    // componente inteiro em vez de simplesmente não mostrar o banner.
    let consent: string | null = null;
    try {
      consent = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage indisponível: segue sem mostrar o banner em vez de quebrar.
      return;
    }
    if (!consent) {
      const timer = setTimeout(() => {
        setMounted(true);
        // Segundo frame: monta primeiro fora da tela (translate-y-full),
        // depois liga `visible` num próximo tick pra garantir que o
        // navegador já pintou o estado inicial antes de animar — sem
        // isso a transição CSS não dispara (não há "de → para" real).
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setVisible(true));
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Move o foco para o primeiro botão de ação quando o banner aparece —
  // sem isso, quem navega por teclado/leitor de tela não é avisado de que
  // um novo elemento interativo surgiu na tela.
  useEffect(() => {
    if (visible) {
      acceptAllRef.current?.focus();
    }
  }, [visible]);

  const accept = (level: "all" | "essential") => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ level, acceptedAt: new Date().toISOString() }),
      );
    } catch {
      // Se não for possível persistir, ainda assim fechamos o banner nesta
      // sessão — evita reexibir repetidamente por causa de um erro de
      // storage que o usuário não pode resolver.
    }
    setVisible(false);
    window.setTimeout(() => setMounted(false), EXIT_DURATION_MS);
  };

  if (!mounted) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[var(--z-modal-dialog)] p-4 transition-all duration-300 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-[200px] opacity-0"
      }`}
      data-testid="cookie-consent-banner"
      role="region"
      aria-label="Consentimento de cookies"
      aria-live="polite"
    >
      {/* backdrop-luxury (definida em globals.css) em vez de
          backdrop-blur-xl fixo: já reduz a intensidade do blur
          automaticamente em telas <768px (12px em vez de 24px),
          o que esse componente não estava aproveitando antes mesmo
          já existindo no projeto para esse exato propósito. */}
      <div className="max-w-5xl mx-auto bg-midnight-premium/95 backdrop-luxury border border-gold-prestige/30 p-6 lg:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="hidden sm:flex w-12 h-12 bg-gold-prestige/10 items-center justify-center rounded shrink-0"
          >
            <Cookie className="w-6 h-6 text-gold-prestige" />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-cinzel font-light text-white">
              Sua privacidade é importante
            </h3>
            <p className="text-sm text-silver-mist leading-relaxed font-montserrat">
              Utilizamos cookies essenciais para o funcionamento do site, em conformidade com a{" "}
              <strong className="text-white">LGPD</strong>. Você pode aceitar todos ou apenas os
              essenciais. Saiba mais em nossa{" "}
              <Link href="/privacy" className="text-gold-prestige underline">
                Política de Privacidade
              </Link>
              .
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                ref={acceptAllRef}
                onClick={() => accept("all")}
                className="bg-gold-prestige text-executive-black hover:bg-gold-prestige/90 transition-all duration-300 px-6 py-2.5 text-xs tracking-wider uppercase font-semibold"
                data-testid="accept-all-cookies"
              >
                Aceitar Todos
              </button>
              <button
                onClick={() => accept("essential")}
                className="bg-transparent border border-white/20 text-silver-mist hover:text-white hover:border-white/40 transition-all duration-300 px-6 py-2.5 text-xs tracking-wider uppercase font-semibold"
                data-testid="accept-essential-cookies"
              >
                Apenas Essenciais
              </button>
            </div>
          </div>
          <button
            onClick={() => accept("essential")}
            className="text-silver-mist/50 hover:text-white"
            aria-label="Fechar aviso de cookies e aceitar apenas os essenciais"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
