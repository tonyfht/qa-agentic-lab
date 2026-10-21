import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { SiteFooter } from './_components/SiteFooter'
import { SiteHeader } from './_components/SiteHeader'
import './globals.css'

// next/font downloads the fonts at build time and the store serves them: no request to Google from the browser (CMP-003).
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter', display: 'swap' })
const fraunces = Fraunces({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-fraunces', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'La Tienda en Casa', template: '%s · La Tienda en Casa' },
  description: 'Artículos para el hogar. Tienda de demostración de QA Agentic Lab.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
