import _trim from 'lodash.trim'
import decode from 'jwt-decode'

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

const authDefaults = {
  commit: undefined,
  req: undefined,
  moduleName: 'auth',
  cookieName: 'feathers-jwt'
}

export const initAuth = function initAuth (options) {
  const { commit, req, moduleName, cookieName } = Object.assign({}, authDefaults, options)

  if (typeof commit !== 'function') {
    throw new Error('You must pass the `commit` function in the `initAuth` function options.')
  }
  if (!req) {
    throw new Error('You must pass the `req` object in the `initAuth` function options.')
  }

  const accessToken = readCookie(req.headers.cookie, cookieName)
  const payload = getValidPayloadFromToken(accessToken)

  if (payload) {
    commit(`${moduleName}/setAccessToken`, accessToken)
    commit(`${moduleName}/setPayload`, payload)
  }
  return Promise.resolve(payload)
}

export function getValidPayloadFromToken (token) {
  if (token) {
    try {
      var payload = decode(token)
      return payloadIsValid(payload) ? payload : undefined
    } catch (error) {
      return undefined
    }
  }
  return undefined
}

// Pass a decoded payload and it will return a boolean based on if it hasn't expired.
export function payloadIsValid (payload) {
  return payload && payload.exp * 1000 > new Date().getTime()
}

// Reads and returns the contents of a cookie with the provided name.
export function readCookie (cookies, name) {
  if (!cookies) {
    return undefined
  }
  var nameEQ = name + '='
  var ca = cookies.split(';')
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length)
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length)
    }
  }
  return null
}
