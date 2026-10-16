import dotenv from 'dotenv'
import SQLQueryBuilder from '@tobi2409/sql-query-builder'
import { AuthenticationCoreDbLogin } from './@tobi2409/authentication-core-db/login.ts'
import { AuthenticationCoreDbCurrentUser } from './@tobi2409/authentication-core-db/current-user.ts'
import { dbConnection } from './db-connection.ts'
//import argon2 from 'argon2'

dotenv.config()

const SECRET_KEY = process.env.SECRET_KEY
if (!SECRET_KEY) {
    throw new Error('SECRET_KEY is not configured')
}

// @rest
export async function adminLogin(username: string, password: string) : Promise<string> {
    return await AuthenticationCoreDbLogin.login(
        username,
        password,
        SECRET_KEY,
        dbConnection,
        'users',
        {
            'uuid': 'uuid',
            'mail': 'username',
            'password': 'password',
            'isActive': 'isactive'
        }
    )
}

//@rest
/*export async function generatePasswordHash(
    password: string
): Promise<string> {
    const hashOptions: argon2.Options = {
        type: argon2.argon2id,
        memoryCost: 2 ** 17,
        timeCost: 4,
        parallelism: 1
    }

    return await argon2.hash(password, hashOptions)
}*/

type MiddlewareRequest = {
    headers?: { authorization?: string }
    body?: { token?: string }
}

type MiddlewareResponse = {
    status(code: number): MiddlewareResponse
    json(body: unknown): unknown
}

type JournalChange = {
    operation: 'set'
    value: unknown
}

type JournalEntry = {
    id?: number,
    attributeName?: string
    change: JournalChange
}

// TODO: proc2rest-Problem beim Generieren wenn Middleware in anderer Datei
export async function requireAdminAuthentication(req: MiddlewareRequest, res: MiddlewareResponse, next: () => void) {
    const authHeader = JSON.parse(req.headers?.authorization ?? '{}')
    const token = authHeader?.token
    
    if (!token) {
        return res.status(401).json({ error: 'Kein Token bereitgestellt' })
    }

    await AuthenticationCoreDbCurrentUser.getCurrentUser(
        token,
        SECRET_KEY,
        dbConnection,
        'users',
        {
            'uuid': 'uuid',
            'mail': 'username',
            'password': 'password',
            'isActive': 'isactive'
        }
    )

    next()
}

// @rest
// @middlewares(["requireAdminAuthentication"])
// @authorizationParams(["token"])
// @url("journal")
export async function saveStudiengaenge(token: string, journal: JournalEntry[]): Promise<void> {
    const connection = (await dbConnection.getPool()) as any
    const transaction = await connection.connect()

    try {
        await transaction.query('BEGIN')

        for (const entry of journal) {
            const column = entry.attributeName

            switch (entry.change.operation) {
                case 'set': {
                    const newValue = entry.change.value

                    if (column === 'name' && (typeof newValue !== 'string' || newValue.trim() === '')) {
                        throw new Error('Der Name eines Studiengangs darf nicht leer sein')
                    }

                    if (column === 'description' && newValue !== null && typeof newValue !== 'string') {
                        throw new Error('Die Beschreibung muss Text oder null sein')
                    }

                    const query = new SQLQueryBuilder(dbConnection.getDriverName())
                        .update('studiengaenge')
                        .set({ [column]: newValue as string | null })
                        .where('id = ?', [entry.id])
                        .toSQL()

                    await transaction.query(query.text, query.values)
                    break
                }
                default: {
                    throw new Error(`Nicht unterstützte Journal-Operation: ${entry.change.operation}`)
                }
            }
        }

        await transaction.query('COMMIT')
    } catch (error) {
        await transaction.query('ROLLBACK')
        throw error
    } finally {
        transaction.release()
    }
}