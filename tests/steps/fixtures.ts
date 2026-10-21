import { test as base, createBdd } from 'playwright-bdd'

// State shared by the steps of one scenario.
type World = {
  healthResponse?: { status: number; body: { status?: string; version?: string } }
  reportIndex?: string
  requests: string[]
}

export const test = base.extend<{ world: World }>({
  // eslint-disable-next-line no-empty-pattern
  world: async ({}, provide) => provide({ requests: [] }),
})

export const { Given, When, Then } = createBdd(test)
