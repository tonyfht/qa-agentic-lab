import Link from 'next/link'
import { currentAccount } from '@/lib/account/session'
import { getCart } from '@/lib/cart/repository'
import { readCartId } from '@/lib/cart/session'
import { LogoutButton } from './LogoutButton'

export async function SiteHeader() {
  const [{ units }, account] = await Promise.all([getCart(await readCartId()), currentAccount()])
  return (
    <header className="border-b border-store-ink/10 bg-white/70">
      <nav aria-label="Principal" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-store-ink">
          La Tienda en Casa
        </Link>
        <ul className="flex flex-wrap items-center gap-5 text-sm font-medium">
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
          {account ? (
            <>
              <li data-testid="greeting">Hola, {account.name}</li>
              <li>
                <Link href="/cuenta/pedidos" className="hover:text-store-terracotta">
                  Mis pedidos
                </Link>
              </li>
              <li>
                <LogoutButton />
              </li>
            </>
          ) : (
            <li>
              <Link href="/cuenta/entrar" className="hover:text-store-terracotta">
                Entrar
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  )
}
