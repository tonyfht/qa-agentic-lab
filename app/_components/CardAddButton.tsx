'use client'

import { useSyncExternalStore } from 'react'
import { PlusIcon } from './icons'
import { useCartApi } from './useCartApi'

const noSubscription = () => () => {}

// CART-006: one unit straight from the card, without leaving the page; the header counter refreshes.
export function CardAddButton({ slug, name }: { slug: string; name: string }) {
  const { call, message, pending } = useCartApi()
  // The button only works once React has hydrated it: until then it stays disabled, so an early click is never lost
  // (seen as a flaky "add a suggestion" scenario on a loaded machine, QAL-011).
  const ready = useSyncExternalStore(noSubscription, () => true, () => false)
  return (
    <>
      <button
        type="button"
        disabled={!ready || pending}
        onClick={() => call('/api/cart/items', 'POST', { slug, quantity: 1 }, 'Añadido al carrito')}
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-store-terracotta text-store-terracotta transition hover:bg-store-terracotta hover:text-white disabled:opacity-60"
      >
        <PlusIcon />
        <span className="sr-only">Añadir {name} al carrito</span>
      </button>
      {message && (
        <p
          role="status"
          data-testid="card-cart-message"
          className={`absolute inset-x-3 bottom-3 rounded-lg px-3 py-2 text-center text-sm font-medium text-white ${message.kind === 'error' ? 'bg-store-terracotta-dark' : 'bg-store-olive'}`}
        >
          {message.text}
        </p>
      )}
    </>
  )
}
