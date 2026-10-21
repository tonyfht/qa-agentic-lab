import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Explicit root: the repo also contains tooling folders that Turbopack must not treat as workspaces.
  turbopack: { root: path.resolve(__dirname) },
}

export default nextConfig
