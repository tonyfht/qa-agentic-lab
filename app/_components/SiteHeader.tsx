import Link from 'next/link'
import { getCart } from '@/lib/cart/repository'
import { readCartId } from '@/lib/cart/session'

export async function SiteHeader() {
  const { units } = await getCart(await readCartId())
  return (
    <header className="border-b border-store-ink/10 bg-white/70">
      <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-store-ink">
          La Tienda en Casa
        </Link>
        <ul className="flex gap-5 text-sm font-medium">
          <li>
            <Link href="/catalogo" className="hover:text-store-terracotta">
              Catálogo
            </Link>
          </li>
          <li>
            <Link href="/carrito" className="hover:text-store-terracotta" data-testid="cart-link">
              Carrito ({units})
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
