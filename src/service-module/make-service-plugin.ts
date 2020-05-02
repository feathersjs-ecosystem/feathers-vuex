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

interface ServiceOptionsDefaults {
  servicePath: string
  namespace: string
  state: {}
  getters: {}
  mutations: {}
  actions: {}
  instanceDefaults: () => {}
  setupInstance: (instance: {}) => {}
}

const defaults: ServiceOptionsDefaults = {
  namespace: '', // The namespace for the Vuex module. Will generally be derived from the service.path, service.name, when available. Otherwise, it must be provided here, explicitly.
  servicePath: '',
  state: {}, // for custom state
  getters: {}, // for custom getters
  mutations: {}, // for custom mutations
  actions: {}, // for custom actions
  instanceDefaults: () => ({}), // Default instanceDefaults returns an empty object
  setupInstance: instance => instance // Default setupInstance returns the instance
}
const events = ['created', 'patched', 'updated', 'removed']

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
    if (!config.service) {
      throw new Error(
        'No service was provided. If you passed one in, check that you have configured a transport plugin on the Feathers Client. Make sure you use the client version of the transport.'
      )
    }
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

    if (globalOptions.handleEvents && options.handleEvents) {
      options.handleEvents = Object.assign(
        {},
        globalOptions.handleEvents,
        options.handleEvents
      )
    }

    events.forEach(eventName => {
      if (!options.handleEvents[eventName])
        options.handleEvents[eventName] = () => options.enableEvents || true
    })

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
        throw new Error(
          'The modelName property is required for Feathers-Vuex Models'
        )
      }
      addModel(Model)

      // (3^) Setup real-time events
      if (options.enableEvents) {
        const handleEvent = (eventName, item, mutationName) => {
          const affectsStore = options.handleEvents[eventName](item, {
            model: Model,
            models: globalModels
          })
          if (affectsStore) {
            eventName === 'removed'
              ? store.commit(`${options.namespace}/removeItem`, item)
              : store.dispatch(`${options.namespace}/${mutationName}`, item)
          }
        }

        // Listen to socket events when available.
        service.on('created', item => {
          handleEvent('created', item, 'addOrUpdate')
          Model.emit && Model.emit('created', item)
        })
        service.on('updated', item => {
          handleEvent('updated', item, 'addOrUpdate')
          Model.emit && Model.emit('updated', item)
        })
        service.on('patched', item => {
          handleEvent('patched', item, 'addOrUpdate')
          Model.emit && Model.emit('patched', item)
        })
        service.on('removed', item => {
          handleEvent('removed', item, 'removeItem')
          Model.emit && Model.emit('removed', item)
        })
      }
    }
  }
}
