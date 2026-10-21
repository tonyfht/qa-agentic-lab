import { test as base, createBdd } from 'playwright-bdd'

// State shared by the steps of one scenario.
type World = { healthResponse?: { status: number; body: { status?: string; version?: string } } }

export const test = base.extend<{ world: World }>({
  world: async ({}, provide) => provide({}),
})

export const { Given, When, Then } = createBdd(test)
