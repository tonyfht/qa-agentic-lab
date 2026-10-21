import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AddToCart } from '@/app/_components/AddToCart'
import { ProductArt } from '@/app/_components/ProductArt'
import { StockBadge } from '@/app/_components/StockBadge'
import { getProduct } from '@/lib/catalog/repository'
import { maxQuantity } from '@/lib/cart/pricing'
import { formatPrice } from '@/lib/catalog/query'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug)
  return { title: product?.name ?? 'Artículo no encontrado' }
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug)
  if (!product) notFound()

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2">
      <ProductArt category={product.category} name={product.name} size="large" />
      <article className="flex flex-col gap-4">
        <nav aria-label="Ruta" className="text-sm text-store-muted">
          <Link href="/catalogo" className="underline">
            Catálogo
          </Link>{' '}
          ›{' '}
          <Link href={`/catalogo?category=${product.category}`} className="underline">
            {product.categoryName}
          </Link>
        </nav>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-2xl font-bold" data-testid="product-price">
          {formatPrice(product.priceCents)}
        </p>
        <p className="flex items-center gap-3">
          <StockBadge stock={product.stock} />
          <span className="text-sm text-store-muted" aria-label={`Valoración ${product.rating} de 5`}>
            ★ {product.rating.toLocaleString('es-ES')} / 5
          </span>
        </p>
        <p className="text-lg text-store-muted">{product.description}</p>
        <AddToCart slug={product.slug} max={maxQuantity(product.stock)} />
      </article>
    </main>
  )
}
