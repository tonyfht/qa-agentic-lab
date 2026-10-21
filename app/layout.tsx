import type { Metadata } from 'next'
import { SiteFooter } from './_components/SiteFooter'
import { SiteHeader } from './_components/SiteHeader'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'La Tienda en Casa', template: '%s · La Tienda en Casa' },
  description: 'Artículos para el hogar. Tienda de demostración de QA Agentic Lab.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
