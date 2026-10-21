'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      className="underline"
      onClick={async () => {
        await fetch('/api/account/logout', { method: 'POST' })
        router.push('/')
        router.refresh()
      }}
    >
      Salir
    </button>
  )
}
