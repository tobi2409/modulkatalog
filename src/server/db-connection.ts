import { DbConnection } from './db-connection/db-connection-wrapper.ts'

export const dbConnection = new DbConnection('pg')