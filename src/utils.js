export function stripSlashes (name) {
  return name.replace(/^(\/*)|(\/*)$/g, '')
}

export function normalizePath (service) {
  service.path = service.path || service.name
  return service
}

export function upperCaseFirst (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function getShortName (service) {
  // If a name was manually provided, use it.
  let explicitName = service.vuexOptions.module && service.vuexOptions.module.name
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
  let explicitName = service.vuexOptions.module && service.vuexOptions.module.name
  if (explicitName) {
    return stripSlashes(explicitName)
  }

  // Otherwise return the full service path.
  return service.path
}

export function getNameFromConfig (service) {
  const name = service.vuexOptions.module.name
  if (!name) {
    throw new Error(`The feathers-vuex nameStyle attribute is set to explicit, but no name was provided for the ${service.path} service.`)
  }
  return name
}
