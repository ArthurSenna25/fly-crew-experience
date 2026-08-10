import type { Metadata, Viewport } from 'next';
import { Cinzel, Montserrat, Inter } from 'next/font/google';
import ClientWidgets from '@/components/ClientWidgets';
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next";

// Cinzel não é uma fonte variável no Google Fonts — precisa listar os pesos
// estáticos usados. '300' foi adicionado porque todo uso de font-cinzel no
// código atual aplica font-light (300); sem esse peso o navegador fazia
// fallback silencioso para 400.
const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
});

// Montserrat é uma fonte variável — omitir `weight` carrega 1 arquivo
// cobrindo todo o eixo de peso, em vez de 5 arquivos estáticos separados.
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

// Inter também é variável — mesmo racional acima.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// TODO: trocar pelo domínio real de produção antes do próximo deploy.
// Sem isso, as imagens do Open Graph (openGraph.images) não resolvem
// pra URL absoluta e o card de compartilhamento pode quebrar.
const SITE_URL = 'https://fly-crew-site.vercel.app/';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // Essencial pro env(safe-area-inset-*) do globals.css funcionar em iPhones com notch/Dynamic Island
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
    { media: '(prefers-color-scheme: light)', color: '#F7F7F5' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Fly Crew Experience | Aviação de Elite',
    template: '%s | Fly Crew Experience',
  },
  description:
    'Mais que preparação. Uma experiência de transformação profissional desenhada para quem aspira conquistar os céus com elegância, confiança e presença.',
  keywords: ['aviação', 'comissária', 'comissário', 'tripulação', 'treinamento', 'transformação'],
  authors: [{ name: 'Fly Crew Experience' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Fly Crew Experience',
    description: 'Preparação premium para aviação. Identidade, confiança, elegância.',
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: 'Fly Crew Experience',
    images: [
      {
        // TODO: substituir por uma imagem real de 1200x630px em /public
        url: '/public/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Fly Crew Experience — Aviação de Elite',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fly Crew Experience',
    description: 'Preparação premium para aviação. Identidade, confiança, elegância.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Evita que o iOS transforme números (telefone, CNPJ, etc) em links azuis automáticos
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

// TODO: ajustar os campos abaixo com os dados reais (endereço, telefone,
// links de redes sociais) — isso é o que habilita rich snippets no Google.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Fly Crew Experience',
  description: 'Preparação premium para aviação. Identidade, confiança, elegância.',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [
    "https://www.instagram.com/flycrewexperience",
    // "https://www.linkedin.com/company/flycrewexperience",
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${cinzel.variable} ${montserrat.variable} ${inter.variable} cinematic-scroll`}
      suppressHydrationWarning
    >
      <head>
        {/* preconnect/dns-prefetch de res.cloudinary.com vivem em app/page.tsx
            (rota /), escopados às 3 seções que realmente usam Cloudinary
            (Gallery, Workshops, Testimonials) — evita abrir socket TLS
            especulativo em /privacy e /admin, cujos browsers nunca buscam
            res.cloudinary.com (uploads do admin vão server-side via o SDK do
            cloudinary, não pelo browser). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="antialiased">
        {children}
        <ClientWidgets />
        <SpeedInsights />
      </body>
    </html>
  );
}
