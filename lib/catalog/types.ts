export interface Product {
  slug: string
  name: string
  description: string
  category: string
  categoryName: string
  priceCents: number
  stock: number
  rating: number
  isNew: boolean
}

export interface Category {
  slug: string
  name: string
  count: number
}

export const SORTS = ['relevance', 'price-asc', 'price-desc', 'name', 'rating'] as const
export type Sort = (typeof SORTS)[number]

export const SORT_LABELS: Record<Sort, string> = {
  relevance: 'Relevancia',
  'price-asc': 'Precio: de menor a mayor',
  'price-desc': 'Precio: de mayor a menor',
  name: 'Nombre',
  rating: 'Mejor valorados',
}

export const PAGE_SIZE = 12
export const LOW_STOCK = 5
