import { resolveDatabasePath, resetDatabase, seedRankEdgeProfiles } from './local-test-data.mjs'

const databasePath = resolveDatabasePath()

await resetDatabase(databasePath)
const result = await seedRankEdgeProfiles(databasePath)

console.log(`Reset and seeded ${result.profileCount} rank-edge test profiles into ${result.databasePath}`)
