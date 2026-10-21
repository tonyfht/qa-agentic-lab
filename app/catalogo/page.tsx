import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductCard } from '@/app/_components/ProductCard'
import type { RawParams } from '@/lib/catalog/query'
import { searchCatalog } from '@/lib/catalog/service'
import { activeDefect } from '@/lib/qa/defects'
import { SORT_LABELS, SORTS } from '@/lib/catalog/types'

export const metadata: Metadata = { title: 'Catálogo' }
export const dynamic = 'force-dynamic'

const input = 'w-full rounded-lg border border-store-ink/20 bg-white px-3 py-2'

function pageHref(params: RawParams, page: number): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (typeof v === 'string' && v && k !== 'page') sp.set(k, v)
  if (page > 1) sp.set('page', String(page))
  const qs = sp.toString()
  return qs ? `/catalogo?${qs}` : '/catalogo'
}

// A plain GET form: the catalogue works the same without JavaScript, and the URL is the state (CAT-009).
export default async function CatalogPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams
  const { page, errors, categories } = await searchCatalog(params)
  const value = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : '')

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[260px_1fr]">
      <form method="get" action="/catalogo" aria-label="Buscar y filtrar" className="flex flex-col gap-4 self-start rounded-2xl bg-white p-4">
        <h1 className="text-2xl font-bold md:hidden">Catálogo</h1>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Buscar
          <input type="search" name="q" defaultValue={value('q')} placeholder="Cafetera, manta, lámpara…" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Categoría
          <select name="category" defaultValue={value('category')} className={input}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex gap-2 text-sm font-medium">
          <legend className="mb-1">Precio (€)</legend>
          <label className="flex flex-1 flex-col gap-1 font-normal">
            Mínimo
            <input name="minPrice" inputMode="decimal" defaultValue={value('minPrice')} className={input} />
          </label>
          <label className="flex flex-1 flex-col gap-1 font-normal">
            Máximo
            <input name="maxPrice" inputMode="decimal" defaultValue={value('maxPrice')} className={input} />
          </label>
        </fieldset>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="inStock" value="1" defaultChecked={Boolean(value('inStock'))} />
          Solo con stock
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Ordenar por
          <select name="sort" defaultValue={SORTS.includes(value('sort') as never) ? value('sort') : 'relevance'} className={input}>
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg bg-store-terracotta px-4 py-2 font-semibold text-white hover:bg-store-terracotta-dark">
          Aplicar
        </button>
        <Link href="/catalogo" className="text-center text-sm underline">
          Quitar filtros
        </Link>
      </form>

      <section aria-labelledby="results-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 id="results-title" className="hidden text-3xl font-bold md:block">
            Catálogo
          </h1>
          {/* Injected defect `selector` (QA-029): same text, different test id. */}
          <p data-testid={activeDefect() === 'selector' ? 'results-count' : 'results-total'} aria-live="polite" className="text-store-muted">
            {page.total} {page.total === 1 ? 'artículo' : 'artículos'}
          </p>
        </div>

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
          <div className="rounded-2xl bg-white p-8 text-center" data-testid="empty-results">
            <p className="text-lg font-semibold">No hemos encontrado artículos</p>
            <p className="text-store-muted">
              {page.total > 0 ? 'Esta página no existe.' : 'Prueba con otras palabras o quita algún filtro.'}{' '}
              <Link href={page.total > 0 ? pageHref(params, 1) : '/catalogo'} className="underline">
                {page.total > 0 ? 'Volver a la primera página' : 'Ver todo el catálogo'}
              </Link>
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3" aria-label="Resultados">
            {page.items.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </ul>
        )}

        {page.pageCount > 1 && (
          <nav aria-label="Paginación" className="flex items-center justify-center gap-4">
            {page.page > 1 && <Link href={pageHref(params, page.page - 1)}>← Anterior</Link>}
            <span>
              Página {page.page} de {page.pageCount}
            </span>
            {page.page < page.pageCount && <Link href={pageHref(params, page.page + 1)}>Siguiente →</Link>}
          </nav>
        )}
      </section>
    </main>
  )
}
