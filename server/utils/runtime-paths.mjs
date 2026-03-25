import { resolve } from 'node:path'

export const DEFAULT_DATA_DIRECTORY = '.data'
export const DEFAULT_CACHE_DIRECTORY = '.cache'
export const DEFAULT_DATABASE_FILENAME = 'spelling-wizard.sqlite'

export function resolveDataDirectory(baseDirectory = process.cwd(), dataDirectory = DEFAULT_DATA_DIRECTORY) {
  return resolve(baseDirectory, dataDirectory)
}

export function resolveDatabasePath(baseDirectory = process.cwd(), dataDirectory = DEFAULT_DATA_DIRECTORY) {
  return resolve(resolveDataDirectory(baseDirectory, dataDirectory), DEFAULT_DATABASE_FILENAME)
}

export function resolveCacheDirectory(baseDirectory = process.cwd(), cacheDirectory = DEFAULT_CACHE_DIRECTORY) {
  return resolve(baseDirectory, cacheDirectory)
}
