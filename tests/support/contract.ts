import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020'
import addFormats from 'ajv-formats'

type OpenApiDoc = { paths: Record<string, Record<string, { operationId?: string; responses: Record<string, unknown> }>> }

const escape = (s: string) => s.replace(/~/g, '~0').replace(/\//g, '~1')

/**
 * Validates real API responses against the published OpenAPI document (CAT-008). Every API step calls it, so the
 * contract is checked in every scenario instead of in a separate test that could be forgotten.
 */
export class ContractChecker {
  private readonly ajv = new Ajv2020({ strict: false, allErrors: true })
  private readonly cache = new Map<string, ValidateFunction>()
  private readonly locations = new Map<string, { path: string; method: string }>()

  constructor(doc: OpenApiDoc) {
    addFormats(this.ajv)
    this.ajv.addSchema(doc as object, 'openapi')
    for (const [path, methods] of Object.entries(doc.paths))
      for (const [method, op] of Object.entries(methods)) if (op.operationId) this.locations.set(op.operationId, { path, method })
  }

  validate(operationId: string, status: number, body: unknown): string[] {
    const location = this.locations.get(operationId)
    if (!location) return [`La operación ${operationId} no está en el contrato publicado`]
    const key = `${operationId}:${status}`
    let validate = this.cache.get(key)
    if (!validate) {
      const ref = `openapi#/paths/${escape(location.path)}/${location.method}/responses/${status}/content/${escape('application/json')}/schema`
      try {
        validate = this.ajv.compile({ $ref: ref })
      } catch {
        return [`El contrato no declara la respuesta ${status} de ${operationId}`]
      }
      this.cache.set(key, validate)
    }
    return validate(body) ? [] : (validate.errors ?? []).map((e) => `${e.instancePath || '(raíz)'} ${e.message}`)
  }
}
