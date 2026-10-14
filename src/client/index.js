// @server-import server.ts

import TemplateEngine from 'mvvm-monster/template-engine.js'

let studiengaengeSearchTimer
let latestStudiengaengeSearch = 0

let moduleSearchTimer
let latestModuleSearch = 0

const data = TemplateEngine.reactive(
    {
        studiengaenge: [],
        module: [],
        studiengaengeDisplay: 'block',
        moduleDisplay: 'none',
        studiengaengeSearchPattern: '',
        studiengaengeSearchForName: true,
        studiengaengeSearchForDescription: true,
        selectedStudiengangId: null,
        moduleSearchPattern: '',
        moduleSearchForName: true,
        moduleSearchForDescription: true,
        studiengangClick: async (_, databaseEntry) => {
            data.selectedStudiengangId = databaseEntry.id
            data.moduleSearchPattern = ''

            const module = await Server.loadModule(databaseEntry.id, '', data.moduleSearchForName, data.moduleSearchForDescription)
            data.module.splice(0, data.module.length, ...module)

            data.studiengaengeDisplay = 'none'
            data.moduleDisplay = 'block'
        },
        backToStudiengaenge: () => {
            data.studiengaengeDisplay = 'block'
            data.moduleDisplay = 'none'
        },
        searchStudiengaenge: () => {
            clearTimeout(studiengaengeSearchTimer)
            const search = ++latestStudiengaengeSearch

            studiengaengeSearchTimer = setTimeout(async () => {
                const studiengaenge = await Server.loadStudiengaenge(data.studiengaengeSearchPattern, data.studiengaengeSearchForName, data.studiengaengeSearchForDescription)

                if (search === latestStudiengaengeSearch) {
                    data.studiengaenge.splice(0, data.studiengaenge.length, ...studiengaenge)
                }
            }, 300)
        },
        searchModule: () => {
            clearTimeout(moduleSearchTimer)
            const search = ++latestModuleSearch

            moduleSearchTimer = setTimeout(async () => {
                const module = await Server.loadModule(data.selectedStudiengangId, data.moduleSearchPattern, data.moduleSearchForName, data.moduleSearchForDescription)

                if (search === latestModuleSearch) {
                    data.module.splice(0, data.module.length, ...module)
                }
            }, 300)
        }
    },
    document.getElementById('app-template-use')
)

const studiengaenge = await Server.loadStudiengaenge('', true, true)
data.studiengaenge.splice(0, data.studiengaenge.length, ...studiengaenge)