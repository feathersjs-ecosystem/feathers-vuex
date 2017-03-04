import { getShortName, getNameFromPath, getNameFromConfig } from '../utils'
import deepAssign from 'deep-assign'
import mapGetters from './getters'
import mapMutations from './mutations'
import mapActions from './actions'

export default function setupServiceModule (store) {
  return function setupServiceOnStore (service, { force }) {
    const { vuexOptions } = service
    const nameStyles = {
      short: getShortName,
      path: getNameFromPath,
      explicit: getNameFromConfig
    }
    let name = nameStyles[vuexOptions.global.nameStyle](service)
    const existingName = service.vuexOptions.module && service.vuexOptions.module.name

    // When .vuex() is manually called, tear down the previous module.
    // Tear down before the module name is updated to remove the correct one.
    if (store.state[existingName] && force) {
      store.unregisterModule(existingName)
    }

    // update the name
    deepAssign(service.vuexOptions, { module: {name} })
    vuexOptions.modules[service.path] = vuexOptions.module

    // Setup or re-setup the module if .vuex() was called manually.
    if (!store.state[name] || force) {
      store.registerModule(name, {
        namespaced: true,
        state: {
          ids: [],
          keyedById: {},
          currentId: undefined,
          copy: undefined
        },
        getters: mapGetters(service),
        mutations: mapMutations(service),
        actions: mapActions(service)
      })
    }
  }
}
