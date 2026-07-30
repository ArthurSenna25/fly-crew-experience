"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Locale = "pt" | "en";

const translations = {
  pt: {
    navigation: {
      experience: "Experiência",
      founders: "Fundadoras",
      events: "Eventos",
      gallery: "Galeria",
      contact: "Contato"
    },
    hero: {
      headline: "Prepare-se Para Verdadeiramente",
      headlineHighlight: "Viver a Aviação.",
      description: "Mais que preparação. Uma experiência de transformação profissional desenhada para quem aspira conquistar os céus com elegância, confiança e presença.",
      ctaPrimary: "Descubra Fly Crew",
      ctaSecondary: "Quero Fazer Parte",
      scroll: "Rolar"
    },
    manifesto: {
      label: "ISTO NÃO É UMA ESCOLA DE AVIAÇÃO TRADICIONAL",
      title: "Nós Transformamos Identidades.",
      titleLine2: "Não Apenas Currículos.",
      paragraph1: "Fly Crew Experience é onde pessoas comuns se transformam em profissionais da aviação preparados para viver os céus com elegância, confiança e presença inegável.",
      paragraph2: "Não preparamos você apenas para entrevistas. Preparamos você para o lifestyle, a mentalidade e o profissionalismo sofisticado que define a elite da aviação.",
      paragraph3: "Você não está entrando em um curso. Você está entrando em uma nova identidade."
    },
    experience: {
      label: "A EXPERIÊNCIA FLY CREW",
      title: "Pilares da Transformação Premium",
      pillars: [
        {
          title: "Presença Profissional",
          description: "Domine a arte de comandar um ambiente com elegância, postura e sofisticação."
        },
        {
          title: "Excelência em Entrevistas",
          description: "Transforme ansiedade de entrevista em comunicação confiante e autêntica que cativa recrutadores."
        },
        {
          title: "Comportamento Aeronáutico",
          description: "Aprenda os códigos de conduta não ditos que definem profissionais da indústria da aviação."
        },
        {
          title: "Inteligência Emocional",
          description: "Desenvolva a preparação emocional para lidar com pressão, incerteza e sucesso com graça."
        },
        {
          title: "Postura & Elegância",
          description: "Incorpore a graça física e movimentos refinados esperados da elite da aviação."
        },
        {
          title: "Mentoria da Indústria",
          description: "Acesse profissionais reais da aviação que guiam sua jornada de transformação pessoalmente."
        }
      ]
    },
    founders: {
      label: "CONHEÇA AS VISIONÁRIAS",
      title: "Lideradas Por Experts",
      titleHighlight: "Em Aviação",
      thais: {
        name: "Thaís",
        role: "Co-Fundadora & Mentora Principal",
        bio: "Com mais de 10 anos em aviação premium, Thaís transformou centenas de aspirantes em profissionais confiantes da elite aérea. Sua expertise em psicologia de entrevistas e presença profissional se tornou o padrão ouro no Brasil."
      },
      nathali: {
        name: "Nathali",
        role: "Co-Fundadora & Diretora de Experiência",
        bio: "Nathali traz experiência internacional em aviação e paixão por criar experiências educacionais transformadoras. Sua abordagem combina inteligência emocional com excelência prática, criando impacto profissional duradouro."
      }
    },
    events: {
      label: "EXPERIÊNCIAS EXCLUSIVAS",
      title: "Fly Crew",
      titleHighlight: "Events",
      subtitle: "Experiências Transformadoras Imersivas",
      bookingTitle: "Reserve Sua Experiência",
      bookingSubtitle: "Entre em contato e transforme sua jornada profissional",
      duration: "Duração",
      capacity: "Capacidade",
      form: {
        name: "Seu Nome",
        email: "Seu Email",
        phone: "Telefone",
        event: "Selecione a Experiência",
        date: "Data Preferida (Opcional)",
        message: "Mensagem Adicional (Opcional)",
        consent: "Concordo com o processamento dos meus dados pessoais de acordo com a Política de Privacidade (LGPD).",
        submit: "Reservar Meu Lugar",
        submitting: "Enviando...",
        success: "Reserva recebida! Entraremos em contato em breve.",
        error: "Erro ao enviar reserva. Tente novamente.",
        consentError: "Você precisa concordar com nossa política de privacidade."
      }
    },
    gallery: {
      label: "NOSSA COMUNIDADE",
      title: "Momentos de",
      titleHighlight: "Transformação",
      subtitle: "Acompanhe nossa jornada através de experiências reais e histórias de sucesso"
    },
    testimonials: {
      label: "HISTÓRIAS DE SUCESSO",
      title: "O Que Dizem Nossas",
      titleHighlight: "Alunas",
      subtitle: "Depoimentos reais de profissionais transformadas"
    },
    contact: {
      label: "VAMOS CONVERSAR",
      title: "Pronta Para Sua",
      titleHighlight: "Transformação?",
      subtitle: "Entre em contato conosco e dê o primeiro passo rumo à sua nova identidade profissional",
      form: {
        name: "Seu Nome",
        email: "Seu Email",
        message: "Sua Mensagem",
        consent: "Concordo com a Política de Privacidade (LGPD)",
        submit: "Enviar Mensagem",
        submitting: "Enviando...",
        success: "Mensagem enviada com sucesso!",
        error: "Erro ao enviar mensagem."
      }
    },
    newsletter: {
      title: "Fique Por Dentro",
      subtitle: "Receba conteúdos exclusivos, dicas e novidades sobre aviação diretamente no seu email",
      placeholder: "Seu melhor email",
      button: "Inscrever-se",
      submitting: "Inscrevendo...",
      success: "Inscrição realizada com sucesso!",
      error: "Erro ao realizar inscrição.",
      consent: "Ao se inscrever, você concorda com nossa Política de Privacidade"
    },
    footer: {
      tagline: "Transformação Premium em Aviação",
      rights: "Todos os direitos reservados.",
      privacy: "Política de Privacidade",
      terms: "Termos de Serviço",
      about: "Sobre",
      aboutText: "Fly Crew Experience é a principal plataforma de transformação profissional para aviação no Brasil.",
      social: "Redes Sociais",
      newsletter: "Newsletter"
    }
  },
  en: {
    navigation: {
      experience: "Experience",
      founders: "Founders",
      events: "Events",
      gallery: "Gallery",
      contact: "Contact"
    },
    hero: {
      headline: "Prepare Yourself To Truly",
      headlineHighlight: "Live Aviation.",
      description: "More than preparation. A professional transformation experience designed for those who aspire to conquer the skies with elegance, confidence, and presence.",
      ctaPrimary: "Discover Fly Crew",
      ctaSecondary: "I Want To Be Part Of This",
      scroll: "Scroll"
    },
    manifesto: {
      label: "THIS IS NOT A TRADITIONAL AVIATION SCHOOL",
      title: "We Transform Identities.",
      titleLine2: "Not Just Resumes.",
      paragraph1: "Fly Crew Experience is where ordinary individuals transform into aviation professionals prepared to live the skies with elegance, confidence, and undeniable presence.",
      paragraph2: "We don't just prepare you for interviews. We prepare you for the lifestyle, the mindset, and the sophisticated professionalism that defines the aviation elite.",
      paragraph3: "You're not joining a course. You're entering a new identity."
    },
    experience: {
      label: "THE FLY CREW EXPERIENCE",
      title: "Premium Transformation Pillars",
      pillars: [
        {
          title: "Professional Presence",
          description: "Master the art of commanding a room with elegance, poise, and sophistication."
        },
        {
          title: "Interview Excellence",
          description: "Transform interview anxiety into confident, authentic communication that captivates recruiters."
        },
        {
          title: "Aviation Behavior",
          description: "Learn the unspoken codes of conduct that define aviation industry professionals."
        },
        {
          title: "Emotional Intelligence",
          description: "Develop the emotional preparation to handle pressure, uncertainty, and success with grace."
        },
        {
          title: "Posture & Elegance",
          description: "Embody the physical grace and refined movements expected of aviation elite."
        },
        {
          title: "Industry Mentorship",
          description: "Access real aviation professionals who guide your transformation journey personally."
        }
      ]
    },
    founders: {
      label: "MEET THE VISIONARIES",
      title: "Led By Aviation",
      titleHighlight: "Experts",
      thais: {
        name: "Thaís",
        role: "Co-Founder & Lead Mentor",
        bio: "With over 10 years in premium aviation, Thaís has transformed hundreds of aspiring professionals into confident aviation elite. Her expertise in interview psychology and professional presence has become the gold standard in Brazil."
      },
      nathali: {
        name: "Nathali",
        role: "Co-Founder & Experience Director",
        bio: "Nathali brings international aviation experience and a passion for creating transformational educational experiences. Her approach combines emotional intelligence with practical excellence, creating lasting professional impact."
      }
    },
    events: {
      label: "EXCLUSIVE EXPERIENCES",
      title: "Fly Crew",
      titleHighlight: "Events",
      subtitle: "Immersive Transformation Experiences",
      bookingTitle: "Reserve Your Experience",
      bookingSubtitle: "Get in touch and transform your professional journey",
      duration: "Duration",
      capacity: "Capacity",
      form: {
        name: "Your Name",
        email: "Your Email",
        phone: "Phone Number",
        event: "Select Experience",
        date: "Preferred Date (Optional)",
        message: "Additional Message (Optional)",
        consent: "I agree to the processing of my personal data according to the Privacy Policy (LGPD).",
        submit: "Reserve My Spot",
        submitting: "Sending...",
        success: "Booking received! We'll contact you soon.",
        error: "Error sending booking. Please try again.",
        consentError: "You must agree to our privacy policy."
      }
    },
    gallery: {
      label: "OUR COMMUNITY",
      title: "Moments of",
      titleHighlight: "Transformation",
      subtitle: "Follow our journey through real experiences and success stories"
    },
    testimonials: {
      label: "SUCCESS STORIES",
      title: "What Our",
      titleHighlight: "Students Say",
      subtitle: "Real testimonials from transformed professionals"
    },
    contact: {
      label: "LET'S TALK",
      title: "Ready For Your",
      titleHighlight: "Transformation?",
      subtitle: "Get in touch with us and take the first step towards your new professional identity",
      form: {
        name: "Your Name",
        email: "Your Email",
        message: "Your Message",
        consent: "I agree to the Privacy Policy (LGPD)",
        submit: "Send Message",
        submitting: "Sending...",
        success: "Message sent successfully!",
        error: "Error sending message."
      }
    },
    newsletter: {
      title: "Stay Updated",
      subtitle: "Receive exclusive content, tips and aviation news directly in your email",
      placeholder: "Your best email",
      button: "Subscribe",
      submitting: "Subscribing...",
      success: "Successfully subscribed!",
      error: "Error subscribing.",
      consent: "By subscribing, you agree to our Privacy Policy"
    },
    footer: {
      tagline: "Premium Aviation Transformation",
      rights: "All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      about: "About",
      aboutText: "Fly Crew Experience is Brazil's leading professional transformation platform for aviation.",
      social: "Social Media",
      newsletter: "Newsletter"
    }
  }
};

type TranslationContextType = {
  locale: Locale;
  t: typeof translations.pt;
  setLocale: (locale: Locale) => void;
};

const TranslationContext = createContext<TranslationContextType>({
  locale: "pt",
  t: translations.pt,
  setLocale: () => {},
});

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");

  useEffect(() => {
    const saved = getCookie("NEXT_LOCALE");
    if (saved && (saved === "pt" || saved === "en")) {
      setLocaleState(saved as Locale);
    }
  }, []);

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const setCookie = (name: string, value: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=${value};path=/;max-age=31536000;SameSite=Lax`;
  };

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setCookie("NEXT_LOCALE", newLocale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale === "pt" ? "pt-BR" : "en";
    }
  };

  return (
    <TranslationContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
