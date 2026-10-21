type Operation = {
  operationId?: string
  parameters?: { in: string; required?: boolean }[]
  requestBody?: unknown
  responses: Record<string, unknown>
}
type Doc = { paths: Record<string, Record<string, Operation>> }

/**
 * Operations the contract sweep calls on its own (QA-047): GET, no path parameters, no required query parameters
 * and no 401 response (public). A new public read operation is covered without writing a test for it.
 */
export function sweepableOperations(doc: Doc): { operationId: string; path: string }[] {
  return Object.entries(doc.paths).flatMap(([path, methods]) => {
    const op = methods.get
    if (!op?.operationId || path.includes('{')) return []
    if ((op.parameters ?? []).some((p) => p.required)) return []
    if ('401' in op.responses) return []
    return [{ operationId: op.operationId, path }]
  })
}
