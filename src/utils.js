import deepAssign from 'deep-assign'

export function stripSlashes (location) {
  return location.replace(/^(\/*)|(\/*)$/g, '')
}

export function normalizePath (service, location) {
  service.path = service.path || service.name || stripSlashes(location)
  return service
}

export function upperCaseFirst (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function getShortName (service) {
  // If a name was manually provided, use it.
  let explicitName = service.vuexOptions.module && service.vuexOptions.module.namespace
  if (explicitName) {
    return stripSlashes(explicitName)
  }

  // Otherwise, create a short name.
  let location = stripSlashes(service.path)
  if (location.includes('/')) {
    location = location.slice(location.lastIndexOf('/') + 1)
  }
  return location
}

export function getNameFromPath (service) {
  // If a name was manually provided, use it.
  let explicitName = service.vuexOptions.module && service.vuexOptions.module.namespace
  if (explicitName) {
    return stripSlashes(explicitName)
  }

  // Otherwise return the full service path.
  return service.path
}

export function getNameFromConfig (service) {
  const namespace = service.vuexOptions.module && service.vuexOptions.module.namespace
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
      deepAssign(modules[service.path], moduleOptions)
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
