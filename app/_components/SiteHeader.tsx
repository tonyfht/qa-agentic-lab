import Link from 'next/link'
import { currentAccount } from '@/lib/account/session'
import { getCart } from '@/lib/cart/repository'
import { readCartId } from '@/lib/cart/session'
import { listCategories } from '@/lib/catalog/repository'
import { BagIcon, LockIcon, ReturnIcon, SearchIcon, TruckIcon, UserIcon } from './icons'
import { LogoutButton } from './LogoutButton'

// SHOP-001. The cart link keeps "Carrito (N)" as its accessible text: the badge shows N, the brackets are for screen
// readers (and for the tests that read the header).
export async function SiteHeader() {
  const [{ units }, account, categories] = await Promise.all([getCart(await readCartId()), currentAccount(), listCategories()])
  return (
    <header className="border-b border-store-ink/10 bg-white">
      <div aria-label="Ventajas" role="note" className="bg-store-terracotta-dark text-store-cream">
        <ul className="mx-auto flex max-w-6xl items-center justify-center gap-6 overflow-x-auto px-4 py-2 text-xs font-medium whitespace-nowrap">
          <li className="flex items-center gap-1.5">
            <TruckIcon className="size-4" /> Envío gratis desde 50 €
          </li>
          <li className="hidden items-center gap-1.5 sm:flex">
            <ReturnIcon className="size-4" /> Devolución en 30 días
          </li>
          <li className="hidden items-center gap-1.5 md:flex">
            <LockIcon className="size-4" /> Pago simulado: no se cobra nada
          </li>
        </ul>
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
        <Link href="/" className="font-serif text-xl font-semibold whitespace-nowrap text-store-ink sm:text-2xl">
          La Tienda <span className="text-store-terracotta">en Casa</span>
        </Link>

        <form role="search" action="/catalogo" method="get" className="order-last flex w-full items-center md:order-none md:flex-1">
          <label htmlFor="header-search" className="sr-only">
            Buscar en la tienda
          </label>
          <input
            id="header-search"
            type="search"
            name="q"
            placeholder="Busca mantas, tazas, lámparas…"
            className="w-full rounded-l-full border border-r-0 border-store-ink/20 bg-store-cream px-5 py-2.5 text-sm placeholder:text-store-muted"
          />
          <button type="submit" className="rounded-r-full border border-store-terracotta bg-store-terracotta px-4 py-2.5 text-white hover:bg-store-terracotta-dark">
            <SearchIcon />
            <span className="sr-only">Buscar en la tienda</span>
          </button>
        </form>

        <nav aria-label="Principal" className="ml-auto">
          <ul className="flex items-center gap-4 text-sm font-medium sm:gap-5">
            <li className="hidden lg:block">
              <Link href="/catalogo" className="hover:text-store-terracotta">
                Catálogo
              </Link>
            </li>
            {account ? (
              <>
                <li data-testid="greeting" className="hidden text-store-muted sm:block">
                  Hola, {account.name}
                </li>
                <li>
                  <Link href="/cuenta/pedidos" className="flex items-center gap-1.5 hover:text-store-terracotta">
                    <UserIcon /> <span className="sr-only sm:not-sr-only">Mis pedidos</span>
                  </Link>
                </li>
                <li>
                  <LogoutButton />
                </li>
              </>
            ) : (
              <li>
                <Link href="/cuenta/entrar" className="flex items-center gap-1.5 hover:text-store-terracotta">
                  <UserIcon /> <span className="sr-only sm:not-sr-only">Entrar</span>
                </Link>
              </li>
            )}
            <li>
              <Link href="/carrito" className="flex items-center gap-1.5 hover:text-store-terracotta" data-testid="cart-link">
                <span className="relative">
                  <BagIcon className="size-6" />
                </span>
                <span>
                  <span className="sr-only sm:not-sr-only">Carrito </span>
                  <span className="sr-only">(</span>
                  <span className="rounded-full bg-store-terracotta px-1.5 py-0.5 text-xs font-bold text-white">{units}</span>
                  <span className="sr-only">)</span>
                </span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <nav aria-label="Departamentos" className="border-t border-store-ink/10">
        <ul className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-2.5 text-sm whitespace-nowrap text-store-muted">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/catalogo?category=${c.slug}`} prefetch={false} className="hover:text-store-terracotta">
                {c.name}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/catalogo?sort=rating" prefetch={false} className="hover:text-store-terracotta">
              Mejor valorados
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
