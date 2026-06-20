import { createDb } from '@lynkko/db'
import * as schema from './schema'

export const db = createDb(schema)
export type Db = typeof db
