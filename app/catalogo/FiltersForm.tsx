'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useTransition } from 'react'
import type { Category } from '@/lib/catalog/types'
import { SORT_LABELS, SORTS } from '@/lib/catalog/types'

const field = 'field w-full rounded-xl border border-store-ink/20 bg-white px-3 py-2.5'

/**
 * A plain GET form: without JavaScript "Aplicar" submits it and the URL is the state (CAT-009). With JavaScript,
 * category, sort and stock apply on change through a client navigation, so the form stays in the page (CAT-010).
 */
export function FiltersForm({ categories, values }: { categories: Category[]; values: Record<string, string> }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const form = useRef<HTMLFormElement>(null)
  const valuesKey = JSON.stringify(values)

  // Client navigations (a chip, the header search) keep this form mounted: its fields follow the URL without
  // remounting, so the keyboard focus stays where it was.
  useEffect(() => {
    const el = form.current
    if (!el) return
    const current = JSON.parse(valuesKey) as Record<string, string>
    for (const name of Object.keys(current)) {
      const control = el.elements.namedItem(name)
      if (control instanceof HTMLInputElement && control.type === 'checkbox') control.checked = Boolean(current[name])
      else if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement)
        control.value = name === 'sort' ? current.sort || 'relevance' : current[name]
    }
  }, [valuesKey])

  function applyNow(form: HTMLFormElement) {
    const params = new URLSearchParams()
    for (const [k, v] of new FormData(form)) if (typeof v === 'string' && v.trim()) params.set(k, v.trim())
    if (params.get('sort') === 'relevance') params.delete('sort')
    const qs = params.toString()
    startTransition(() => router.push(qs ? `/catalogo?${qs}` : '/catalogo', { scroll: false }))
  }

  return (
    <form ref={form} method="get" action="/catalogo" aria-label="Buscar y filtrar" aria-busy={pending} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Buscar
        <input type="search" name="q" defaultValue={values.q} placeholder="Cafetera, manta, lámpara…" className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Categoría
        <select name="category" defaultValue={values.category} className={field} onChange={(e) => applyNow(e.currentTarget.form!)}>
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
      </label>
      <fieldset className="flex gap-3 text-sm font-semibold">
        <legend className="mb-1.5">Precio (€)</legend>
        <label className="flex flex-1 flex-col gap-1 font-normal">
          Mínimo
          <input name="minPrice" inputMode="decimal" defaultValue={values.minPrice} className={field} />
        </label>
        <label className="flex flex-1 flex-col gap-1 font-normal">
          Máximo
          <input name="maxPrice" inputMode="decimal" defaultValue={values.maxPrice} className={field} />
        </label>
      </fieldset>
      <label className="flex items-center gap-2.5 text-sm font-semibold">
        <input
          type="checkbox"
          name="inStock"
          value="1"
          defaultChecked={Boolean(values.inStock)}
          className="size-4 accent-store-terracotta"
          onChange={(e) => applyNow(e.currentTarget.form!)}
        />
        Solo con stock
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Ordenar por
        <select
          name="sort"
          defaultValue={SORTS.includes(values.sort as never) ? values.sort : 'relevance'}
          className={field}
          onChange={(e) => applyNow(e.currentTarget.form!)}
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="rounded-full bg-store-terracotta px-4 py-2.5 font-semibold text-white hover:bg-store-terracotta-dark">
        Aplicar
      </button>
    </form>
  )
}
