import Link from 'next/link'
import { ProductCard } from './_components/ProductCard'
import { searchCatalog } from '@/lib/catalog/service'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { page } = await searchCatalog({})
  const news = page.items.filter((p) => p.isNew).slice(0, 4)

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12">
      <section className="flex flex-col gap-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-store-terracotta-dark">Artículos para el hogar</p>
        <h1 className="text-4xl font-bold sm:text-5xl">La Tienda en Casa</h1>
        <p className="max-w-2xl text-lg text-store-muted">
          Cocina, textil y decoración para tu casa. Esta tienda es la aplicación de demostración de QA Agentic Lab:
          existe para enseñar cómo se prueba un producto con ayuda de la IA.
        </p>
        <Link href="/catalogo" className="w-fit rounded-lg bg-store-terracotta px-5 py-3 font-semibold text-white hover:bg-store-terracotta-dark">
          Ver el catálogo
        </Link>
      </section>
      <section aria-labelledby="news-title" className="flex flex-col gap-4">
        <h2 id="news-title" className="text-2xl font-bold">
          Novedades
        </h2>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {news.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </ul>
      </section>
    </main>
  )
}
