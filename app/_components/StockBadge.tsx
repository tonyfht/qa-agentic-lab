import { LOW_STOCK } from '@/lib/catalog/types'

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="rounded-full bg-store-ink/10 px-2 py-0.5 text-xs font-semibold text-store-ink">Agotado</span>
  if (stock <= LOW_STOCK)
    return (
      <span className="rounded-full bg-store-terracotta/15 px-2 py-0.5 text-xs font-semibold text-store-terracotta-dark">
        Quedan {stock}
      </span>
    )
  return <span className="text-xs text-store-muted">En stock</span>
}
