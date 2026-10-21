import { NextResponse, type NextRequest } from 'next/server'
import type { ApiError } from '@/lib/api/schemas'
import { isCrossSiteWrite } from '@/lib/security/origin'

// Defence in depth against CSRF on top of SameSite=Lax cookies (SEC-006): the API refuses writes from other sites.
export function proxy(request: NextRequest) {
  const h = request.headers
  if (isCrossSiteWrite(request.method, h.get('origin'), h.get('host'), h.get('sec-fetch-site'))) {
    const body: ApiError = { error: 'Petición rechazada: llega desde otro sitio' }
    return NextResponse.json(body, { status: 403 })
  }
  return NextResponse.next()
}

export const config = { matcher: '/api/:path*' }
