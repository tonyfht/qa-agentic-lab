import Link from 'next/link'
import { formatPrice } from '@/lib/catalog/query'
import type { Product } from '@/lib/catalog/types'
import { CardAddButton } from './CardAddButton'
import { ProductImage } from './ProductImage'
import { Rating } from './Rating'
import { StockBadge } from './StockBadge'

const GRID_SIZES = '(min-width: 1024px) 280px, (min-width: 768px) 33vw, 50vw'

// The link covers photo and name; the add button sits outside it (no nested interactive elements).
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <li data-testid="product-card" data-slug={product.slug} className="group relative flex flex-col overflow-hidden rounded-2xl border border-store-ink/10 bg-white transition hover:shadow-[0_8px_30px_rgba(43,33,24,0.08)]">
      <Link href={`/producto/${product.slug}`} prefetch={false} className="flex flex-1 flex-col">
        <span className="relative block overflow-hidden bg-store-sand">
          <ProductImage
            slug={product.slug}
            name={product.name}
            category={product.category}
            sizes={GRID_SIZES}
            priority={priority}
            className="transition duration-500 group-hover:scale-105"
          />
          {product.isNew && (
            <span className="absolute top-3 left-3 rounded-full bg-store-olive px-2.5 py-1 text-xs font-semibold text-white">Novedad</span>
          )}
        </span>
        <span className="flex flex-1 flex-col gap-1 p-4 pb-2">
          <span className="text-xs tracking-wide text-store-muted uppercase">{product.categoryName}</span>
          <span className="font-medium group-hover:text-store-terracotta" data-testid="product-name">
            {product.name}
          </span>
          <Rating value={product.rating} />
        </span>
      </Link>
      <div className="flex items-center justify-between gap-2 px-4 pb-4">
        <div className="flex flex-col items-start gap-1">
          <span className="text-lg font-semibold" data-testid="product-price">
            {formatPrice(product.priceCents)}
          </span>
          <StockBadge stock={product.stock} />
        </div>
        {product.stock > 0 && <CardAddButton slug={product.slug} name={product.name} />}
      </div>
    </li>
  )
}
