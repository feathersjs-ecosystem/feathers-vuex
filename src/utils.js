import _trim from 'lodash.trim'
import decode from 'jwt-decode'
import inflection from 'inflection'
import deepDiff from 'deep-diff'
import Vue from 'vue'
import isObject from 'lodash.isobject'

const { diff } = deepDiff

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
  const { commit, req, moduleName, cookieName, feathersClient } = Object.assign({}, authDefaults, options)

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
    if (feathersClient) {
      return feathersClient.passport.setJWT(accessToken).then(() => payload)
    }
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

export function checkId (id, item, debug) {
  if (id === undefined || id === null) {
    if (debug) {
      console.error('No id found for item. Do you need to customize the `idField`?', item)
    }
    return false
  }
  return true
}

export function registerModel (Model, globalModels, apiPrefix, servicePath) {
  const modelName = getModelName(Model)
  let path = apiPrefix ? `${apiPrefix}.${modelName}` : modelName

  setByDot(globalModels, path, Model)
  globalModels.byServicePath[servicePath] = Model
  return {
    path,
    name: modelName
  }
}

// Creates a Model class name from the last part of the servicePath
export function getModelName (Model) {
  // If the Model.name has been customized, use it.
  if (Model.modelName) {
    return Model.modelName
  }

  // Otherwise, use an inflection of the last bit of the servicePath
  const parts = Model.servicePath.split('/')
  let name = parts[parts.length - 1]
  name = inflection.titleize(name)
  name = name.split('-').join('')
  name = inflection.singularize(name)
  return name
}

export function getServicePrefix (servicePath) {
  const parts = servicePath.split('/')
  let name = parts[parts.length - 1]
  // name = inflection.underscore(name)
  name = name.replace('-', '_')
  name = inflection.camelize(name, true)
  return name
}

export function getServiceCapitalization (servicePath) {
  const parts = servicePath.split('/')
  let name = parts[parts.length - 1]
  // name = inflection.underscore(name)
  name = name.replace('-', '_')
  name = inflection.camelize(name)
  return name
}

//  From feathers-plus/feathers-hooks-common
export function setByDot (obj, path, value, ifDelete) {
  if (ifDelete) {
    console.log('DEPRECATED. Use deleteByDot instead of setByDot(obj,path,value,true). (setByDot)')
  }

  if (path.indexOf('.') === -1) {
    obj[path] = value

    if (value === undefined && ifDelete) {
      delete obj[path]
    }

    return
  }

  const parts = path.split('.')
  const lastIndex = parts.length - 1
  return parts.reduce(
    (obj1, part, i) => {
      if (i !== lastIndex) {
        if (!obj1.hasOwnProperty(part) || typeof obj1[part] !== 'object') {
          obj1[part] = {}
        }
        return obj1[part]
      }

      obj1[part] = value
      if (value === undefined && ifDelete) {
        delete obj1[part]
      }
      return obj1
    },
    obj
  )
}

export function diffFunctions () {
  return diff
}

export function updateOriginal (newData, existingItem) {
  Object.keys(newData).forEach(key => {
    const newProp = newData[key]
    const oldProp = existingItem[key]
    let shouldCopyProp = false

    if (newProp === oldProp) {
      return
    }

    // If the old item doesn't already have this property, update it
    if (!existingItem.hasOwnProperty(key)) {
      shouldCopyProp = true
    // If the old prop is null or undefined, and the new prop is neither
    } else if ((oldProp === null || oldProp === undefined) && (newProp !== null && newProp !== undefined)) {
      shouldCopyProp = true
    // If both old and new are arrays
    } else if (Array.isArray(oldProp) && Array.isArray(newProp)) {
      shouldCopyProp = true
    } else if (isObject(oldProp)) {
      shouldCopyProp = true
    } else if (oldProp !== newProp && !Array.isArray(oldProp) && !Array.isArray(newProp)) {
      shouldCopyProp = true
    }

    if (shouldCopyProp) {
      if (existingItem.hasOwnProperty(key)) {
        existingItem[key] = newProp
      } else {
        Vue.set(existingItem, key, newProp)
      }
    }
  })
}
