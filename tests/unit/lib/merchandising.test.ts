import { describe, expect, it } from 'vitest'
import { activeFilterChips, relatedProducts, topRated } from '@/lib/catalog/merchandising'
import type { CatalogQuery } from '@/lib/catalog/query'
import type { Category, Product } from '@/lib/catalog/types'

const p = (slug: string, category: string, rating: number, stock = 10): Product => ({
  slug,
  name: slug,
  description: '',
  category,
  categoryName: category,
  priceCents: 1000,
  stock,
  rating,
  isNew: false,
})

const products = [p('a', 'textil', 4.1), p('b', 'textil', 4.9, 0), p('c', 'textil', 4.5), p('d', 'cocina', 4.8), p('e', 'textil', 3.9), p('f', 'textil', 4.7)]

describe('SHOP-002 Portada que invita a comprar', () => {
  it('mejor valorados: solo con stock y de mayor a menor valoración', () => {
    expect(topRated(products, 4).map((x) => x.slug)).toEqual(['d', 'f', 'c', 'a'])
  })
})

describe('CART-007 Carrito vacío con sugerencias', () => {
  it('las sugerencias nunca incluyen un agotado', () => {
    expect(topRated(products, 10).some((x) => x.stock === 0)).toBe(false)
  })
})

describe('CAT-012 Artículos relacionados', () => {
  it('misma categoría, sin el propio artículo, como mucho 4', () => {
    const related = relatedProducts(products[0], products, 4)
    expect(related.every((x) => x.category === 'textil' && x.slug !== 'a')).toBe(true)
    expect(related).toHaveLength(4)
  })

  it('los agotados van detrás de todos los que tienen stock, aunque estén mejor valorados', () => {
    expect(relatedProducts(products[0], products, 4).map((x) => x.slug)).toEqual(['f', 'c', 'e', 'b'])
  })
})

describe('CAT-010 Filtros inmediatos y chips', () => {
  const categories: Category[] = [{ slug: 'textil', name: 'Textil', count: 5 }]
  const query: CatalogQuery = { q: 'lino', category: 'textil', minPriceCents: 1990, inStock: true, sort: 'price-asc', page: 3 }

  it('un chip por filtro activo, con texto legible', () => {
    expect(activeFilterChips(query, categories).map((c) => c.label.replace(/\s/g, ' '))).toEqual([
      '«lino»',
      'Textil',
      'Desde 19,90 €',
      'Solo con stock',
      'Precio: de menor a mayor',
    ])
  })

  it('quitar un chip conserva los demás filtros y vuelve a la primera página', () => {
    const textil = activeFilterChips(query, categories).find((c) => c.label === 'Textil')!
    expect(textil.href).toBe('/catalogo?q=lino&minPrice=19%2C90&inStock=1&sort=price-asc')
  })

  it('sin filtros no hay chips; quitando el último se vuelve al catálogo limpio', () => {
    expect(activeFilterChips({ inStock: false, sort: 'relevance', page: 1 }, categories)).toEqual([])
    expect(activeFilterChips({ inStock: true, sort: 'relevance', page: 1 }, categories)[0].href).toBe('/catalogo')
  })
})
