import Link from 'next/link'
import { formatPrice } from '@/lib/catalog/query'
import type { Product } from '@/lib/catalog/types'
import { ProductArt } from './ProductArt'
import { StockBadge } from './StockBadge'

export function ProductCard({ product }: { product: Product }) {
  return (
    <li data-testid="product-card" data-slug={product.slug} className="rounded-2xl border border-store-ink/10 bg-white p-3">
      <Link href={`/producto/${product.slug}`} prefetch={false} className="group flex h-full flex-col gap-2">
        <ProductArt category={product.category} name={product.name} />
        <span className="text-xs uppercase tracking-wide text-store-muted">{product.categoryName}</span>
        <span className="font-semibold group-hover:text-store-terracotta" data-testid="product-name">
          {product.name}
        </span>
        <span className="mt-auto flex items-center justify-between gap-2">
          <span className="font-bold" data-testid="product-price">
            {formatPrice(product.priceCents)}
          </span>
          <StockBadge stock={product.stock} />
        </span>
      </Link>
    </li>
  )
}
