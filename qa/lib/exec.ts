import { spawn, spawnSync, type ChildProcess } from 'node:child_process'

export interface CommandResult {
  code: number
  output: string
}

/**
 * Runs a shell command, streaming its output and keeping the last lines for the report.
 * Commands are always literals built by the orchestrator, never outside input; the shell resolves `npx` (a .cmd on Windows).
 */
export function runCommand(
  command: string,
  options: { cwd: string; env?: Record<string, string | undefined>; quiet?: boolean } = { cwd: process.cwd() },
): Promise<CommandResult> {
  return new Promise((resolve) => {
    // nosemgrep: javascript.lang.security.audit.spawn-shell-true.spawn-shell-true -- comando literal del orquestador, sin entrada externa
    const child = spawn(command, { cwd: options.cwd, env: { ...process.env, ...options.env }, shell: true })
    let output = ''
    const collect = (chunk: Buffer, stream: NodeJS.WriteStream) => {
      const text = chunk.toString()
      output += text
      if (!options.quiet) stream.write(text)
    }
    child.stdout.on('data', (c: Buffer) => collect(c, process.stdout))
    child.stderr.on('data', (c: Buffer) => collect(c, process.stderr))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

export function tail(text: string, lines = 15): string {
  return text.trim().split(/\r?\n/).slice(-lines).join('\n')
}

export function startBackground(command: string, cwd: string, env: Record<string, string | undefined> = {}): ChildProcess {
  // On POSIX the server gets its own process group so killTree can stop the shell and the server together.
  const options = { cwd, env: { ...process.env, ...env }, stdio: 'ignore' as const, detached: process.platform !== 'win32' }
  // nosemgrep: javascript.lang.security.audit.spawn-shell-true.spawn-shell-true -- comando literal del orquestador, sin entrada externa
  return spawn(command, { ...options, shell: true })
}

/** Kills a process and its children (the shell spawns the real server as a child). */
export function killTree(child: ChildProcess) {
  if (!child.pid) return
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  else {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
  }
}

export function commandExists(command: string): boolean {
  const probe = process.platform === 'win32' ? 'where' : 'which'
  return spawnSync(probe, [command], { stdio: 'ignore' }).status === 0
}
