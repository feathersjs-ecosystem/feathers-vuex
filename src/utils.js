import _trim from 'lodash.trim'

export function stripSlashes (location) {
  return Array.isArray(location) ? location.map(l => _trim(l, '/')) : _trim(location, '/')
}

export function upperCaseFirst (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function getShortName (service) {
  let namespace = stripSlashes(service)
  if (Array.isArray(namespace)) {
    namespace = namespace.slice(-1)
  } else if (namespace.includes('/')) {
    namespace = namespace.slice(namespace.lastIndexOf('/') + 1)
  }
  return namespace
}

export function getNameFromPath (service) {
  return stripSlashes(service)
}

// from https://github.com/iliakan/detect-node
export const isNode = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]'

export const isBrowser = !isNode
