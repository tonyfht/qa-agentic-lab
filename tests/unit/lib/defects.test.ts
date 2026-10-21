import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { activeDefect, DEFECT_IDS, DEFECTS } from '@/lib/qa/defects'
import { resolveInjection } from '@/qa/lib/inject'

describe('QA-029 Inyección de defectos para la demo', () => {
  it('hay un defecto por categoría de triaje: producto, test y entorno', () => {
    expect(DEFECT_IDS).toEqual(['cupon', 'selector', 'caida'])
    expect(DEFECT_IDS.map((d) => DEFECTS[d].category)).toEqual(['producto', 'test', 'entorno'])
  })

  it('sin variable, la tienda se comporta según sus specs', () => {
    expect(activeDefect({})).toBeNull()
    expect(activeDefect({ QA_INJECT_DEFECT: '' })).toBeNull()
  })

  it('en el despliegue nunca se activa, aunque exista la variable', () => {
    expect(activeDefect({ QA_INJECT_DEFECT: 'cupon', VERCEL: '1' })).toBeNull()
  })

  it('con la variable y un defecto del catálogo, se activa; uno desconocido se ignora', () => {
    expect(activeDefect({ QA_INJECT_DEFECT: 'cupon' })).toBe('cupon')
    expect(activeDefect({ QA_INJECT_DEFECT: 'inventado' })).toBeNull()
  })

  it('--inject gana a la variable; "ninguno" es no inyectar', () => {
    expect(resolveInjection('selector', { QA_INJECT_DEFECT: 'cupon' })).toBe('selector')
    expect(resolveInjection(undefined, { QA_INJECT_DEFECT: 'caida' })).toBe('caida')
    expect(resolveInjection('ninguno', {})).toBeNull()
  })

  it('el workflow ofrece los defectos del catálogo y no publica una ejecución con defecto', () => {
    const wf = readFileSync(path.resolve(__dirname, '../../../.github/workflows/pipeline.yml'), 'utf8')
    expect(wf).toContain(`options: [ninguno, ${DEFECT_IDS.join(', ')}]`)
    expect(wf.slice(wf.indexOf('  publish:'))).toContain("(github.event_name != 'workflow_dispatch' || inputs.defecto == 'ninguno')")
  })

  it('la publicación descarta por segunda vez una ejecución con defecto', () => {
    expect(readFileSync(path.resolve(__dirname, '../../../qa/publish.ts'), 'utf8')).toMatch(/if \(run\.injectedDefect\)/)
  })

  it('un defecto desconocido termina con error listando los disponibles', () => {
    expect(() => resolveInjection('inventado', {})).toThrow(/Defecto desconocido «inventado»\. Disponibles: cupon .*selector .*caida/)
  })
})
