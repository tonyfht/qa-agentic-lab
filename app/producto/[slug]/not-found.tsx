import Link from 'next/link'

export default function ProductNotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-4xl font-semibold">Este artículo no existe</h1>
      <p className="mt-2 text-store-muted">Puede que lo hayamos retirado o que el enlace esté mal escrito.</p>
      <Link href="/catalogo" className="mt-6 inline-block rounded-full bg-store-terracotta px-6 py-3 font-semibold text-white hover:bg-store-terracotta-dark">
        Ir al catálogo
      </Link>
    </main>
  )
}
