const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * SEC-006: a write to the API is rejected when the browser says it comes from another site.
 * `Sec-Fetch-Site` is authoritative when present; otherwise the `Origin` host must match the request host.
 * Requests without either header (API clients, curl, tests) are not browser-driven cross-site requests.
 */
export function isCrossSiteWrite(method: string, origin: string | null, host: string | null, fetchSite: string | null): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return false
  if (fetchSite) return fetchSite === 'cross-site'
  if (!origin) return false
  if (origin === 'null') return true
  try {
    return new URL(origin).host !== host
  } catch {
    return true
  }
}
