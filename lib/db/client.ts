import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { createClient, type Client } from '@libsql/client'
import { categories, coupons, products } from './seed-data'

// One local SQLite file, created and seeded on first use: no setup locally, in CI or in E2E (RT-2).
const DEFAULT_URL = `file:${path.join('.data', 'tienda.db')}`

let ready: Promise<Client> | null = null

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS categories (
     slug TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     position INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS products (
     slug TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT NOT NULL,
     category TEXT NOT NULL REFERENCES categories(slug),
     price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
     stock INTEGER NOT NULL CHECK (stock >= 0),
     rating REAL NOT NULL,
     is_new INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS coupons (
     code TEXT PRIMARY KEY,
     kind TEXT NOT NULL CHECK (kind IN ('percent', 'fixed', 'shipping')),
     value INTEGER NOT NULL,
     min_subtotal_cents INTEGER NOT NULL DEFAULT 0,
     category TEXT REFERENCES categories(slug),
     valid_until TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS carts (
     id TEXT PRIMARY KEY,
     coupon_code TEXT REFERENCES coupons(code),
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS cart_items (
     cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
     slug TEXT NOT NULL REFERENCES products(slug),
     quantity INTEGER NOT NULL CHECK (quantity > 0),
     PRIMARY KEY (cart_id, slug)
   )`,
]

async function init(): Promise<Client> {
  const url = process.env.DATABASE_URL ?? DEFAULT_URL
  if (url.startsWith('file:')) mkdirSync(path.dirname(url.slice('file:'.length)), { recursive: true })
  const db = createClient({ url })

  await db.batch(SCHEMA, 'write')

  const { rows } = await db.execute('SELECT COUNT(*) AS n FROM products')
  if (Number(rows[0].n) === 0) {
    await db.batch(
      [
        ...categories.map((c, i) => ({
          sql: 'INSERT OR IGNORE INTO categories (slug, name, position) VALUES (?, ?, ?)',
          args: [c.slug, c.name, i],
        })),
        ...products.map((p) => ({
          sql: `INSERT INTO products (slug, name, description, category, price_cents, stock, rating, is_new)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [p.slug, p.name, p.description, p.category, p.priceCents, p.stock, p.rating, p.isNew ? 1 : 0],
        })),
      ],
      'write',
    )
  }

  // Coupons are reference data: upserted on every start so existing databases get new ones too.
  await db.batch(
    coupons.map((k) => ({
      sql: `INSERT INTO coupons (code, kind, value, min_subtotal_cents, category, valid_until) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET kind = excluded.kind, value = excluded.value,
              min_subtotal_cents = excluded.min_subtotal_cents, category = excluded.category,
              valid_until = excluded.valid_until`,
      args: [k.code, k.kind, k.value, k.minSubtotalCents, k.category, k.validUntil],
    })),
    'write',
  )
  return db
}

export function getDb(): Promise<Client> {
  ready ??= init().catch((error) => {
    ready = null
    throw error
  })
  return ready
}
