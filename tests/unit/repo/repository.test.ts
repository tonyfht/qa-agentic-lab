import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../../..')
const read = (f: string) => readFileSync(path.join(root, f), 'utf8')

describe('QA-022 Plantillas de contribución', () => {
  it('la plantilla de PR pide el ID del cambio, la casilla de mantenimiento y la lista de guía e informe', () => {
    const pr = read('.github/pull_request_template.md')
    expect(pr).toContain('Implementa: QAL-XXX')
    expect(pr).toMatch(/- \[ \] Es mantenimiento/)
    expect(pr).toContain('ruta de la visita')
  })

  it('la plantilla de defecto pide pasos, esperado, obtenido, evidencia y requisito, todos obligatorios', () => {
    const bug = read('.github/ISSUE_TEMPLATE/defecto.yml')
    for (const id of ['requisito', 'pasos', 'esperado', 'obtenido', 'evidencia']) expect(bug).toContain(`id: ${id}`)
    expect(bug.match(/required: true/g)).toHaveLength(5)
  })

  it('existe la plantilla de requisito nuevo', () => {
    expect(existsSync(path.join(root, '.github/ISSUE_TEMPLATE/requisito.yml'))).toBe(true)
  })
})

describe('QA-034 La guía crece con cada cambio', () => {
  it('la plantilla de PR obliga a declarar el impacto en la guía o que no hay cambios visibles', () => {
    const pr = read('.github/pull_request_template.md')
    expect(pr).toMatch(/- \[ \] He añadido o actualizado el paso de la ruta de la visita/)
    expect(pr).toMatch(/- \[ \] Sin cambios visibles/)
  })
})

describe('QA-024 Dependencias vigiladas', () => {
  it('Dependabot revisa npm y GitHub Actions cada semana', () => {
    const cfg = read('.github/dependabot.yml')
    expect(cfg).toMatch(/package-ecosystem: npm[\s\S]*interval: weekly/)
    expect(cfg).toMatch(/package-ecosystem: github-actions[\s\S]*interval: weekly/)
  })
})

describe('QA-020 Main protegida', () => {
  it('los checks requeridos coinciden con los nombres de los jobs del pipeline', () => {
    const script = read('scripts/setup-branch-protection.mjs')
    const workflows = read('.github/workflows/pipeline.yml') + read('.github/workflows/governance.yml')
    const checks = /REQUIRED_CHECKS = \[([^\]]+)\]/.exec(script)![1].match(/'([^']+)'/g)!.map((s) => s.slice(1, -1))
    for (const check of checks) expect(workflows).toContain(`name: ${check}`)
  })

  it('CODEOWNERS asigna todo el repositorio a su propietario', () => {
    expect(read('.github/CODEOWNERS')).toMatch(/^\* @tonyfht$/m)
  })
})

describe('QA-003 CI ejecuta las mismas etapas que local', () => {
  it('cada job de etapa solo llama a npm run qa -- --stage <id>', () => {
    const wf = read('.github/workflows/pipeline.yml')
    for (const stage of ['static', 'build', 'e2e', 'performance', 'report']) expect(wf).toContain(`run: npm run qa -- --stage ${stage}`)
  })
})

describe('QA-004 Disparadores del pipeline', () => {
  it('PR a main, push a main, lanzamiento manual y ejecución programada diaria', () => {
    const wf = read('.github/workflows/pipeline.yml')
    expect(wf).toMatch(/pull_request:\s+branches: \[main\]/)
    expect(wf).toMatch(/push:\s+branches: \[main\]/)
    expect(wf).toContain('workflow_dispatch:')
    expect(wf).toMatch(/schedule:\s+- cron: '\d+ \d+ \* \* \*'/)
  })
})

describe('QA-013 Solo main publica', () => {
  it('el job de publicación solo corre en main y fuera de PR, de uno en uno', () => {
    const wf = read('.github/workflows/pipeline.yml')
    const publish = wf.slice(wf.indexOf('  publish:'))
    expect(publish).toContain("github.ref == 'refs/heads/main'")
    expect(publish).toContain("github.event_name != 'pull_request'")
    expect(publish).toMatch(/group: pages-publish\s+cancel-in-progress: false/)
  })
})

describe('QA-030 Identidad y propósito a primera vista', () => {
  it('el README abre con el logo y un párrafo de propósito', () => {
    const lines = read('README.md').split('\n')
    expect(lines.slice(0, 3).join('\n')).toContain('<img src="docs/assets/logo.svg" alt="QA Agentic Lab"')
    expect(read('README.md')).toMatch(/\*\*QA Agentic Lab\*\* es un laboratorio abierto/)
  })

  it('el logo adapta sus colores al tema oscuro', () => {
    expect(read('docs/assets/logo.svg')).toContain('@media (prefers-color-scheme: dark)')
  })
})

describe('QA-031 Ruta de la visita', () => {
  it('es una lista numerada en la que cada paso dice qué abrir y qué se verá', () => {
    const readme = read('README.md')
    const route = readme.slice(readme.indexOf('## Ruta de la visita'), readme.indexOf('## Cómo funciona'))
    const steps = route.match(/^\d+\. \*\*.+/gm) ?? []
    expect(steps.length).toBeGreaterThanOrEqual(6)
    const paragraphs = route.split(/\n(?=\d+\. )/).slice(1)
    for (const step of paragraphs) expect(step).toMatch(/Ver[aá]s/)
  })
})

describe('QA-032 Diagramas del laboratorio', () => {
  it('el diagrama del pipeline tiene las etapas reales en el mismo orden', async () => {
    const { registry } = await import('@/qa/stages/registry')
    const diagram = read('README.md').split('```mermaid')[2]
    const positions = registry.filter((s) => !s.standalone).map((s) => diagram.indexOf(s.name))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })
})

describe('QA-033 Ejecútalo tú', () => {
  it('indica requisitos previos y los comandos de la tienda, del pipeline y del informe', () => {
    const readme = read('README.md')
    const section = readme.slice(readme.indexOf('## Ejecútalo tú'))
    expect(section).toContain('Node.js 24')
    for (const cmd of ['npm ci', 'npm run dev', 'npm run qa', 'npm run report']) expect(section).toContain(cmd)
    expect(section).toContain('Run workflow')
  })

  it('package.json exige Node 24 de forma estricta', () => {
    expect(JSON.parse(read('package.json')).engines.node).toBe('>=24')
    expect(read('.npmrc')).toContain('engine-strict=true')
  })
})

describe('QA-046 Ejecución de agentes en GitHub bajo demanda', () => {
  const wf = read('.github/workflows/agents.yml')

  it('se lanza a mano eligiendo uno de los agentes del laboratorio y un cambio', () => {
    expect(wf).toContain('workflow_dispatch:')
    for (const a of ['qa-revisor-specs', 'qa-analista', 'qa-disenador', 'qa-automatizador']) expect(wf).toContain(a)
    expect(wf).toMatch(/cambio:[\s\S]*required: true/)
  })

  it('sin clave se omite con el motivo explícito y no ejecuta la IA', () => {
    expect(wf).toContain("HAS_KEY: ${{ secrets.ANTHROPIC_API_KEY != '' }}")
    expect(wf).toContain('omitido: falta ANTHROPIC_API_KEY')
    const actionStep = wf.slice(wf.indexOf('anthropics/claude-code-action'))
    expect(wf.slice(wf.lastIndexOf('- uses', wf.indexOf('anthropics/claude-code-action')), wf.indexOf('anthropics/claude-code-action') + 200)).toContain(
      "if: steps.key.outputs.has_key == 'true'",
    )
    expect(actionStep).toContain('abre un Pull Request')
  })
})

describe('EXP-003 Regresión visual con referencias aprobadas', () => {
  it('las referencias se generan en Linux a mano y salen como artefacto, no como commit directo', () => {
    const wf = read('.github/workflows/visual-baselines.yml')
    expect(wf).toContain('workflow_dispatch:')
    expect(wf).toContain('runs-on: ubuntu-latest')
    expect(wf).toContain('--update-snapshots')
    expect(wf).toContain('tests/visual/*-linux.png')
    expect(wf).toContain('contents: read')
  })

  it('Playwright guarda las referencias por sistema fuera de la carpeta generada', () => {
    expect(read('playwright.config.ts')).toContain("snapshotPathTemplate: 'tests/visual/{arg}-{platform}{ext}'")
  })
})
