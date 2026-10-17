import SQLQueryBuilder from '@tobi2409/sql-query-builder'
import { dbConnection } from './db-connection.ts'

type Studiengang = {
    id: number
    name: string
    description: string | null
}

type Modul = {
    id: number
    name: string
    description: string | null
    semester: number | null
    ects: number | null
    professor: string
}

// @rest
// @url("studiengaenge")
export async function loadStudiengaenge(searchPattern: string, searchForName: boolean, searchForDescription: boolean): Promise<Studiengang[]> {
    let query = new SQLQueryBuilder('pg')
        .select(['id', 'name', 'description'])
        .from('studiengaenge')

    if (searchPattern !== '') {
        const conditions = []
        const values = []

        if (searchForName) {
            conditions.push('name ILIKE ?')
            values.push(`%${searchPattern}%`)
        }

        if (searchForDescription) {
            conditions.push('description ILIKE ?')
            values.push(`%${searchPattern}%`)
        }

        if (conditions.length > 0) {
            query.where(conditions.join(' or '), values)
        }
    }

    query = query
        .orderBy('name')
        .toSQL()

    const connection = (await dbConnection.getPool()) as any
    const result = await connection.query(query.text, query.values)

    return result.rows
}

// @rest
// @url("studiengaenge/{studiengangId}/module")
export async function loadModule(studiengangId: number, searchPattern: string, searchForName: boolean, searchForDescription: boolean): Promise<Modul[]> {
    const conditions = ['studiengang_id = ?']
    const values: (number | string)[] = [studiengangId]

    if (searchPattern !== '') {
        const searchConditions = []

        if (searchForName) {
            searchConditions.push('module.name ILIKE ?')
            values.push(`%${searchPattern}%`)
        }

        if (searchForDescription) {
            searchConditions.push('module.description ILIKE ?')
            values.push(`%${searchPattern}%`)
        }

        if (searchConditions.length > 0) {
            conditions.push(`(${searchConditions.join(' or ')})`)
        }
    }

    const query = new SQLQueryBuilder('pg')
        .select(['module.id', 'module.name', 'module.description', 'module.semester', 'module.ects', 'professoren.name as professor'])
        .from('module')
        .join('professoren', 'module.professor_id = professoren.id')
        .join('studiengaenge_module', 'module.id = studiengaenge_module.modul_id')
        .where(conditions.join(' and '), values)
        .toSQL()

    const connection = (await dbConnection.getPool()) as any
    const result = await connection.query(query.text, query.values)

    return result.rows
}