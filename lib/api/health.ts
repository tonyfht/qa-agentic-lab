import { appVersion } from '@/lib/version'
import { HealthResponse } from './schemas'

export function getHealth(): HealthResponse {
  return HealthResponse.parse({ status: 'ok', version: appVersion })
}
