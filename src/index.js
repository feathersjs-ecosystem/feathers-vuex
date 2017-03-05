import rubberduck from 'rubberduck/dist/rubberduck'
import setupServiceModule from './service-module/service-module'
import setupFeathersModule from './feathers-module/feathers-module'
import deepAssign from 'deep-assign'
import { normalizePath } from './utils'

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

    setupFeathersModule(store, options)(feathers)
    const setup = setupServiceModule(store)

    // Normalize the modules into objects if they were provided as a string.
    Object.keys(modules).forEach(name => {
      if (typeof modules[name] === 'string') {
        modules[name] = { name: modules[name] }
      }
    })

    // Add .vuex() function to each service to allow individual configuration.
    const addVuexMethod = function (service, options, modules) {
      if (typeof service.vuex !== 'function') {
        service.vuex = function (moduleOptions) {
          normalizePath(service)
          // options passed to .vuex() will overwrite the previous options.
          deepAssign(modules[service.path], moduleOptions)

          // Make the config available on the service.
          service.vuexOptions = {
            global: options,
            module: modules[service.path],
            modules: modules
          }
          setup(service, {force: true})
          return service
        }
      }
    }

    // Duck punch the service method so we can detect when services are created.
    const emitter = rubberduck.emitter(feathers).punch('service')
    emitter.on('afterService', function (service, args, instance) {
      if (options.auto) {
        // Make global feathers-vuex config available on the service.
        service.vuexOptions = {
          global: options,
          modules: modules
        }
        normalizePath(service)
        // Make any service-specific config available on the service.
        if (modules[service.path]) {
          service.vuexOptions.module = modules[service.path]
        }
        setup(service, {force: options.autoForce})
      }

      addVuexMethod(service, options, modules)
      return service
    })

    // If running as a Vue Plugin, setup each service that was previously created.
    asVuePlugin && Object.keys(feathers.services).forEach(location => feathers.service(location))
  }
}
