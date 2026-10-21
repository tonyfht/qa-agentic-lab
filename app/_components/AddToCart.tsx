'use client'

import { useState } from 'react'
import { BagIcon } from './icons'
import { useCartApi } from './useCartApi'

// The native select keeps the quantity accessible and keyboard friendly (and is what the cart scenarios drive).
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
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Cantidad
        <select
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="field rounded-full border border-store-ink/20 bg-white px-4 py-3"
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
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-store-terracotta px-6 py-3 font-semibold text-white hover:bg-store-terracotta-dark disabled:opacity-60"
      >
        <BagIcon /> Añadir al carrito
      </button>
      {message && (
        <p
          role="status"
          data-testid="cart-message"
          className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium ${message.kind === 'error' ? 'bg-store-terracotta/10 text-store-terracotta-dark' : 'bg-store-olive/10 text-store-olive'}`}
        >
          {message.text}
        </p>
      )}
    </form>
  )
}
