import { getShortName, getNameFromPath, stripSlashes } from '../utils'
import makeState from './state'
import makeGetters from './getters'
import makeMutations from './mutations'
import makeActions from './actions'

const defaults = {
  idField: 'id', // The field in each record that will contain the id
  autoRemove: false, // automatically remove records missing from responses (only use with feathers-rest)
  nameStyle: 'short', // Determines the source of the module name. 'short', 'path', or 'explicit'
  enableEvents: true, // Listens to socket.io events when available
  state: {},     // for custom state
  getters: {},   // for custom getters
  mutations: {}, // for custom mutations
  actions: {}    // for custom actions
}

export default function servicePluginInit (feathersClient, globalOptions = {}) {
  if (!feathersClient || !feathersClient.service) {
    throw new Error('You must provide a Feathers Client instance to feathers-vuex')
  }

  globalOptions = Object.assign({}, defaults, globalOptions)

  return function createServiceModule (servicePath, options = {}) {
    if (!feathersClient || !feathersClient.service) {
      throw new Error('You must provide a service path or object to create a feathers-vuex service module')
    }

    options = Object.assign({}, globalOptions, options)
    const { idField, autoRemove, nameStyle } = options

    if (typeof servicePath !== 'string') {
      throw new Error('The first argument to setup a feathers-vuex service must be a string')
    }

    const service = feathersClient.service(servicePath)
    if (!service) {
      throw new Error('No service was found. Please configure a transport plugin on the Feathers Client')
    }
    const paginate = service.hasOwnProperty('paginate') && service.paginate.hasOwnProperty('default')

    const defaultState = makeState(servicePath, { idField, autoRemove, paginate })
    const defaultGetters = makeGetters(servicePath)
    const defaultMutations = makeMutations(servicePath)
    const defaultActions = makeActions(service)

    return function setupStore (store) {
      const nameStyles = {
        short: getShortName,
        path: getNameFromPath
      }
      let namespace = options.namespace || nameStyles[nameStyle](servicePath)

      store.registerModule(namespace, {
        namespaced: true,
        state: Object.assign({}, defaultState, options.state),
        getters: Object.assign({}, defaultGetters, options.getters),
        mutations: Object.assign({}, defaultMutations, options.mutations),
        actions: Object.assign({}, defaultActions, options.actions)
      })

      if (options.enableEvents) {
        // Listen to socket events when available.
        service.on('created', item => store.commit(`${namespace}/addItem`, item))
        service.on('updated', item => store.commit(`${namespace}/updateItem`, item))
        service.on('patched', item => store.commit(`${namespace}/updateItem`, item))
        service.on('removed', item => store.commit(`${namespace}/removeItem`, item))
      }
    }
  }
}
