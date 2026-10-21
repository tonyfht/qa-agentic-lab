import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/account/password'
import { safeNext, validateRegistration } from '@/lib/account/validation'
import { charge, expiryProblem, luhnValid } from '@/lib/checkout/payment'
import { validateShipping } from '@/lib/checkout/shipping'
import { orderNumber } from '@/lib/orders/place'

const now = new Date('2026-10-21T12:00:00Z')
const card = (cardNumber: string, expiry = '12/30', cvc = '123') => charge({ cardNumber, expiry, cvc }, now)

describe('ACC-001 Registro de cliente', () => {
  it('acepta un registro correcto y normaliza el correo', () => {
    expect(validateRegistration({ name: ' Ana ', email: ' ANA@Ejemplo.test ', password: 'Casa2026' }).value).toEqual({
      name: 'Ana',
      email: 'ana@ejemplo.test',
      password: 'Casa2026',
    })
  })

  it.each([
    ['casacasa', 'sin número'],
    ['12345678', 'sin letra'],
    ['Casa1', 'corta'],
  ])('rechaza la contraseña "%s" (%s)', (password) => {
    expect(validateRegistration({ name: 'Ana', email: 'ana@ejemplo.test', password }).fields.password).toBe(
      'La contraseña necesita al menos 8 caracteres, una letra y un número',
    )
  })

  it('señala cada campo inválido por separado', () => {
    expect(Object.keys(validateRegistration({ email: 'no-es-correo' }).fields)).toEqual(['name', 'email', 'password'])
  })
})

describe('ACC-003 Sesión segura', () => {
  it('guarda un hash con sal: la misma contraseña da hashes distintos y ambos verifican', () => {
    const a = hashPassword('Casa2026')
    const b = hashPassword('Casa2026')
    expect(a).not.toBe(b)
    expect(a).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{64}$/)
    expect(verifyPassword('Casa2026', a)).toBe(true)
    expect(verifyPassword('Casa2027', a)).toBe(false)
    expect(verifyPassword('Casa2026', 'texto-sin-formato')).toBe(false)
  })
})

describe('ACC-004 Zonas que exigen sesión', () => {
  it.each([
    ['/checkout', '/checkout'],
    ['/cuenta/pedidos/TC-000001', '/cuenta/pedidos/TC-000001'],
    ['https://otro-sitio.test', '/cuenta/pedidos'],
    ['//otro-sitio.test', '/cuenta/pedidos'],
    ['/\\otro-sitio.test', '/cuenta/pedidos'],
    [undefined, '/cuenta/pedidos'],
  ])('volver a "%s" → %s (nunca fuera de la tienda)', (next, expected) => {
    expect(safeNext(next)).toBe(expected)
  })
})

describe('CHK-001 Datos de envío', () => {
  const ok = { fullName: 'Ana García', address: 'Calle Mayor 1', city: 'Madrid', postalCode: '28013' }

  it('acepta datos correctos', () => {
    expect(validateShipping(ok).value).toEqual(ok)
  })

  it.each([
    ['2801', 'El código postal debe tener 5 dígitos'],
    ['280133', 'El código postal debe tener 5 dígitos'],
    ['2801A', 'El código postal debe tener 5 dígitos'],
    ['', 'El código postal es obligatorio'],
  ])('código postal "%s" → %s', (postalCode, message) => {
    expect(validateShipping({ ...ok, postalCode }).fields.postalCode).toBe(message)
  })

  it('cada campo vacío tiene su mensaje', () => {
    expect(validateShipping({}).fields).toEqual({
      fullName: 'El nombre completo es obligatorio',
      address: 'La dirección es obligatoria',
      city: 'La ciudad es obligatoria',
      postalCode: 'El código postal es obligatorio',
    })
  })
})

describe('CHK-002 Pago simulado', () => {
  it('el algoritmo de Luhn distingue las tarjetas de prueba de un número mal escrito', () => {
    expect(luhnValid('4242424242424242')).toBe(true)
    expect(luhnValid('4242424242424241')).toBe(false)
  })

  it.each([
    ['4242 4242 4242 4242', { ok: true, brand: 'test', last4: '4242' }],
    ['5555555555554444', { ok: true, brand: 'test', last4: '4444' }],
    ['4000 0000 0000 0002', { ok: false, status: 402, message: 'Tarjeta rechazada por el banco' }],
    ['4000000000009995', { ok: false, status: 402, message: 'Fondos insuficientes' }],
    ['4242 4242 4242 4241', { ok: false, status: 400, message: 'El número de tarjeta no es válido' }],
    ['4242', { ok: false, status: 400, message: 'El número de tarjeta no es válido' }],
  ])('tarjeta %s', (number, expected) => {
    expect(card(number)).toMatchObject(expected)
  })

  it('caducidad: el mes actual vale, el anterior no, y el formato se comprueba', () => {
    expect(expiryProblem('10/26', now)).toBeNull()
    expect(expiryProblem('09/26', now)).toBe(402)
    expect(expiryProblem('13/30', now)).toBe(400)
    expect(card('4242424242424242', '09/26')).toMatchObject({ status: 402, message: 'La tarjeta ha caducado' })
  })

  it('el CVC debe tener 3 dígitos', () => {
    expect(card('4242424242424242', '12/30', '12')).toMatchObject({ status: 400, message: 'El CVC debe tener 3 dígitos' })
  })
})

describe('CHK-005 La tarjeta no se guarda', () => {
  it('el resultado aprobado solo lleva los 4 últimos dígitos y ningún mensaje repite el número', () => {
    expect(JSON.stringify(card('4242424242424242'))).not.toContain('42424242')
    for (const n of ['4000000000000002', '4000000000009995', '4242424242424241']) {
      expect(JSON.stringify(card(n))).not.toContain(n)
    }
  })
})

describe('CHK-004 Pedido confirmado', () => {
  it('numera los pedidos como TC- y seis cifras', () => {
    expect(orderNumber(1)).toBe('TC-000001')
    expect(orderNumber(123456)).toBe('TC-123456')
  })
})
