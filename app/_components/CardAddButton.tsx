'use client'

import { PlusIcon } from './icons'
import { useCartApi } from './useCartApi'

// CART-006: one unit straight from the card, without leaving the page; the header counter refreshes.
export function CardAddButton({ slug, name }: { slug: string; name: string }) {
  const { call, message, pending } = useCartApi()
  return (
    <>
      <button
        type="button"
        disabled={pending}
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
