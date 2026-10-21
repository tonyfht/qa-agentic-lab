import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { bannerPhoto, categoryPhoto, PHOTO_CREDITS, productPhoto } from '@/lib/catalog/images'
import { categories, products } from '@/lib/db/seed-data'

const pub = path.resolve(__dirname, '../../../public')
const filesIn = (dir: string): string[] =>
  readdirSync(path.join(pub, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesIn(`${dir}/${e.name}`) : /\.(webp|jpe?g|png|avif)$/.test(e.name) ? [`${dir}/${e.name}`] : [],
  )

describe('SHOP-003 Fotos de producto con crédito', () => {
  it('cada foto de public/images tiene su crédito, nombrando la que falte', () => {
    const credited = new Set(PHOTO_CREDITS.map((c) => c.file))
    expect(filesIn('images').filter((f) => !credited.has(f))).toEqual([])
  })

  it('cada crédito apunta a un fichero que existe y tiene autor, fuente, licencia y texto alternativo', () => {
    for (const c of PHOTO_CREDITS) {
      expect(existsSync(path.join(pub, c.file)), c.file).toBe(true)
      expect(c.alt.length, c.file).toBeGreaterThan(10)
      expect(c.author && c.license, c.file).toBeTruthy()
      expect(c.source, c.file).toMatch(/^https:\/\/unsplash\.com\/photos\//)
      expect(c.authorUrl, c.file).toMatch(/^https:\/\/unsplash\.com\/@/)
    }
  })

  it('todos los artículos, las cinco categorías y los dos banners tienen foto', () => {
    expect(products.filter((p) => !productPhoto(p.slug)).map((p) => p.slug)).toEqual([])
    expect(categories.filter((c) => !categoryPhoto(c.slug)).map((c) => c.slug)).toEqual([])
    expect(bannerPhoto('salon')).not.toBeNull()
    expect(bannerPhoto('textil')).not.toBeNull()
  })

  it('un artículo sin foto devuelve null para usar la ilustración de respaldo', () => {
    expect(productPhoto('no-existe')).toBeNull()
    expect(productPhoto('mantel-antimanchas')).toEqual({
      src: '/images/productos/mantel-antimanchas.webp',
      alt: 'Mantel de rayas sobre una mesa con fruta',
    })
  })
})
