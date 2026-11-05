// @server-import server.ts
// @server-import admin-center.ts

import TemplateEngine from 'mvvm-monster/template-engine.js'
import ModelJournal from 'mvvm-monster/reactivity/model-journal.js'
import ViewModelArray from 'mvvm-monster/model/viewmodel-array.js'
import MVVMDataLoader from 'mvvm-monster/dataloaders/mvvm-data-loader.js'

let model = ModelJournal.reactive({
    studiengaenge: [],
    module: [],
    isAdminMode: sessionStorage.getItem('adminToken') ? true : false
})

const viewModel = TemplateEngine.reactive(
    {
        adminLoginDisplay: 'none',
        isAdminModeDisplay: model.isAdminMode ? 'block' : 'none',
        isNonAdminModeDisplay: model.isAdminMode ? 'none' : 'block',
        studiengaengeDisplay: 'block',
        moduleDisplay: 'none',
        studiengaengeSearchPattern: '',
        studiengaengeSearchForName: true,
        studiengaengeSearchForDescription: true,
        selectedStudiengangId: null,
        moduleSearchPattern: '',
        moduleSearchForName: true,
        moduleSearchForDescription: true,
        studiengaengeSearchTimer: null,
        latestStudiengaengeSearch: 0,
        moduleSearchTimer: null,
        latestModuleSearch: 0,

        // Model und ViewModel verwenden dieselbe Darstellung.
        get studiengaenge() {
            return ViewModelArray.get(model.studiengaenge, (studiengang) => studiengang).data
        },

        get module() {
            return ViewModelArray.get(model.module, (modul) => modul).data
        },

        set isAdminMode(value) {
            model.isAdminMode = value
            viewModel.isAdminModeDisplay = value ? 'block' : 'none'
            viewModel.isNonAdminModeDisplay = value ? 'none' : 'block'
        },

        get isAdminMode() {
            return model.isAdminMode
        },

        showAdminLogin: () => {
            viewModel.adminLoginDisplay = 'block'
        },

        adminLogin: async (event) => {
            event.preventDefault()

            const username = document.getElementById('username').value
            const password = document.getElementById('password').value

            try {
                const token = await AdminCenter.adminLogin(username, password)
                sessionStorage.setItem('adminToken', token)

                if (token) {
                    viewModel.isAdminMode = true
                }

                viewModel.adminLoginDisplay = 'none'
            } catch (error) {
                alert(`Fehler: ${error.message}`)
            }
        },

        columnEditClick: (event) => {
            event.stopPropagation()
        },

        studiengangClick: async (_, databaseEntry) => {
            viewModel.selectedStudiengangId = databaseEntry.id
            viewModel.moduleSearchPattern = ''

            const module = await Server.loadModule(databaseEntry.id, '', viewModel.moduleSearchForName, viewModel.moduleSearchForDescription)
            viewModel.module.splice(0, viewModel.module.length, ...module)

            viewModel.studiengaengeDisplay = 'none'
            viewModel.moduleDisplay = 'block'
        },

        backToStudiengaenge: () => {
            viewModel.studiengaengeDisplay = 'block'
            viewModel.moduleDisplay = 'none'
        },

        searchStudiengaenge: () => {
            clearTimeout(viewModel.studiengaengeSearchTimer)
            const search = ++viewModel.latestStudiengaengeSearch

            viewModel.studiengaengeSearchTimer = setTimeout(async () => {
                const studiengaenge = await Server.loadStudiengaenge(viewModel.studiengaengeSearchPattern, viewModel.studiengaengeSearchForName, viewModel.studiengaengeSearchForDescription)

                if (search === viewModel.latestStudiengaengeSearch) {
                    MVVMDataLoader.loadData(studiengaenge, viewModel.studiengaenge)
                }
            }, 300)
        },

        searchModule: () => {
            clearTimeout(viewModel.moduleSearchTimer)
            const search = ++viewModel.latestModuleSearch

            viewModel.moduleSearchTimer = setTimeout(async () => {
                const module = await Server.loadModule(viewModel.selectedStudiengangId, viewModel.moduleSearchPattern, viewModel.moduleSearchForName, viewModel.moduleSearchForDescription)

                if (search === viewModel.latestModuleSearch) {
                    viewModel.module.splice(0, viewModel.module.length, ...module)
                }
            }, 300)
        },

        saveStudiengaenge: async () => {
            if (!model.isAdminMode) {
                return
            }

            const journal = ModelJournal.getJournal(model)
            console.log(journal)
            if (journal.length === 0) {
                return
            }

            const token = sessionStorage.getItem('adminToken')

            if (!token) {
                throw new Error('Kein Admin-Token vorhanden')
            }

            try {
                await AdminCenter.saveStudiengaenge(token, journal)
                journal.length = 0
            } catch (error) {
                alert('Fehler beim Speichern der Studiengänge: ' + error)
            }
        }
    },
    document.getElementById('app-template-use')
)

const studiengaenge = await Server.loadStudiengaenge('', true, true)
MVVMDataLoader.loadData(studiengaenge, viewModel.studiengaenge)