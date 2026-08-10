import dynamic from 'next/dynamic';
import { db } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { workshops, galleries } from '@/lib/db/schema';

import Navigation from '@/components/landing/Navigation';
import HeroSection from '@/components/landing/HeroSection';
import GallerySection from '@/components/landing/GallerySectionClient';
import TestimonialsSection from '@/components/landing/TestimonialsSectionClient';
import WorkshopsSection from '@/components/landing/WorkshopsSectionClient';
import ManifestoSection from '@/components/landing/ManifestoSectionClient';
import ExperienceSection from '@/components/landing/ExperienceSectionClient';
import FoundersSection from '@/components/landing/FoundersSectionClient';
import TransformationSection from '@/components/landing/TransformationSectionClient';
import CommunitySection from '@/components/landing/CommunitySectionClient';
import FinalCTASection from '@/components/landing/FinalCTASectionClient';
import SectionPrefetchClient from '@/components/landing/SectionPrefetchClient';

const Footer = dynamic(() => import('@/components/landing/Footer'));

export const revalidate = 300;

export default async function HomePage() {
  const t0 = Date.now();
  console.log('[perf] HomePage render start');

  const [rawWorkshops, rawGalleries] = await Promise.all([
    db
      .select()
      .from(workshops)
      .where(eq(workshops.isActive, true))
      .orderBy(asc(workshops.displayOrder))
      .limit(50),
    db
      .select()
      .from(galleries)
      .where(eq(galleries.isActive, true))
      .orderBy(asc(galleries.displayOrder))
      .limit(100),
  ]);
  console.log(`[perf] workshops + galleries queries done (parallel): ${Date.now() - t0}ms`);

  const cleanedWorkshops = rawWorkshops
    .filter((w) => w.title && w.description)
    .map((w) => ({
      id: w.id,
      title: w.title,
      duration: w.duration,
      capacity: w.capacity,
      description: w.description,
      imageUrl:
        typeof w.imageUrl === 'string' && w.imageUrl.trim().startsWith('http')
          ? w.imageUrl.trim()
          : null,
      isActive: w.isActive,
      displayOrder: w.displayOrder,
      updatedAt: w.updatedAt.toISOString(),
      startDate: w.startDate ? w.startDate.toISOString() : null,
      endDate: w.endDate ? w.endDate.toISOString() : null,
    }));

  const cleanedGalleries = rawGalleries
    .filter((g) => {
      const trimmed = g.imageUrl?.trim();
      return trimmed && trimmed.startsWith('http');
    })
    .map((g) => ({
      ...g,
      imageUrl: g.imageUrl!.trim(),
    }));

  console.log(`[perf] HomePage data ready, about to render: ${Date.now() - t0}ms`);

  return (
    <main className="bg-executive-black min-h-screen">
      {/*
        Preconnecta ao CDN de imagens Cloudinary antes do primeiro <Image>
        remoto precisar do socket. Evidência de produção (Network tab): a
        PRIMEIRA imagem de res.cloudinary.com demora 8+ s (DNS+TCP+TLS
        handshake pago só na 1ª requisição a um domínio externo novo), e as
        seguintes carregam instantâneo — assinatura de custo de handshake, não
        peso de imagem nem bloqueio de JS. Hero/Founders/FinalCTA/logo escapam
        porque são /public (mesma origem). Recomendação documentada do Next.js
        para hosts em images.remotePatterns; <link> renderizado por Server
        Component é hoisted ao <head> no SSR (App Router).

        Escopo aqui (NÃO em app/layout.tsx) para emitir só na rota /, onde
        vivem as 3 seções que consomem Cloudinary: GallerySection (grid +
        carrossel), WorkshopsSection e TestimonialsSection (avatar) — todas via
        /api/upload → lib/cloudinary secure_url. /privacy e /admin não buscam
        res.cloudinary.com no browser (uploads do admin vão server-side via SDK
        do cloudinary, não pela página), então não merecem socket especulativo.
        Um único <link> por origem cobre as 3 seções (preconnect é por-host).
      */}
      <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      <Navigation />
      <HeroSection />
      <ManifestoSection />
      <ExperienceSection />
      <FoundersSection />
      <TransformationSection />
      <WorkshopsSection workshops={cleanedWorkshops} />
      <GallerySection galleries={cleanedGalleries} />
      <TestimonialsSection />
      <CommunitySection />
      <FinalCTASection />
      <Footer />
      {/*
        SectionPrefetchClient monta <SectionPrefetch /> dentro do chunk-group
        da rota / (via este page.tsx), NÃO do root layout. Isso alinha os 9
        import() do prefetch ao mesmo chunk-group dos wrappers *SectionClient,
        fazendo o webpack deduplicar cada chunk de seção em 1. Antes, montado
        em ClientWidgets (app/layout.tsx, shared por todas as rotas), vivia em
        chunk-group distinto e duplicava 8 das 9 seções. Ver SectionPrefetchClient.
      */}
      <SectionPrefetchClient />
    </main>
  );
}
