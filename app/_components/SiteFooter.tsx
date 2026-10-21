import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-store-ink/10 py-6 text-center text-sm text-store-muted">
      La Tienda en Casa · tienda de demostración de QA Agentic Lab ·{' '}
      <Link href="/privacidad" className="underline">
        Privacidad y cookies
      </Link>
    </footer>
  )
}
