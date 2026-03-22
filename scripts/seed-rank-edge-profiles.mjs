import { resolveDatabasePath, seedRankEdgeProfiles } from './local-test-data.mjs'

const result = await seedRankEdgeProfiles(resolveDatabasePath())

console.log(`Seeded ${result.profileCount} rank-edge test profiles into ${result.databasePath}`)
