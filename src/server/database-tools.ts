//TODO: fertig implementieren und database-tools als eigene Library für Fullsty aufstellen

import SQLQueryBuilder from '@tobi2409/sql-query-builder'
import { dbConnection } from './db-connection.ts'

type DriverName = ConstructorParameters<typeof SQLQueryBuilder>[0]
type SearchFor = Readonly<Record<string, boolean>>
type OrderBy = Readonly<{
    column: string
    direction: 'ASC' | 'DESC'
}>

type SetChange = Readonly<{
    operation: 'set'
    value: unknown
}>

type SpliceChange = Readonly<{
    action: 'splice'
    items: readonly unknown[]
    removedItems: readonly unknown[]
}>

export type JournalEntry = Readonly<{
    id?: number
    attributeName?: string
    change: SetChange | SpliceChange
}>

type SaveOperation = 'set' | 'splice' | 'push'
type SaveCondition = (value: unknown, entry: JournalEntry) => void

type ColumnConfiguration = Readonly<{
    conditions?: readonly SaveCondition[]
    relationTable?: string
    joinCondition?: string
    relationColumn?: string
    relationIdentifierProperty?: string
}>

type ColumnConfigurations = Readonly<Record<string, ColumnConfiguration>>

export async function loadData<T>(
    driverName: DriverName,
    queryCallback: (query: SQLQueryBuilder) => SQLQueryBuilder,
    searchPattern: string,
    searchFor: SearchFor,
    orderBy: OrderBy,
    limit?: number
): Promise<T[]> {
    const query = queryCallback(new SQLQueryBuilder(driverName))

    if (searchPattern !== '') {
        const searchColumns = Object.entries(searchFor)
            .filter(([, enabled]) => enabled)
            .map(([column]) => column)

        if (searchColumns.length > 0) {
            query.whereClause.add(
                'AND',
                `(${searchColumns.map(column => `${column} ILIKE ?`).join(' or ')})`,
                searchColumns.map(() => `%${searchPattern}%`)
            )
        }
    }

    query.orderBy(orderBy.column, orderBy.direction)

    if (limit !== undefined) {
        query.limit(limit)
    }

    const sql = query.toSQL()

    const connection = (await dbConnection.getPool()) as any
    const result = await connection.query(sql.text, sql.values)

    return result.rows
}

// Beispiel für einen set-Change:
// { id: 2, attributeName: 'name', change: { operation: 'set', value: 'Medieninformatik' } }
// Ergebnis: Die Spalte "name" des Datensatzes mit ID 2 wird aktualisiert.
//
// Beispiel für einen splice-Change an der m:n-Beziehung "module_pruefungsarten":
// {
//     id: 3,
//     attributeName: 'pruefungsarten',
//     change: {
//         action: 'splice',
//         removedItems: [{ id: 2 }],
//         items: [{ id: 1 }]
//     }
// }
// Ergebnis: Für Modul 3 wird die Beziehung zu Prüfungsart 2 gelöscht und zu Prüfungsart 1 eingefügt.
//
// Vorgesehenes splice-Beispiel ohne m:n-Beziehung (noch nicht implementiert):
// {
//     attributeName: 'studiengaenge',
//     change: {
//         action: 'splice',
//         removedIds: [2],
//         items: [{ name: 'Digitale Systeme', description: null }]
//     }
// }
// Ergebnis: Studiengang 2 wird aus tableName "studiengaenge" gelöscht und der neue Datensatz dort eingefügt.
export async function saveData(
    tableName: string,
    journal: readonly JournalEntry[],
    enabledOperations: readonly SaveOperation[],
    columns: ColumnConfigurations
): Promise<void> {
    const connection = (await dbConnection.getPool()) as any
    const transaction = await connection.connect()

    try {
        await transaction.query('BEGIN')

        for (const entry of journal) {
            const operation = 'operation' in entry.change ? entry.change.operation : entry.change.action

            if (!enabledOperations.includes(operation)) {
                throw new Error(`Nicht unterstützte Journal-Operation: ${operation}`)
            }

            if (entry.id === undefined || entry.attributeName === undefined) {
                throw new Error('Journal-Einträge benötigen eine ID und einen Attributnamen')
            }

            const column = entry.attributeName
            const columnConfiguration = columns[column]

            if (!columnConfiguration) {
                throw new Error(`Spalte ist nicht zum Speichern freigegeben: ${column}`)
            }

            switch (operation) {
                case 'set': {
                    if (!('operation' in entry.change)) {
                        throw new Error('Ungültiger set-Change')
                    }

                    const newValue = entry.change.value

                    for (const condition of columnConfiguration.conditions ?? []) {
                        condition(newValue, entry)
                    }

                    // Beispiel: Für "module.name" ist targetTable die Basistabelle "module".
                    // Für "professoren.name" mit relationTable "professoren" ist targetTable "professoren".
                    // für targetTable ('module') = tableName ('module'):
                    // UPDATE module SET name = ? WHERE id = ?
                    // für targetTable ('professoren') != tableName ('module'):
                    // UPDATE professoren SET name = ? FROM module WHERE module.professor_id = professoren.id AND module.id = ?
                    const targetTable = columnConfiguration.relationTable ?? tableName
                    const targetColumn = column.includes('.') ? column.slice(column.lastIndexOf('.') + 1) : column
                    const queryBuilder = new SQLQueryBuilder(dbConnection.getDriverName())
                        .update(targetTable)
                        .set({ [targetColumn]: newValue as any })

                    // Eine m:n-Zuordnungstabelle enthält normalerweise nur Fremdschlüssel und spielt bei
                    // "set" keine Rolle; ihre Beziehungen werden im "splice"-Fall geändert.

                    if (columnConfiguration.relationTable) {
                        if (!columnConfiguration.joinCondition) {
                            throw new Error(`Für die Relation ${column} fehlt joinCondition`)
                        }

                        queryBuilder
                            .from(tableName)
                            .where(`${columnConfiguration.joinCondition} AND ${tableName}.id = ?`, [entry.id])
                    } else {
                        queryBuilder.where('id = ?', [entry.id])
                    }

                    const query = queryBuilder.toSQL()

                    await transaction.query(query.text, query.values)
                    break
                }
                case 'splice': {
                    //TODO
                    break
                }
                case 'push': {
                    //TODO
                    break
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