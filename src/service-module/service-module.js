import makeState from './state'
import makeGetters from './getters'
import makeMutations from './mutations'
import makeActions from './actions'
import makeModel from './model'

const defaults = {
  nameStyle: 'short', // Determines the source of the module name. 'short', 'path', or 'explicit'
  enableEvents: true, // Listens to socket.io events when available
  addOnUpsert: false, // Add new records pushed by 'updated/patched' socketio events into store, instead of discarding them
  diffOnPatch: false, // Only send changed data on patch
  skipRequestIfExists: false, // For get action, if the record already exists in store, skip the remote request
  preferUpdate: false, // When true, calling model.save() will do an update instead of a patch.
  apiPrefix: '', // Setting to 'api1/' will prefix the store moduleName, unless `namespace` is used, then this is ignored.
  debug: false, // Set to true to enable logging messages.
  modelName: '', // The location of this service's Model in the Vue plugin (globalModels object). Added in the servicePlugin method
  instanceDefaults: {}, // The default values for the instance when `const instance =new Model()`
  replaceItems: false, // Instad of merging in changes in the store, replace the entire record.
  keepCopiesInStore: false, // Set to true to store cloned copies in the store instead of on the Model.
  paramsForServer: [], // Custom query operators that are ignored in the find getter, but will pass through to the server.
  whitelist: [], // Custom query operators that will be allowed in the find getter.
  state: {}, // for custom state
  getters: {}, // for custom getters
  mutations: {}, // for custom mutations
  actions: {} // for custom actions
}

export default function servicePluginInit(
  feathersClient,
  globalOptions = {},
  globalModels = {}
) {
  globalModels.byServicePath = globalModels.byServicePath || {}
  if (!feathersClient || !feathersClient.service) {
    throw new Error(
      'You must provide a Feathers Client instance to feathers-vuex'
    )
  }

  globalOptions = Object.assign({}, defaults, globalOptions)

  const serviceModule = function serviceModule(servicePath, options = {}) {
    if (!feathersClient || !feathersClient.service) {
      throw new Error(
        'You must provide a service path or object to create a feathers-vuex service module'
      )
    }

    options = Object.assign({}, globalOptions, options)
    const { debug, apiPrefix } = options

    if (typeof servicePath !== 'string') {
      throw new Error(
        'The first argument to setup a feathers-vuex service must be a string'
      )
    }

    const service = feathersClient.service(servicePath)
    if (!service) {
      throw new Error(
        'No service was found. Please configure a transport plugin on the Feathers Client. Make sure you use the client version of the transport, like `feathers-socketio/client` or `feathers-rest/client`.'
      )
    }
    const paginate =
      service.hasOwnProperty('paginate') &&
      service.paginate.hasOwnProperty('default')
    const stateOptions = Object.assign(options, { paginate })

    const defaultState = makeState(servicePath, stateOptions)
    const defaultGetters = makeGetters(servicePath)
    const defaultMutations = makeMutations(servicePath, {
      debug,
      globalModels,
      apiPrefix
    })
    const defaultActions = makeActions(service, { debug })
    const module = {
      namespaced: true,
      state: Object.assign({}, defaultState, options.state),
      getters: Object.assign({}, defaultGetters, options.getters),
      mutations: Object.assign({}, defaultMutations, options.mutations),
      actions: Object.assign({}, defaultActions, options.actions)
    }
    return module
  }

  const serviceModel = function serviceModel(options) {
    options = Object.assign({}, globalOptions, options, { globalModels })
    const Model = makeModel(options)

    return Model
  }

  const servicePlugin = function servicePlugin(module, Model, options = {}) {
    options = Object.assign({}, globalOptions, options)
    const { servicePath } = module.state

    module.state.modelName = modelInfo.path
    store.registerModule(namespace, module)
  }

  return createServicePlugin
}
