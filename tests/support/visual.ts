import path from 'node:path'

// Approved screenshots live outside the generated .features-gen folder, one per OS (EXP-003).
export const VISUAL_DIR = path.join('tests', 'visual')

export function visualBaseline(name: string, platform: string = process.platform): string {
  return path.join(VISUAL_DIR, `${name}-${platform}.png`)
}
