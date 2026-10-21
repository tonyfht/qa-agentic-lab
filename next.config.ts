import path from 'node:path'
import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

// SEC-001. 'unsafe-inline' is needed by the inline scripts Next.js emits; a nonce-based CSP would remove it at the
// cost of making every page dynamic (accepted ZAP alert, see compliance/zap-aceptadas.json). 'unsafe-eval' only in dev
// (hot reload).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

export const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Cross-origin isolation: the store loads nothing from other origins, so it can refuse to share and to be shared.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
]

const nextConfig: NextConfig = {
  // Explicit root: the repo also contains tooling folders that Turbopack must not treat as workspaces.
  turbopack: { root: path.resolve(__dirname) },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
