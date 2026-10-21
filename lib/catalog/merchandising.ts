import type { CatalogQuery } from './query'
import { formatPrice } from './query'
import { SORT_LABELS, type Category, type Product } from './types'

const byRating = (a: Product, b: Product) => b.rating - a.rating || a.name.localeCompare(b.name, 'es')

/** Best rated products that can be bought: home page and empty cart (SHOP-002, CART-007). */
export function topRated(products: Product[], count: number): Product[] {
  return products.filter((p) => p.stock > 0).sort(byRating).slice(0, count)
}

/** Same category, never the product itself; in stock first, then by rating (CAT-012). */
export function relatedProducts(product: Product, products: Product[], count: number): Product[] {
  return products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || byRating(a, b))
    .slice(0, count)
}

export interface FilterChip {
  /** Visible text of the chip. */
  label: string
  /** Catalogue URL without this filter and keeping the others (CAT-010). */
  href: string
}

/** One chip per active filter; removing one keeps the rest and goes back to page 1. */
export function activeFilterChips(query: CatalogQuery, categories: Category[]): FilterChip[] {
  const params: [string, string, string][] = []
  if (query.q) params.push(['q', query.q, `«${query.q}»`])
  if (query.category) params.push(['category', query.category, categories.find((c) => c.slug === query.category)?.name ?? query.category])
  if (query.minPriceCents !== undefined) params.push(['minPrice', centsToParam(query.minPriceCents), `Desde ${formatPrice(query.minPriceCents)}`])
  if (query.maxPriceCents !== undefined) params.push(['maxPrice', centsToParam(query.maxPriceCents), `Hasta ${formatPrice(query.maxPriceCents)}`])
  if (query.inStock) params.push(['inStock', '1', 'Solo con stock'])
  if (query.sort !== 'relevance') params.push(['sort', query.sort, SORT_LABELS[query.sort]])

  return params.map(([key, , label]) => {
    const sp = new URLSearchParams(params.filter(([k]) => k !== key).map(([k, v]) => [k, v]))
    const qs = sp.toString()
    return { label, href: qs ? `/catalogo?${qs}` : '/catalogo' }
  })
}

function centsToParam(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace('.', ',')
}
