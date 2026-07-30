import { notFound } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <section className="flex flex-col items-center gap-8">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-xl">This page could not be found</p>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Go home
        </Link>
      </section>
    </main>
  );
}