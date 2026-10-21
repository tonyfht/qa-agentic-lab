import Link from 'next/link'

export default function ProductNotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Este artículo no existe</h1>
      <p className="mt-2 text-store-muted">Puede que lo hayamos retirado o que el enlace esté mal escrito.</p>
      <Link href="/catalogo" className="mt-6 inline-block rounded-lg bg-store-terracotta px-4 py-2 font-semibold text-white">
        Ir al catálogo
      </Link>
    </main>
  )
}
