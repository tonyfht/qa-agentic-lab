import { test as base, createBdd } from 'playwright-bdd'
import { ContractChecker } from '../support/contract'

export interface ApiCall {
  operationId: string
  status: number
  body: unknown
}

// State shared by the steps of one scenario.
type World = {
  healthResponse?: { status: number; body: { status?: string; version?: string } }
  reportIndex?: string
  requests: string[]
  api?: ApiCall
  otherPageText?: string
}

export const test = base.extend<{ world: World; contract: ContractChecker }>({
  world: async ({}, provide) => provide({ requests: [] }),
  // The published contract, fetched once per scenario from the running store.
  contract: async ({ request }, provide) => {
    const doc = await (await request.get('/api/openapi.json')).json()
    await provide(new ContractChecker(doc))
  },
})

export const { Given, When, Then } = createBdd(test)
