import { loadData } from './database-tools.ts'

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
    return loadData<Studiengang>(
        'pg',
        query => query
            .select(['id', 'name', 'description'])
            .from('studiengaenge'),
        searchPattern,
        { name: searchForName, description: searchForDescription },
        { column: 'name', direction: 'ASC' }
    )
}

// @rest
// @url("studiengaenge/{studiengangId}/module")
export async function loadModule(studiengangId: number, searchPattern: string, searchForName: boolean, searchForDescription: boolean): Promise<Modul[]> {
    return loadData<Modul>(
        'pg',
        query => query
            .select(['module.id', 'module.name', 'module.description', 'module.semester', 'module.ects',
                'professoren.name as professor',
                'json_agg(pruefungsarten.art) as pruefungsarten'])
            .from('module')
            .join('professoren', 'module.professor_id = professoren.id')
            .join('studiengaenge_module', 'module.id = studiengaenge_module.modul_id')
            .join('module_pruefungsarten', 'module.id = module_pruefungsarten.modul_id')
            .join('pruefungsarten', 'module_pruefungsarten.pruefungsart_id = pruefungsarten.id')
            .where('studiengang_id = ?', [studiengangId])
            .groupBy(['module.id']),
        searchPattern,
        { 'module.name': searchForName, 'module.description': searchForDescription },
        { column: 'module.name', direction: 'ASC' }
    )
}