import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacidad y cookies' }

const COOKIES = [
  { name: 'session', purpose: 'Mantener la sesión iniciada en tu cuenta', duration: '7 días o hasta que cierres la sesión' },
  { name: 'cart_id', purpose: 'Recordar tu carrito mientras compras', duration: 'Hasta que cierres el navegador' },
]

// CMP-003: only strictly necessary cookies and no third parties.
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-4 text-3xl font-bold">Privacidad y cookies</h1>
      <p className="mb-4">
        La Tienda en Casa es una tienda de demostración. No usa analítica, publicidad ni servicios de terceros: tu
        navegador solo habla con esta tienda.
      </p>
      <h2 className="mb-2 text-xl font-bold">Cookies</h2>
      <p className="mb-4">Solo usamos estas dos cookies, estrictamente necesarias para que la tienda funcione:</p>
      <table className="w-full border-collapse rounded-2xl bg-white text-left text-sm" aria-label="Cookies que usa la tienda">
        <thead>
          <tr>
            <th className="border-b p-3">Nombre</th>
            <th className="border-b p-3">Finalidad</th>
            <th className="border-b p-3">Duración</th>
            <th className="border-b p-3">Tipo</th>
          </tr>
        </thead>
        <tbody>
          {COOKIES.map((c) => (
            <tr key={c.name}>
              <td className="border-b p-3">
                <code>{c.name}</code>
              </td>
              <td className="border-b p-3">{c.purpose}</td>
              <td className="border-b p-3">{c.duration}</td>
              <td className="border-b p-3">Necesaria</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mb-2 mt-6 text-xl font-bold">Tus datos</h2>
      <p>
        Guardamos tu nombre, tu correo y tus pedidos. Las contraseñas se guardan cifradas con un hash y de las tarjetas
        solo los cuatro últimos dígitos. Usa datos ficticios: es una demostración.
      </p>
    </main>
  )
}
