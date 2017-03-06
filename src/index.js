import rubberduck from 'rubberduck/dist/rubberduck'
import setupServiceModule from './service-module/service-module'
import setupFeathersModule from './feathers-module/feathers-module'
import deepAssign from 'deep-assign'
import { normalizePath, makeConfig } from './utils'

const defaultOptions = {
  idField: 'id',
  auto: true,
  autoForce: false,
  // Determines the source of the module name. 'short', 'path', or 'explicit'
  nameStyle: 'short',
  feathersModuleName: 'feathers'
}

export default function (clientOrStore, options = {}, modules = {}) {
  options = deepAssign({}, defaultOptions, options)

  return function feathersVuex (arg) {
    const asFeathersPlugin = !arg
    const asVuePlugin = !asFeathersPlugin
    const feathers = asFeathersPlugin ? this : clientOrStore
    const store = asFeathersPlugin ? clientOrStore : arg

    if (asFeathersPlugin && !store) {
      throw new Error('You must pass the vuex store to the Feathers-Vuex plugin.')
    } else if (asVuePlugin && !feathers) {
      throw new Error('You must pass a Feathers Client instance to the Feathers-Vuex plugin.')
    }

    // Normalize the modules into objects if they were provided as a string.
    Object.keys(modules).forEach(name => {
      if (typeof modules[name] === 'string') {
        modules[name] = { name: modules[name] }
      }
    })

    const addToFeathersModule = setupFeathersModule(store, options)(feathers)
    const setup = setupServiceModule(store)
    const addConfigTo = makeConfig(options, modules)

    // Add .vuex() function to each service to allow individual configuration.
    const addVuexMethod = function (service, options, modules) {
      if (typeof service.vuex !== 'function') {
        service.vuex = function (moduleOptions) {
          normalizePath(service)
          addConfigTo(service, moduleOptions)
          setup(service, {force: true})
          addToFeathersModule(service)
          return service
        }
      }
    }

    // Duck punch the service method so we can detect when services are created.
    const emitter = rubberduck.emitter(feathers).punch('service')
    emitter.on('afterService', function (service, args, instance) {
      if (options.auto) {
        normalizePath(service)
        addConfigTo(service)
        addToFeathersModule(service)
        setup(service, {force: options.autoForce})
      }
      addVuexMethod(service, options, modules)
      return service
    })

    // If running as a Vue Plugin, setup each service that was previously created.
    asVuePlugin && Object.keys(feathers.services).forEach(location => feathers.service(location))
  }
}
