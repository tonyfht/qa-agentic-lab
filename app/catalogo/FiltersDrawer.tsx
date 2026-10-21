'use client'

import { useEffect, useRef, useState } from 'react'
import { CloseIcon, FilterIcon } from '@/app/_components/icons'

/**
 * CAT-011: on narrow screens the filters live in a drawer opened with "Filtros" and closed with "Cerrar" or Escape,
 * returning the focus to the button. From `md` up the same markup is a static sidebar (no duplicated form).
 */
export function FiltersDrawer({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      button.current?.focus()
    }
  }, [open])

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-full border border-store-ink/25 bg-white px-5 py-2.5 font-semibold md:hidden"
      >
        <FilterIcon /> Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>
      {open && <div className="fixed inset-0 z-40 bg-store-ink/40 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div
        role={open ? 'dialog' : undefined}
        aria-modal={open || undefined}
        aria-label={open ? 'Filtros' : undefined}
        data-testid="filters-panel"
        className={`${open ? 'fixed inset-y-0 left-0 z-50 w-[88%] max-w-sm overflow-y-auto bg-store-cream p-5 shadow-xl' : 'hidden'} md:static md:z-auto md:block md:w-auto md:max-w-none md:self-start md:overflow-visible md:rounded-2xl md:border md:border-store-ink/10 md:bg-white md:p-5 md:shadow-none`}
      >
        {open && (
          <div className="mb-4 flex items-center justify-between md:hidden">
            <p className="font-serif text-xl font-semibold">Filtros</p>
            <button ref={close} type="button" onClick={() => setOpen(false)} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-store-sand">
              <CloseIcon className="size-4" /> Cerrar
            </button>
          </div>
        )}
        {children}
      </div>
    </>
  )
}
