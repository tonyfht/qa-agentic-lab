import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'La Tienda en Casa',
  description: 'Artículos para el hogar. Tienda de demostración de QA Agentic Lab.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
