'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Field } from '@/app/_components/Field'
import { postJson } from '@/app/_components/postJson'

const button = 'rounded-lg bg-store-terracotta px-4 py-2 font-semibold text-white hover:bg-store-terracotta-dark disabled:opacity-60'

function useForm(url: string, next: string) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const body = Object.fromEntries(new FormData(e.currentTarget))
    const result = await postJson(url, body)
    setPending(false)
    if (result.ok) {
      router.push(next)
      router.refresh()
      return
    }
    setError(result.data.error ?? 'No se ha podido completar')
    setFields(result.data.fields ?? {})
  }
  return { onSubmit, error, fields, pending }
}

export function LoginForm({ next }: { next: string }) {
  const { onSubmit, error, pending } = useForm('/api/account/login', next)
  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-4" aria-label="Entrar">
      <Field label="Correo" name="email" type="email" autoComplete="email" />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" />
      {error && (
        <p role="alert" data-testid="form-error" className="text-store-terracotta-dark">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className={button}>
        Entrar
      </button>
      <p className="text-sm">
        ¿No tienes cuenta?{' '}
        <Link href={`/cuenta/registro?next=${encodeURIComponent(next)}`} className="underline">
          Regístrate
        </Link>
      </p>
    </form>
  )
}

export function RegisterForm({ next }: { next: string }) {
  const { onSubmit, error, fields, pending } = useForm('/api/account/register', next)
  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-4" aria-label="Registro">
      <Field label="Nombre" name="name" autoComplete="given-name" error={fields.name} />
      <Field label="Correo" name="email" type="email" autoComplete="email" error={fields.email} />
      <Field label="Contraseña" name="password" type="password" autoComplete="new-password" error={fields.password} />
      {error && !Object.keys(fields).length && (
        <p role="alert" data-testid="form-error" className="text-store-terracotta-dark">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className={button}>
        Crear cuenta
      </button>
    </form>
  )
}
