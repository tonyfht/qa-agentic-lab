import type { APIRequestContext } from '@playwright/test'
import { test as base, createBdd } from 'playwright-bdd'
import { ContractChecker } from '../support/contract'

export interface ApiCall {
  operationId: string
  status: number
  body: unknown
  setCookies?: string[]
}

// State shared by the steps of one scenario.
type World = {
  healthResponse?: { status: number; body: { status?: string; version?: string } }
  reportIndex?: string
  requests: string[]
  api?: ApiCall
  otherPageText?: string
  stock: Record<string, number>
  orders: string[]
  other?: { request: APIRequestContext; orderNumber?: string }
  sweep?: { operationId: string; status: number; errors: string[] }[]
  headers?: Record<string, string>
  /** Name of the product added from a card or a suggestion (QAL-010). */
  added?: string
}

export const test = base.extend<{ world: World; contract: ContractChecker }>({
  world: async ({}, provide) => provide({ requests: [], stock: {}, orders: [] }),
  // The published contract, fetched once per scenario from the running store.
  contract: async ({ request }, provide) => {
    const doc = await (await request.get('/api/openapi.json')).json()
    await provide(new ContractChecker(doc))
  },
})

export const { Given, When, Then } = createBdd(test)
