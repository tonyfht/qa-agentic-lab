export interface Shipping {
  fullName: string
  address: string
  city: string
  postalCode: string
}

const REQUIRED: [keyof Shipping, string][] = [
  ['fullName', 'El nombre completo es obligatorio'],
  ['address', 'La dirección es obligatoria'],
  ['city', 'La ciudad es obligatoria'],
  ['postalCode', 'El código postal es obligatorio'],
]

/** CHK-001: every field required; Spanish postal code of 5 digits. Errors are keyed by field for the form. */
export function validateShipping(input: unknown): { value?: Shipping; fields: Record<string, string> } {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const value = Object.fromEntries(REQUIRED.map(([k]) => [k, typeof raw[k] === 'string' ? (raw[k] as string).trim() : ''])) as unknown as Shipping
  const fields: Record<string, string> = {}
  for (const [key, message] of REQUIRED) if (!value[key]) fields[key] = message
  if (value.postalCode && !/^\d{5}$/.test(value.postalCode)) fields.postalCode = 'El código postal debe tener 5 dígitos'
  return Object.keys(fields).length ? { fields } : { value, fields }
}
