import { getDb } from '@/lib/db/client'
import type { Category, Product } from './types'

export async function listProducts(): Promise<Product[]> {
  const db = await getDb()
  const { rows } = await db.execute(
    `SELECT p.slug, p.name, p.description, p.category, c.name AS category_name,
            p.price_cents, p.stock, p.rating, p.is_new
       FROM products p JOIN categories c ON c.slug = p.category`,
  )
  return rows.map((r) => ({
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description),
    category: String(r.category),
    categoryName: String(r.category_name),
    priceCents: Number(r.price_cents),
    stock: Number(r.stock),
    rating: Number(r.rating),
    isNew: Number(r.is_new) === 1,
  }))
}

export async function getProduct(slug: string): Promise<Product | null> {
  return (await listProducts()).find((p) => p.slug === slug) ?? null
}

export async function listCategories(): Promise<Category[]> {
  const db = await getDb()
  const { rows } = await db.execute(
    `SELECT c.slug, c.name, COUNT(p.slug) AS count
       FROM categories c LEFT JOIN products p ON p.category = c.slug
      GROUP BY c.slug ORDER BY c.position`,
  )
  return rows.map((r) => ({ slug: String(r.slug), name: String(r.name), count: Number(r.count) }))
}
