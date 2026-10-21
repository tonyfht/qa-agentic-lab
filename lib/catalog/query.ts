import { PAGE_SIZE, SORTS, type Product, type Sort } from './types'

export interface CatalogQuery {
  q?: string
  category?: string
  minPriceCents?: number
  maxPriceCents?: number
  inStock: boolean
  sort: Sort
  page: number
}

export interface CatalogPage {
  items: Product[]
  total: number
  page: number
  pageCount: number
  pageSize: number
}

export type RawParams = Record<string, string | string[] | undefined>

/** Lower case and without accents, so "Algodón", "ALGODON" and "algodon" match (CAT-002). */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/** Euros as typed by a person ("19,90", "19.90", "19") to cents; null when it is not a number. */
export function eurosToCents(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) return null
  return Math.round(Number(trimmed) * 100)
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/**
 * Validates the catalogue parameters shared by the page and the API. Invalid parameters produce a Spanish error and
 * are dropped from `query`, which keeps every valid filter (CAT-004, CAT-009): the API answers 400 with `errors`,
 * the page shows them and still renders the catalogue.
 */
export function parseCatalogQuery(params: RawParams, categorySlugs: string[]): { query: CatalogQuery; errors: string[] } {
  const errors: string[] = []
  const query: CatalogQuery = { inStock: false, sort: 'relevance', page: 1 }

  const q = first(params.q)?.trim()
  if (q) query.q = q

  const category = first(params.category)?.trim()
  if (category) {
    if (categorySlugs.includes(category)) query.category = category
    else errors.push(`La categoría «${category}» no existe`)
  }

  const prices: { min?: number; max?: number } = {}
  for (const [key, label, field] of [
    ['minPrice', 'mínimo', 'min'],
    ['maxPrice', 'máximo', 'max'],
  ] as const) {
    const raw = first(params[key])?.trim()
    if (!raw) continue
    const cents = eurosToCents(raw)
    if (cents === null) errors.push(`El precio ${label} «${raw}» no es un número`)
    else if (cents < 0) errors.push(`El precio ${label} no puede ser negativo`)
    else prices[field] = cents
  }
  if (prices.min !== undefined && prices.max !== undefined && prices.min > prices.max) {
    errors.push('El precio mínimo no puede ser mayor que el máximo')
  } else {
    query.minPriceCents = prices.min
    query.maxPriceCents = prices.max
  }

  const inStock = first(params.inStock)
  query.inStock = inStock === '1' || inStock === 'true' || inStock === 'on'

  const sort = first(params.sort)?.trim()
  if (sort) {
    if ((SORTS as readonly string[]).includes(sort)) query.sort = sort as Sort
    else errors.push(`Orden «${sort}» desconocido. Admitidos: ${SORTS.join(', ')}`)
  }

  const page = first(params.page)?.trim()
  if (page) {
    if (/^\d+$/.test(page) && Number(page) >= 1) query.page = Number(page)
    else errors.push(`La página «${page}» no es válida`)
  }

  return { query, errors }
}

function relevance(product: Product, q: string): number {
  const needle = normalize(q)
  return (normalize(product.name).includes(needle) ? 2 : 0) + (normalize(product.description).includes(needle) ? 1 : 0)
}

const byName = (a: Product, b: Product) => a.name.localeCompare(b.name, 'es')

/** Filters, sorts and paginates. Pure: the same function serves the page and the API (CAT-009). */
export function queryCatalog(products: Product[], query: CatalogQuery): CatalogPage {
  let items = products.filter((p) => {
    if (query.q && relevance(p, query.q) === 0) return false
    if (query.category && p.category !== query.category) return false
    if (query.minPriceCents !== undefined && p.priceCents < query.minPriceCents) return false
    if (query.maxPriceCents !== undefined && p.priceCents > query.maxPriceCents) return false
    if (query.inStock && p.stock === 0) return false
    return true
  })

  const comparators: Record<Sort, (a: Product, b: Product) => number> = {
    relevance: query.q
      ? (a, b) => relevance(b, query.q!) - relevance(a, query.q!) || byName(a, b)
      : (a, b) => Number(b.isNew) - Number(a.isNew) || byName(a, b),
    'price-asc': (a, b) => a.priceCents - b.priceCents || byName(a, b),
    'price-desc': (a, b) => b.priceCents - a.priceCents || byName(a, b),
    name: byName,
    rating: (a, b) => b.rating - a.rating || byName(a, b),
  }
  items = [...items].sort(comparators[query.sort])

  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const start = (query.page - 1) * PAGE_SIZE
  return { items: items.slice(start, start + PAGE_SIZE), total, page: query.page, pageCount, pageSize: PAGE_SIZE }
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}
