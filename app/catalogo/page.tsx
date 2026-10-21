import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductCard } from '@/app/_components/ProductCard'
import type { RawParams } from '@/lib/catalog/query'
import { searchCatalog } from '@/lib/catalog/service'
import { activeDefect } from '@/lib/qa/defects'
import { activeFilterChips } from '@/lib/catalog/merchandising'
import { CloseIcon } from '@/app/_components/icons'
import { FiltersDrawer } from './FiltersDrawer'
import { FiltersForm } from './FiltersForm'

export const metadata: Metadata = { title: 'Catálogo' }
export const dynamic = 'force-dynamic'

function pageHref(params: RawParams, page: number): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (typeof v === 'string' && v && k !== 'page') sp.set(k, v)
  if (page > 1) sp.set('page', String(page))
  const qs = sp.toString()
  return qs ? `/catalogo?${qs}` : '/catalogo'
}

// The form and its drawer are client components; results, chips and pagination render on the server (CAT-009…011).
export default async function CatalogPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams
  const { page, query, errors, categories } = await searchCatalog(params)
  const value = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : '')
  const chips = activeFilterChips(query, categories)
  const values = Object.fromEntries(['q', 'category', 'minPrice', 'maxPrice', 'inStock', 'sort'].map((k) => [k, value(k)]))
  const categoryName = categories.find((c) => c.slug === query.category)?.name

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav aria-label="Ruta" className="mb-1 text-sm text-store-muted">
            <Link href="/" className="hover:underline">
              Inicio
            </Link>{' '}
            › Catálogo
          </nav>
          <h1 className="text-4xl font-semibold">{categoryName ?? 'Catálogo'}</h1>
        </div>
        {/* Injected defect `selector` (QA-029): same text, different test id. */}
        <p data-testid={activeDefect() === 'selector' ? 'results-count' : 'results-total'} aria-live="polite" className="text-store-muted">
          {page.total} {page.total === 1 ? 'artículo' : 'artículos'}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <FiltersDrawer activeCount={chips.length}>
          <FiltersForm categories={categories} values={values} />
        </FiltersDrawer>

        <section aria-label="Resultados del catálogo" className="flex flex-col gap-5">
          {chips.length > 0 && (
            <ul aria-label="Filtros activos" className="flex flex-wrap items-center gap-2" data-testid="filter-chips">
              {chips.map((c) => (
                <li key={c.label}>
                  <Link
                    href={c.href}
                    aria-label={`Quitar filtro: ${c.label}`}
                    className="flex items-center gap-1.5 rounded-full border border-store-ink/15 bg-white px-3 py-1.5 text-sm hover:border-store-terracotta"
                  >
                    {c.label} <CloseIcon className="size-3.5" />
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/catalogo" className="px-2 text-sm text-store-terracotta-dark underline">
                  Quitar filtros
                </Link>
              </li>
            </ul>
          )}

          {errors.length > 0 && (
            <div role="alert" data-testid="catalog-alert" className="rounded-xl border border-store-terracotta/40 bg-store-terracotta/10 p-3 text-sm">
              <p className="font-semibold">Hemos ignorado algún filtro:</p>
              <ul className="list-disc pl-5">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {page.items.length === 0 ? (
            <div className="rounded-2xl border border-store-ink/10 bg-white p-10 text-center" data-testid="empty-results">
              <p className="font-serif text-2xl font-semibold">No hemos encontrado artículos</p>
              <p className="mt-2 text-store-muted">
                {page.total > 0 ? 'Esta página no existe.' : 'Prueba con otras palabras o quita algún filtro.'}{' '}
                <Link href={page.total > 0 ? pageHref(params, 1) : '/catalogo'} className="font-semibold text-store-terracotta-dark underline">
                  {page.total > 0 ? 'Volver a la primera página' : 'Ver todo el catálogo'}
                </Link>
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3" aria-label="Resultados">
              {page.items.map((p, i) => (
                <ProductCard key={p.slug} product={p} priority={i < 2} />
              ))}
            </ul>
          )}

          {page.pageCount > 1 && (
            <nav aria-label="Paginación" className="flex items-center justify-center gap-4 pt-2">
              {page.page > 1 && (
                <Link href={pageHref(params, page.page - 1)} className="rounded-full border border-store-ink/20 bg-white px-4 py-2 hover:border-store-terracotta">
                  ← Anterior
                </Link>
              )}
              <span className="text-store-muted">
                Página {page.page} de {page.pageCount}
              </span>
              {page.page < page.pageCount && (
                <Link href={pageHref(params, page.page + 1)} className="rounded-full border border-store-ink/20 bg-white px-4 py-2 hover:border-store-terracotta">
                  Siguiente →
                </Link>
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  )
}
