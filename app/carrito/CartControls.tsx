'use client'

import { useState } from 'react'
import { useCartApi } from '@/app/_components/useCartApi'

export function LineControls({ slug, name, quantity, max }: { slug: string; name: string; quantity: number; max: number }) {
  const { call, message, pending } = useCartApi()
  const options = Array.from({ length: Math.max(max, quantity) }, (_, i) => i + 1)
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <span className="sr-only">Cantidad de {name}</span>
        <select
          aria-label={`Cantidad de ${name}`}
          value={quantity}
          disabled={pending}
          onChange={(e) => call(`/api/cart/items/${slug}`, 'PATCH', { quantity: Number(e.target.value) })}
          className="field rounded-full border border-store-ink/20 bg-white py-1.5 pl-3"
        >
          {options.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() => call(`/api/cart/items/${slug}`, 'DELETE')}
        className="text-sm text-store-muted underline hover:text-store-terracotta-dark"
        aria-label={`Eliminar ${name}`}
      >
        Eliminar
      </button>
      {message && (
        <span role="status" className="text-sm text-store-terracotta-dark">
          {message.text}
        </span>
      )}
    </div>
  )
}

export function CouponForm({ current }: { current: string | null }) {
  const [code, setCode] = useState('')
  const { call, message, pending } = useCartApi()
  return (
    <div className="flex flex-col gap-2">
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          if (await call('/api/cart/coupon', 'POST', { code }, 'Cupón aplicado')) setCode('')
        }}
      >
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          Cupón de descuento
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="BIENVENIDA10"
            className="rounded-full border border-store-ink/20 bg-white px-4 py-2.5"
          />
        </label>
        <button type="submit" disabled={pending} className="self-end rounded-full border border-store-ink/30 px-4 py-2.5 font-semibold hover:border-store-ink">
          Aplicar
        </button>
      </form>
      {current && (
        <button type="button" disabled={pending} onClick={() => call('/api/cart/coupon', 'DELETE')} className="w-fit text-sm underline">
          Quitar el cupón {current}
        </button>
      )}
      {message && (
        <p role="status" data-testid="coupon-message" className={message.kind === 'error' ? 'text-sm text-store-terracotta-dark' : 'text-sm'}>
          {message.text}
        </p>
      )}
    </div>
  )
}
