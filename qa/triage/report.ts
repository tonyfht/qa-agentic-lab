import { TRIAGE_LABELS, type TriageCategory } from './classify'
import type { RunResult } from '../results/schema'

const ORDER: TriageCategory[] = ['producto', 'test', 'entorno', 'inestable', 'desconocido']
const NEXT_STEP: Record<TriageCategory, string> = {
  producto: 'Abrir un defecto (borrador abajo) y no tocar el test',
  test: 'Pasarlo al Sanador: reparar el localizador o la espera, nunca la aserción',
  entorno: 'Comprobar el servicio o la herramienta y relanzar; no es un defecto de la tienda',
  inestable: 'Revisarlo con el Detector de inestables: corregirlo o ponerlo en cuarentena con motivo',
  desconocido: 'Revisión del agente de Triaje',
}

const firstLine = (text = '') => text.split('\n').find((l) => l.trim())?.trim().slice(0, 200) ?? ''

/** Markdown triage of a run: a table per category and one defect issue draft per product failure (QA-052). */
export function triageMarkdown(run: RunResult, evidenceUrl: string): string {
  const triaged = run.tests.filter((t) => t.triage)
  const lines = [`## Triaje de la ejecución ${run.runId}`, '']
  if (run.injectedDefect) lines.push(`> Ejecución de demostración con el defecto **${run.injectedDefect}** inyectado.`, '')
  if (triaged.length === 0) return [...lines, 'Ningún test ha fallado ni ha sido inestable.', ''].join('\n')

  lines.push('| Categoría | Tests | Siguiente paso |', '|---|---|---|')
  for (const c of ORDER) {
    const n = triaged.filter((t) => t.triage!.category === c).length
    if (n) lines.push(`| ${TRIAGE_LABELS[c]} | ${n} | ${NEXT_STEP[c]} |`)
  }
  lines.push('', '| Test | Requisitos | Categoría | Motivo |', '|---|---|---|---|')
  for (const t of triaged) {
    lines.push(`| ${t.title.replaceAll('|', '/')} | ${t.requirements.join(', ') || '—'} | ${TRIAGE_LABELS[t.triage!.category]} | ${t.triage!.reason} |`)
  }

  const defects = triaged.filter((t) => t.triage!.category === 'producto')
  if (defects.length) {
    lines.push('', '### Borradores de defecto', '')
    for (const t of defects) {
      lines.push(
        `#### [Defecto] ${t.requirements[0] ?? 'Sin requisito'}: ${t.title}`,
        '',
        `- **Requisito:** ${t.requirements.join(', ') || 'sin trazar'}`,
        `- **Escenario:** \`${t.file}\``,
        `- **Qué pasa:** ${firstLine(t.message)}`,
        `- **Evidencia:** ${evidenceUrl}`,
        `- **Commit:** \`${run.git.sha.slice(0, 7)}\` (${run.git.branch})`,
        '',
      )
    }
  }
  return lines.join('\n') + '\n'
}
