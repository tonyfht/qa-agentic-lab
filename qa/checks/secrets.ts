import { commandExists, runCommand, tail } from '../lib/exec'

export const GITLEAKS_INSTALL_HINT =
  'Gitleaks no está instalado: winget install Gitleaks.Gitleaks (Windows), brew install gitleaks (macOS) ' +
  'o el binario de https://github.com/gitleaks/gitleaks/releases'

export interface SecretsOutcome {
  status: 'passed' | 'failed' | 'skipped'
  message?: string
}

/**
 * Scans the git history for secrets with the versioned config (QA-023). Exceptions live in .gitleaks.toml with
 * their reason. Without Gitleaks the check is skipped with the reason, never reported as passed (QA-007).
 */
export async function scanSecrets(root: string, options: { bin?: string; config?: string } = {}): Promise<SecretsOutcome> {
  const bin = options.bin ?? 'gitleaks'
  if (!commandExists(bin)) return { status: 'skipped', message: GITLEAKS_INSTALL_HINT }
  const config = options.config ?? '.gitleaks.toml'
  const { code, output } = await runCommand(`${bin} git --no-banner --redact --config "${config}" --verbose .`, {
    cwd: root,
    quiet: true,
  })
  if (code === 0) return { status: 'passed' }
  return { status: 'failed', message: tail(output, 40) }
}
