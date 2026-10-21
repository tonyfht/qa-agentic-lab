export interface FormResult {
  ok: boolean
  status: number
  data: { error?: string; fields?: Record<string, string>; number?: string }
}

export async function postJson(url: string, body: unknown): Promise<FormResult> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) }
}
