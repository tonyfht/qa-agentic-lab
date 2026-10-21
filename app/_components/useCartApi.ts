'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

/** Calls the cart API and refreshes the server components (header counter, cart page) on success. */
export function useCartApi() {
  const router = useRouter()
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  async function call(url: string, method: string, body?: unknown, okText?: string) {
    setMessage(null)
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setMessage({ kind: 'error', text: data.error ?? 'No se ha podido actualizar el carrito' })
      return false
    }
    if (okText) setMessage({ kind: 'ok', text: okText })
    startTransition(() => router.refresh())
    return true
  }

  return { call, message, pending }
}
