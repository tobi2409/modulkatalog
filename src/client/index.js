// @server-import server.ts
// @server-import admin-center.ts

import TemplateEngine from 'mvvm-monster/template-engine.js'
import ModelJournal from 'mvvm-monster/reactivity/model-journal.js'

let isAdminMode = true

let studiengaengeSearchTimer
let latestStudiengaengeSearch = 0

let moduleSearchTimer
let latestModuleSearch = 0

let data = TemplateEngine.reactive(
    {
        studiengaenge: [],
        module: [],
        adminLoginDisplay: 'none',
        isAdminMode,
        isAdminModeDisplay: isAdminMode ? 'block' : 'none',
        isNonAdminMode: !isAdminMode,
        isNonAdminModeDisplay: !isAdminMode ? 'block' : 'none',
        studiengaengeDisplay: 'block',
        moduleDisplay: 'none',
        studiengaengeSearchPattern: '',
        studiengaengeSearchForName: true,
        studiengaengeSearchForDescription: true,
        selectedStudiengangId: null,
        moduleSearchPattern: '',
        moduleSearchForName: true,
        moduleSearchForDescription: true,
        showAdminLogin: () => {
            data.adminLoginDisplay = 'block'
        },
        adminLogin: async (event) => {
            event.preventDefault()

            const username = document.getElementById('username').value
            const password = document.getElementById('password').value

            try {
                const token = await AdminCenter.adminLogin(username, password)
                sessionStorage.setItem('adminToken', token)

                if (token) {
                    data.isAdminMode = true
                    data.isAdminModeDisplay = 'block'
                    data.isNonAdminMode = false
                    data.isNonAdminModeDisplay = 'none'
                }

                data.adminLoginDisplay = 'none'
            } catch (error) {
                alert(`Fehler: ${error.message}`)
            }
        },
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
        },
        saveStudiengaenge: async () => {
            if (!isAdminMode) {
                return
            }

            const journal = ModelJournal.getJournal(data)
            console.log(journal)
            if (journal.length === 0) {
                return
            }

            const token = sessionStorage.getItem('adminToken')

            if (!token) {
                throw new Error('Kein Admin-Token vorhanden')
            }

            await AdminCenter.saveStudiengaenge(token, journal)

            journal.length = 0
        }
    },
    document.getElementById('app-template-use')
)

const studiengaenge = await Server.loadStudiengaenge('', true, true)
data.studiengaenge.splice(0, data.studiengaenge.length, ...studiengaenge)

//if (isAdminRoute) {
    data = ModelJournal.reactive(data)
//}