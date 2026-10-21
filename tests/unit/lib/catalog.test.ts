import { describe, expect, it } from 'vitest'
import { eurosToCents, formatPrice, normalize, parseCatalogQuery, queryCatalog, type CatalogQuery } from '@/lib/catalog/query'
import type { Product } from '@/lib/catalog/types'
import { categories, products as seed } from '@/lib/db/seed-data'

const slugs = categories.map((c) => c.slug)
const products: Product[] = seed.map((p) => ({ ...p, categoryName: categories.find((c) => c.slug === p.category)!.name }))
const base: CatalogQuery = { inStock: false, sort: 'relevance', page: 1 }
const run = (q: Partial<CatalogQuery>) => queryCatalog(products, { ...base, ...q })

describe('CAT-001 Listado del catálogo', () => {
  it('el catálogo de ejemplo tiene 24 artículos con slugs únicos y los casos de prueba previstos', () => {
    expect(seed).toHaveLength(24)
    expect(new Set(seed.map((p) => p.slug)).size).toBe(24)
    expect(seed.filter((p) => p.priceCents === 1990)).toHaveLength(1)
    expect(seed.filter((p) => p.stock === 0)).toHaveLength(2)
    expect(seed.filter((p) => p.stock === 3)).toHaveLength(1)
  })

  it('pagina de 12 en 12', () => {
    expect(run({}).items).toHaveLength(12)
    expect(run({ page: 2 }).items).toHaveLength(12)
    expect(run({})).toMatchObject({ total: 24, pageCount: 2, pageSize: 12 })
  })

  it('una página fuera de rango devuelve una lista vacía, no un error', () => {
    expect(run({ page: 9 })).toMatchObject({ items: [], total: 24, page: 9 })
  })
})

describe('CAT-002 Búsqueda por texto', () => {
  it('no distingue mayúsculas ni tildes', () => {
    expect(normalize('Algodón CAFETERA')).toBe('algodon cafetera')
    for (const q of ['cafetera', 'CAFETERA', 'Cafetéra']) {
      expect(run({ q }).items.map((p) => p.slug)).toContain('cafetera-italiana-aluminio')
    }
  })

  it('encuentra "algodón" en un texto escrito sin tilde', () => {
    expect(run({ q: 'algodón' }).items.map((p) => p.slug)).toContain('funda-nordica-lisa')
  })

  it('un texto solo con espacios es una búsqueda vacía', () => {
    expect(parseCatalogQuery({ q: '   ' }, slugs).query.q).toBeUndefined()
  })

  it('la coincidencia en el nombre va antes que en la descripción', () => {
    const items = run({ q: 'taza' }).items.map((p) => p.slug)
    expect(items.indexOf('taza-desayuno-xl')).toBeLessThan(items.indexOf('cafetera-italiana-aluminio'))
  })

  it('sin resultados devuelve una lista vacía', () => {
    expect(run({ q: 'submarino' }).total).toBe(0)
  })
})

describe('CAT-003 Filtro por categoría', () => {
  it('solo devuelve artículos de la categoría', () => {
    const page = run({ category: 'textil' })
    expect(page.total).toBe(5)
    expect(page.items.every((p) => p.category === 'textil')).toBe(true)
  })

  it('rechaza una categoría inexistente', () => {
    expect(parseCatalogQuery({ category: 'jardineria-espacial' }, slugs).errors).toEqual([
      'La categoría «jardineria-espacial» no existe',
    ])
  })
})

describe('CAT-004 Filtro por rango de precio', () => {
  it('convierte euros escritos con coma o punto a céntimos', () => {
    expect(eurosToCents('19,90')).toBe(1990)
    expect(eurosToCents('19.9')).toBe(1990)
    expect(eurosToCents('19')).toBe(1900)
    expect(eurosToCents('19,999')).toBeNull()
    expect(eurosToCents('abc')).toBeNull()
  })

  it.each([
    ['19,90', '19,90', 1],
    ['19,89', '19,90', 1],
    ['19,90', '19,91', 1],
    ['19,91', '20', 0],
    ['0', '19,89', 8],
  ])('mínimo %s y máximo %s (límites incluidos) → %i artículos', (minPrice, maxPrice, expected) => {
    const { query, errors } = parseCatalogQuery({ minPrice, maxPrice }, slugs)
    expect(errors).toEqual([])
    expect(queryCatalog(products, query).total).toBe(expected)
  })

  it('rechaza un rango invertido y conserva el resto de filtros', () => {
    const { query, errors } = parseCatalogQuery({ minPrice: '50', maxPrice: '10', category: 'cocina' }, slugs)
    expect(errors).toEqual(['El precio mínimo no puede ser mayor que el máximo'])
    expect(query.category).toBe('cocina')
    expect(query.minPriceCents).toBeUndefined()
    expect(query.maxPriceCents).toBeUndefined()
  })

  it('rechaza precios negativos y no numéricos', () => {
    expect(parseCatalogQuery({ minPrice: '-1' }, slugs).errors).toEqual(['El precio mínimo no puede ser negativo'])
    expect(parseCatalogQuery({ maxPrice: 'mucho' }, slugs).errors).toEqual(['El precio máximo «mucho» no es un número'])
  })
})

describe('CAT-005 Filtro de disponibilidad', () => {
  it('"solo con stock" excluye los agotados', () => {
    expect(run({ inStock: true }).total).toBe(22)
    expect(run({ inStock: true }).items.every((p) => p.stock > 0)).toBe(true)
  })

  it('acepta las formas habituales de activar la casilla', () => {
    for (const v of ['1', 'true', 'on']) expect(parseCatalogQuery({ inStock: v }, slugs).query.inStock).toBe(true)
    expect(parseCatalogQuery({}, slugs).query.inStock).toBe(false)
  })
})

describe('CAT-006 Ordenación', () => {
  it('precio ascendente y descendente', () => {
    const asc = run({ sort: 'price-asc', page: 1 }).items.map((p) => p.priceCents)
    expect(asc).toEqual([...asc].sort((a, b) => a - b))
    const desc = run({ sort: 'price-desc' }).items.map((p) => p.priceCents)
    expect(desc).toEqual([...desc].sort((a, b) => b - a))
  })

  it('por valoración, de mayor a menor', () => {
    const r = run({ sort: 'rating' }).items.map((p) => p.rating)
    expect(r).toEqual([...r].sort((a, b) => b - a))
  })

  it('rechaza un criterio desconocido indicando los admitidos', () => {
    expect(parseCatalogQuery({ sort: 'aleatorio' }, slugs).errors[0]).toMatch(/Admitidos: relevance, price-asc/)
  })
})

describe('CAT-009 Misma respuesta en interfaz y API', () => {
  it('los mismos parámetros dan siempre la misma lista (función única y determinista)', () => {
    const params = { q: 'taza', category: 'cocina', sort: 'price-desc' }
    const a = queryCatalog(products, parseCatalogQuery(params, slugs).query)
    const b = queryCatalog([...products].reverse(), parseCatalogQuery(params, slugs).query)
    expect(a.items.map((p) => p.slug)).toEqual(b.items.map((p) => p.slug))
  })

  it('un orden desconocido cae al orden por defecto', () => {
    expect(parseCatalogQuery({ sort: 'aleatorio' }, slugs).query.sort).toBe('relevance')
  })

  it('formatea precios en euros', () => {
    expect(formatPrice(1990).replace(/\s/g, ' ')).toBe('19,90 €')
  })
})
