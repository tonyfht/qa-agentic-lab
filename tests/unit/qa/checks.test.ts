import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { findBrokenLinks, headingAnchors, mermaidBlocks, slugify } from '@/qa/checks/markdown'
import { validateMermaid } from '@/qa/checks/mermaid'
import { scanSecrets } from '@/qa/checks/secrets'
import { commandExists } from '@/qa/lib/exec'

function tmpRepo(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'qal-chk-'))
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
    writeFileSync(path.join(root, rel), content)
  }
  return root
}

describe('QA-031 Ruta de la visita: enlaces internos', () => {
  const root = tmpRepo({
    'docs/guia.md': '# Guía\n## Ejecútalo tú\n## Paso 1: abre la tienda\n',
    'README.md': '',
  })
  const check = (md: string) => {
    writeFileSync(path.join(root, 'README.md'), md)
    return findBrokenLinks(root, ['README.md'])
  }

  it('acepta enlaces a ficheros, carpetas y anclas existentes', () => {
    expect(check('[a](docs/guia.md) [b](docs/) [c](docs/guia.md#ejecútalo-tú) [d](docs/guia.md#paso-1-abre-la-tienda)')).toEqual([])
  })

  it('señala un fichero inexistente', () => {
    expect(check('[roto](docs/no-existe.md)')).toEqual([
      { file: 'README.md', target: 'docs/no-existe.md', reason: 'el fichero no existe' },
    ])
  })

  it('señala un ancla inexistente', () => {
    expect(check('[x](docs/guia.md#nada)')[0].reason).toMatch(/#nada/)
  })

  it('revisa imágenes HTML y omite enlaces externos y código', () => {
    expect(check('<img src="docs/logo.svg"> [ext](https://example.com) `[no](x.md)`\n```\n[no](y.md)\n```')).toEqual([
      expect.objectContaining({ target: 'docs/logo.svg' }),
    ])
  })

  it('genera las anclas como GitHub', () => {
    expect(slugify('3 · Ejecútalo tú!')).toBe('3--ejecútalo-tú')
    expect(headingAnchors('# A\n# A\n')).toEqual(new Set(['a', 'a-1']))
  })
})

describe('QA-032 Diagramas del laboratorio', () => {
  it('extrae los bloques Mermaid con su posición', () => {
    const root = tmpRepo({ 'README.md': '```mermaid\nflowchart LR\n  A --> B\n```\ntexto\n```mermaid\nflowchart TD\n  X\n```\n' })
    expect(mermaidBlocks(root, ['README.md']).map((b) => [b.file, b.index])).toEqual([
      ['README.md', 1],
      ['README.md', 2],
    ])
  })

  it('acepta un diagrama válido y señala uno con sintaxis rota', async () => {
    const errors = await validateMermaid([
      { file: 'README.md', index: 1, code: 'flowchart LR\n  A[Spec] --> B[Código]\n' },
      { file: 'README.md', index: 2, code: 'flowchart LR\n  A --> \n  B -->> [[\n' },
    ])
    expect(errors).toHaveLength(1)
    expect(errors[0].block.index).toBe(2)
  }, 60_000)
})

describe.skipIf(!commandExists('gitleaks'))('QA-023 Sin secretos en el repositorio', () => {
  // The fake key is assembled at runtime so this test file never contains a detectable secret.
  const fakeKey = ['AKIA', 'Z7VRSQ5TJN2XMPLQ'].join('')

  function gitRepo(files: Record<string, string>): string {
    const root = tmpRepo(files)
    execSync('git init -q && git config core.autocrlf false && git add -A && git -c user.email=t@t -c user.name=t commit -qm init', { cwd: root })
    return root
  }

  it('detecta un secreto introducido y señala el fichero', async () => {
    const root = gitRepo({ 'config.ts': `export const key = '${fakeKey}'\n`, 'gl.toml': '[extend]\nuseDefault = true\n' })
    const result = await scanSecrets(root, { config: 'gl.toml' })
    expect(result.status).toBe('failed')
    expect(result.message).toMatch(/config\.ts/)
  }, 60_000)

  it('respeta una excepción versionada con su motivo', async () => {
    const root = gitRepo({
      'fixtures/fake.ts': `export const key = '${fakeKey}'\n`,
      'gl.toml': "[extend]\nuseDefault = true\n[allowlist]\ndescription = 'Datos ficticios de prueba'\npaths = ['''fixtures/''']\n",
    })
    expect((await scanSecrets(root, { config: 'gl.toml' })).status).toBe('passed')
  }, 60_000)
})

describe('QA-007 Nada se omite en silencio (secretos)', () => {
  it('sin Gitleaks instalado, la comprobación consta como omitida con el motivo', async () => {
    const result = await scanSecrets(process.cwd(), { bin: 'gitleaks-que-no-existe' })
    expect(result.status).toBe('skipped')
    expect(result.message).toMatch(/no está instalado/)
  })
})
