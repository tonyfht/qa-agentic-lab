'use client'

import { useState } from 'react'
import { useCartApi } from './useCartApi'

export function AddToCart({ slug, max }: { slug: string; max: number }) {
  const [quantity, setQuantity] = useState(1)
  const { call, message, pending } = useCartApi()

  if (max === 0) return <p className="font-semibold">Este artículo está agotado</p>

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        await call('/api/cart/items', 'POST', { slug, quantity }, 'Añadido al carrito')
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        Cantidad
        <select
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="rounded-lg border border-store-ink/20 bg-white px-3 py-2"
        >
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-store-terracotta px-5 py-2 font-semibold text-white hover:bg-store-terracotta-dark disabled:opacity-60"
      >
        Añadir al carrito
      </button>
      {message && (
        <p role="status" data-testid="cart-message" className={message.kind === 'error' ? 'w-full text-store-terracotta-dark' : 'w-full'}>
          {message.text}
        </p>
      )}
    </form>
  )
}
