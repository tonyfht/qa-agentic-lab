import type { Metadata } from 'next'
import { PHOTO_CREDITS } from '@/lib/catalog/images'

export const metadata: Metadata = { title: 'Créditos de las fotos' }

// SHOP-003: every photo with its author, source and licence, from the same file the store uses for the alt texts.
export default function CreditsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-3 text-4xl font-semibold">Créditos de las fotos</h1>
      <p className="mb-6 text-store-muted">
        Las fotos de La Tienda en Casa son de fotógrafos de Unsplash, con la licencia de Unsplash, que permite usarlas sin
        coste. Se descargaron una vez y las sirve la propia tienda. Gracias a quienes las hicieron.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-store-ink/10 bg-white">
        <table className="w-full text-left text-sm" aria-label="Fotos y sus autores">
          <thead>
            <tr className="border-b border-store-ink/10">
              <th className="p-3">Foto</th>
              <th className="p-3">Autor</th>
              <th className="p-3">Licencia</th>
            </tr>
          </thead>
          <tbody>
            {PHOTO_CREDITS.map((c) => (
              <tr key={c.file} className="border-b border-store-ink/5 last:border-0">
                <td className="p-3">
                  <a href={c.source} className="underline hover:text-store-terracotta-dark">
                    {c.alt}
                  </a>
                </td>
                <td className="p-3">
                  <a href={c.authorUrl} className="underline hover:text-store-terracotta-dark">
                    {c.author}
                  </a>
                </td>
                <td className="p-3">{c.license}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
