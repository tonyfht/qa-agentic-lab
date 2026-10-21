import Link from 'next/link'
import { categories } from '@/lib/db/seed-data'

const REPORT_URL = 'https://tonyfht.github.io/qa-agentic-lab/'
const REPO_URL = 'https://github.com/tonyfht/qa-agentic-lab'

// SHOP-004. Static content: categories come from the seed so the footer does not query the database on every page.
export function SiteFooter() {
  return (
    <footer className="mt-20 bg-store-ink text-store-cream/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="flex flex-col gap-3">
          <p className="font-serif text-xl font-semibold text-store-cream">
            La Tienda <span className="text-[#e7a27f]">en Casa</span>
          </p>
          <p className="text-sm">Cocina, textil y decoración para tu casa. Tienda de demostración de QA Agentic Lab: aquí no se cobra nada.</p>
        </div>
        <nav aria-labelledby="footer-shop" className="text-sm">
          <h2 id="footer-shop" className="mb-3 font-sans text-sm font-semibold text-store-cream">
            Tienda
          </h2>
          <ul className="flex flex-col gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/catalogo?category=${c.slug}`} prefetch={false} className="hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-sm">
          <h2 className="mb-3 font-sans text-sm font-semibold text-store-cream">Ayuda</h2>
          <ul className="flex flex-col gap-2">
            <li>Envío gratis desde 50 €; si no, 4,95 €</li>
            <li>Entrega en 24-48 h laborables</li>
            <li>Devolución gratuita en 30 días</li>
            <li>Pago simulado con tarjetas de prueba</li>
          </ul>
        </div>
        <nav aria-labelledby="footer-lab" className="text-sm">
          <h2 id="footer-lab" className="mb-3 font-sans text-sm font-semibold text-store-cream">
            Laboratorio
          </h2>
          <ul className="flex flex-col gap-2">
            <li>
              <a href={REPORT_URL} className="hover:text-white">
                Informe de calidad
              </a>
            </li>
            <li>
              <a href={REPO_URL} className="hover:text-white">
                Código en GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-store-cream/15">
        <p className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-4 py-5 text-xs">
          <span>La Tienda en Casa · tienda de demostración de QA Agentic Lab</span>
          <Link href="/privacidad" className="underline hover:text-white">
            Privacidad y cookies
          </Link>
          <Link href="/creditos" className="underline hover:text-white">
            Créditos de las fotos
          </Link>
        </p>
      </div>
    </footer>
  )
}
