export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-store-terracotta">Artículos para el hogar</p>
      <h1 className="text-4xl font-bold sm:text-5xl">La Tienda en Casa</h1>
      <p className="text-lg text-store-muted">
        Cocina, textil y decoración para tu casa. Esta tienda es la aplicación de demostración de QA Agentic Lab:
        existe para enseñar cómo se prueba un producto con ayuda de la IA.
      </p>
      <p
        role="status"
        className="w-fit rounded-full border border-store-terracotta/30 bg-white px-4 py-2 text-sm text-store-ink"
      >
        🚧 En construcción: el catálogo llega en el siguiente cambio.
      </p>
    </main>
  )
}
