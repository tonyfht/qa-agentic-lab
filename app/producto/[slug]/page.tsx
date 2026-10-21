import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AddToCart } from '@/app/_components/AddToCart'
import { ProductCard } from '@/app/_components/ProductCard'
import { ProductImage } from '@/app/_components/ProductImage'
import { Rating } from '@/app/_components/Rating'
import { StockBadge } from '@/app/_components/StockBadge'
import { LockIcon, ReturnIcon, TruckIcon } from '@/app/_components/icons'
import { relatedProducts } from '@/lib/catalog/merchandising'
import { listProducts } from '@/lib/catalog/repository'
import { maxQuantity } from '@/lib/cart/pricing'
import { formatPrice } from '@/lib/catalog/query'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug
  const product = (await listProducts()).find((p) => p.slug === slug)
  return { title: product?.name ?? 'Artículo no encontrado' }
}

const PROMISES = [
  { icon: TruckIcon, text: 'Envío gratis desde 50 €; entrega en 24-48 h' },
  { icon: ReturnIcon, text: 'Devolución gratuita en 30 días' },
  { icon: LockIcon, text: 'Pago simulado: no se cobra nada' },
]

export default async function ProductPage({ params }: Props) {
  const slug = (await params).slug
  const products = await listProducts()
  const product = products.find((p) => p.slug === slug)
  if (!product) notFound()
  const related = relatedProducts(product, products, 4)

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-8">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-store-sand">
          <ProductImage slug={product.slug} name={product.name} category={product.category} sizes="(min-width: 1152px) 560px, (min-width: 768px) 50vw, 100vw" priority />
        </div>
        <article className="flex flex-col gap-5">
          <nav aria-label="Ruta" className="text-sm text-store-muted">
            <Link href="/catalogo" className="underline">
              Catálogo
            </Link>{' '}
            ›{' '}
            <Link href={`/catalogo?category=${product.category}`} className="underline">
              {product.categoryName}
            </Link>
          </nav>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold">{product.name}</h1>
            <div className="flex items-center gap-3">
              <Rating value={product.rating} />
              {product.isNew && <span className="rounded-full bg-store-olive px-2.5 py-0.5 text-xs font-semibold text-white">Novedad</span>}
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-semibold" data-testid="product-price">
              {formatPrice(product.priceCents)}
            </p>
            <span className="text-sm text-store-muted">IVA incluido</span>
          </div>
          <p>
            <StockBadge stock={product.stock} />
          </p>
          <p className="text-lg leading-relaxed text-store-muted">{product.description}</p>
          <div className="rounded-2xl border border-store-ink/10 bg-white p-5">
            <AddToCart slug={product.slug} max={maxQuantity(product.stock)} />
          </div>
          <ul className="flex flex-col gap-3 text-sm" aria-label="Envío y devoluciones">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <Icon className="size-5 text-store-terracotta-dark" /> {text}
              </li>
            ))}
          </ul>
        </article>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" data-testid="related">
          <h2 id="related-title" className="mb-6 text-2xl font-semibold">
            También te puede gustar
          </h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
