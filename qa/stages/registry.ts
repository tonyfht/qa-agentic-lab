import { buildStage } from './build'
import { e2eStage } from './e2e'
import { governanceStage } from './governance'
import { createReportStage } from './report'
import { staticStage } from './static'
import type { StageDefinition } from './types'

// Order here is the order of `npm run qa` and of the pipeline diagram in the README.
export const registry: StageDefinition[] = [
  staticStage,
  buildStage,
  e2eStage,
  createReportStage(() => registry),
  governanceStage,
]
