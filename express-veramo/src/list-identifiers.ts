import { agent } from './veramo/setup.js'

export async function listIdentifiers() {
  const identifiers = await agent.didManagerFind()
  return identifiers
}
