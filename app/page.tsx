import Image from 'next/image'
import Link from 'next/link'
import { ProductCard } from './_components/ProductCard'
import { ArrowIcon, LockIcon, ReturnIcon, TruckIcon } from './_components/icons'
import { bannerPhoto, categoryPhoto } from '@/lib/catalog/images'
import { topRated } from '@/lib/catalog/merchandising'
import { listCategories, listProducts } from '@/lib/catalog/repository'

export const dynamic = 'force-dynamic'

const GUARANTEES = [
  { icon: TruckIcon, title: 'Envío gratis desde 50 €', text: 'Entrega en 24-48 h laborables' },
  { icon: ReturnIcon, title: 'Devolución en 30 días', text: 'Sin preguntas y sin coste' },
  { icon: LockIcon, title: 'Pago simulado', text: 'Tienda de demostración: no se cobra nada' },
]

// SHOP-002: banner, categories, best rated, new arrivals and guarantees. Only the banner photo loads with priority (EXP-006).
export default async function HomePage() {
  const [products, categories] = await Promise.all([listProducts(), listCategories()])
  const best = topRated(products, 4)
  // New arrivals not already shown among the best rated, so the two rows never repeat a product.
  const shown = new Set(best.map((p) => p.slug))
  const news = products.filter((p) => p.isNew && !shown.has(p.slug)).slice(0, 4)
  const hero = bannerPhoto('salon')!
  const textil = bannerPhoto('textil')!

  return (
    <main className="flex flex-col gap-16 pb-8">
      <section aria-labelledby="hero-title" className="bg-store-sand">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-[1fr_1.15fr] md:py-14">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-semibold tracking-widest text-store-terracotta-dark uppercase">Colección de otoño</p>
            <h1 id="hero-title" className="text-5xl leading-tight font-semibold sm:text-6xl">
              La Tienda en Casa
            </h1>
            <p className="font-serif text-2xl leading-snug text-store-terracotta-dark">Tu casa, más acogedora esta temporada</p>
            <p className="max-w-md text-lg text-store-muted">
              Mantas, velas y cerámica para los días cortos. Envío gratis desde 50 € y devolución en 30 días.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalogo" className="inline-flex items-center gap-2 rounded-full bg-store-terracotta px-6 py-3 font-semibold text-white hover:bg-store-terracotta-dark">
                Ver el catálogo <ArrowIcon className="size-4" />
              </Link>
              <Link href="/catalogo?sort=rating" className="inline-flex items-center rounded-full border border-store-ink/25 px-6 py-3 font-semibold hover:border-store-ink">
                Mejor valorados
              </Link>
            </div>
            <p className="text-xs text-store-muted">
              La Tienda en Casa es la tienda de demostración de QA Agentic Lab: existe para enseñar cómo se prueba un producto
              con ayuda de la IA.
            </p>
          </div>
          <Image
            src={hero.src}
            alt={hero.alt}
            width={1600}
            height={900}
            priority
            sizes="(min-width: 1152px) 600px, (min-width: 768px) 55vw, 100vw"
            className="aspect-[16/10] w-full rounded-3xl object-cover"
          />
        </div>
      </section>

      <section aria-labelledby="cats-title" className="mx-auto w-full max-w-6xl px-4">
        <h2 id="cats-title" className="mb-6 text-2xl font-semibold">
          Compra por categoría
        </h2>
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-5" data-testid="home-categories">
          {categories.map((c) => {
            const photo = categoryPhoto(c.slug)
            return (
              <li key={c.slug}>
                <Link href={`/catalogo?category=${c.slug}`} prefetch={false} className="group flex flex-col items-center gap-3 text-center">
                  <span className="block aspect-square w-full overflow-hidden rounded-full bg-store-sand">
                    {photo && (
                      <Image src={photo.src} alt="" width={600} height={600} sizes="(min-width: 640px) 200px, 30vw" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                    )}
                  </span>
                  <span className="font-medium group-hover:text-store-terracotta">{c.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="best-title" className="mx-auto w-full max-w-6xl px-4" data-testid="home-best">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 id="best-title" className="text-2xl font-semibold">
            Mejor valorados
          </h2>
          <Link href="/catalogo?sort=rating" className="text-sm font-semibold text-store-terracotta-dark hover:underline">
            Ver más
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {best.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="promo-title" className="mx-auto w-full max-w-6xl px-4">
        <div className="grid overflow-hidden rounded-3xl bg-store-olive text-white md:grid-cols-2">
          <Image src={textil.src} alt={textil.alt} width={1600} height={900} sizes="(min-width: 768px) 560px, 100vw" className="h-full max-h-80 w-full object-cover" />
          <div className="flex flex-col justify-center gap-4 p-8">
            <p className="text-sm font-semibold tracking-widest uppercase opacity-90">Textil de temporada</p>
            <h2 id="promo-title" className="text-3xl font-semibold">
              15 % en textil con el cupón TEXTIL15
            </h2>
            <p className="opacity-90">Mantas, cojines y mantelería para vestir la casa. Aplícalo en el carrito.</p>
            <Link href="/catalogo?category=textil" className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-store-olive hover:bg-store-cream">
              Ver textil <ArrowIcon className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="news-title" className="mx-auto w-full max-w-6xl px-4" data-testid="home-news">
        <h2 id="news-title" className="mb-6 text-2xl font-semibold">
          Novedades
        </h2>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {news.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </ul>
      </section>

      <section aria-label="Garantías" className="mx-auto w-full max-w-6xl px-4">
        <ul className="grid gap-4 rounded-3xl border border-store-ink/10 bg-white p-6 sm:grid-cols-3">
          {GUARANTEES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-store-sand text-store-terracotta-dark">
                <Icon className="size-6" />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="text-sm text-store-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
