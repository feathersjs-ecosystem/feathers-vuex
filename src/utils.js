import _merge from 'lodash.merge'
import _cloneDeep from 'lodash.clonedeep'
import _trim from 'lodash.trim'

export function stripSlashes (location) {
  return Array.isArray(location) ? location.map(l => _trim(l, '/')) : _trim(location, '/')
}

export function normalizePath (service, location) {
  service.path = service.path || service.name || stripSlashes(location)
  return service
}

export function upperCaseFirst (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function getNameFromConfig (service) {
  return service.vuexOptions.module && service.vuexOptions.module.namespace
}

export function getShortName (service) {
  // If a name was manually provided, use it.
  let namespace = getNameFromConfig(service)
  if (namespace) {
    return stripSlashes(namespace)
  }

  // Otherwise, create a short name.
  namespace = stripSlashes(service.path)
  if (Array.isArray(namespace)) {
    namespace = namespace.slice(-1);
  } else if (namespace.includes('/')) {
    namespace = namespace.slice(namespace.lastIndexOf('/') + 1)
  }
  return namespace
}

export function getNameFromPath (service) {
  // If a name was manually provided, use it.
  let namespace = getNameFromConfig(service)
  if (namespace) {
    return stripSlashes(namespace)
  }

  // Otherwise return the full service path.
  return service.path
}

export function getNameFromExplicit (service) {
  const namespace = getNameFromConfig(service)
  if (!namespace) {
    throw new Error(`The feathers-vuex nameStyle attribute is set to explicit, but no name was provided for the ${service.path} service.`)
  }
  return namespace
}

export function makeConfig (options, modules) {
  return (service, moduleOptions) => {
    modules[service.path] = modules[service.path] || {}

    if (service.vuexOptions && service.vuexOptions.module) {
      moduleOptions.oldName = service.vuexOptions.module.namespace
    }

    // moduleOptions (passed to the vuex method) will overwrite previous options.
    if (moduleOptions) {
      _merge(modules[service.path], moduleOptions)
    }

    // Make the config available on the service.
    service.vuexOptions = {
      global: options,
      module: modules[service.path],
      modules: modules
    }
    return service
  }
}

// from https://github.com/iliakan/detect-node
export const isNode = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]'

export const isBrowser = !isNode
