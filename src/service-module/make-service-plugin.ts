/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { FeathersVuexOptions, MakeServicePluginOptions } from './types'
import makeServiceModule from './make-service-module'
import { globalModels, prepareAddModel } from './global-models'
import { makeNamespace, getServicePath, assignIfNotPresent } from '../utils'
import _get from 'lodash/get'

const defaults = {
  namespace: '', // The namespace for the Vuex module. Will generally be derived from the service.path, service.name, when available. Otherwise, it must be provided here, explicitly.
  nameStyle: 'short', // Determines the source of the module name. 'short', 'path', or 'explicit'
  servicePath: '',
  state: {}, // for custom state
  getters: {}, // for custom getters
  mutations: {}, // for custom mutations
  actions: {}, // for custom actions
  instanceDefaults: () => ({}), // Default instanceDefaults returns an empty object
  setupInstance: instance => instance // Default setupInstance returns the instance
}

/**
 * prepare only wraps the makeServicePlugin to provide the globalOptions.
 * @param globalOptions
 */
export default function prepareMakeServicePlugin(
  globalOptions: FeathersVuexOptions
) {
  const addModel = prepareAddModel(globalOptions)
  /**
   * (1) Make a Vuex plugin for the provided service.
   * (2a) Attach the vuex store to the BaseModel.
   * (2b) If the Model does not extend the BaseModel, monkey patch it, too
   * (3) Setup real-time events
   */
  return function makeServicePlugin(config: MakeServicePluginOptions) {
    const options = Object.assign({}, defaults, globalOptions, config)
    const {
      Model,
      service,
      namespace,
      nameStyle,
      instanceDefaults,
      setupInstance,
      preferUpdate
    } = options

    if (!service) {
      throw new Error(
        'No service was provided. If you passed one in, check that you have configured a transport plugin on the Feathers Client. Make sure you use the client version of the transport.'
      )
    }

    // Make sure we get a service path from either the service or the options
    let { servicePath } = options
    if (!servicePath) {
      servicePath = getServicePath(service, Model)
    }
    options.servicePath = servicePath

    service.FeathersVuexModel = Model

    return store => {
      // (1^) Create and register the Vuex module
      options.namespace = makeNamespace(namespace, servicePath, nameStyle)
      const module = makeServiceModule(service, options)
      store.registerModule(options.namespace, module)

      // (2a^) Monkey patch the BaseModel in globalModels
      const BaseModel = _get(globalModels, `[${options.serverAlias}].BaseModel`)
      if (BaseModel && !BaseModel.store) {
        Object.assign(BaseModel, {
          store
        })
      }
      // (2b^) Monkey patch the Model(s) and add to globalModels
      assignIfNotPresent(Model, {
        store,
        namespace: options.namespace,
        servicePath,
        instanceDefaults,
        setupInstance,
        preferUpdate
      })
      if (!Model.modelName || Model.modelName === 'BaseModel') {
        throw new Error('The modelName property is required for Feathers-Vuex Models')
      }
      addModel(Model)

      // (3^) Setup real-time events
      if (options.enableEvents) {
        // Listen to socket events when available.
        service.on('created', item => {
          store.dispatch(`${options.namespace}/addOrUpdate`, item)
          if (Model.emit) {
            Model.emit('created', item)
          }
        })
        service.on('updated', item => {
          store.dispatch(`${options.namespace}/addOrUpdate`, item)
          if (Model.emit) {
            Model.emit('updated', item)
          }
        })
        service.on('patched', item => {
          store.dispatch(`${options.namespace}/addOrUpdate`, item)
          if (Model.emit) {
            Model.emit('patched', item)
          }
        })
        service.on('removed', item => {
          store.commit(`${options.namespace}/removeItem`, item)
          if (Model.emit) {
            Model.emit('removed', item)
          }
        })
      }
    }
  }
}
