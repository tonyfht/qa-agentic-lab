import path from 'node:path'
import { createRequire } from 'node:module'
import { chromium } from '@playwright/test'
import type { MermaidBlock } from './markdown'

// Resolved from the repo root: works the same under tsx, Vitest (ESM) and Playwright (CJS).
const require = createRequire(path.join(process.cwd(), 'package.json'))

export interface MermaidError {
  block: MermaidBlock
  message: string
}

/**
 * Validates diagram syntax with mermaid.parse() inside Chromium (QA-032). Mermaid needs a DOM, and the E2E
 * browser is already installed, so no extra tool is required.
 */
export async function validateMermaid(blocks: MermaidBlock[]): Promise<MermaidError[]> {
  if (blocks.length === 0) return []
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent('<!doctype html><html><body></body></html>')
    await page.addScriptTag({ path: require.resolve('mermaid/dist/mermaid.min.js') })
    const messages = await page.evaluate(async (codes) => {
      const m = (window as unknown as { mermaid: { parse: (c: string) => Promise<unknown> } }).mermaid
      const out: (string | null)[] = []
      for (const code of codes) {
        try {
          await m.parse(code)
          out.push(null)
        } catch (e) {
          out.push(String((e as Error).message ?? e))
        }
      }
      return out
    }, blocks.map((b) => b.code))
    return blocks.flatMap((block, i) => (messages[i] ? [{ block, message: messages[i]! }] : []))
  } finally {
    await browser.close()
  }
}
