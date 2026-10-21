import { describe, expect, it } from 'vitest'
import { isCrossSiteWrite } from '@/lib/security/origin'

describe('SEC-006 Escrituras desde otro sitio rechazadas', () => {
  it('las lecturas nunca se bloquean, vengan de donde vengan', () => {
    expect(isCrossSiteWrite('GET', 'https://atacante.example', 'localhost:3400', 'cross-site')).toBe(false)
    expect(isCrossSiteWrite('head', null, 'localhost:3400', 'cross-site')).toBe(false)
  })

  it('Sec-Fetch-Site manda: cross-site se rechaza; same-origin y same-site pasan', () => {
    expect(isCrossSiteWrite('POST', null, 'localhost:3400', 'cross-site')).toBe(true)
    expect(isCrossSiteWrite('POST', 'http://localhost:3400', 'localhost:3400', 'same-origin')).toBe(false)
    expect(isCrossSiteWrite('DELETE', null, 'localhost:3400', 'same-site')).toBe(false)
  })

  it('sin Sec-Fetch-Site se compara el host de Origin', () => {
    expect(isCrossSiteWrite('POST', 'https://atacante.example', 'localhost:3400', null)).toBe(true)
    expect(isCrossSiteWrite('PATCH', 'http://localhost:3400', 'localhost:3400', null)).toBe(false)
    expect(isCrossSiteWrite('POST', 'null', 'localhost:3400', null)).toBe(true)
    expect(isCrossSiteWrite('POST', 'no es una url', 'localhost:3400', null)).toBe(true)
  })

  it('sin cabeceras de navegador (clientes de API, curl) no es una petición cruzada', () => {
    expect(isCrossSiteWrite('POST', null, 'localhost:3400', null)).toBe(false)
  })
})
