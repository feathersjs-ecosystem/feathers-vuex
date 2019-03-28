/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import _trim from 'lodash.trim'
import decode from 'jwt-decode'
import inflection from 'inflection'
import { diff } from 'deep-diff'
import Vue from 'vue'
import fastCopy from 'fast-copy'
import { isPlainObject as _isPlainObject, isObject as _isObject } from 'lodash'

export function stripSlashes(location) {
  return Array.isArray(location)
    ? location.map(l => _trim(l, '/'))
    : _trim(location, '/')
}

//  From feathers-plus/feathers-hooks-common
export function setByDot(obj, path, value, ifDelete?) {
  if (ifDelete) {
    console.log(
      'DEPRECATED. Use deleteByDot instead of setByDot(obj,path,value,true). (setByDot)'
    )
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
  return parts.reduce((obj1, part, i) => {
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
  }, obj)
}

export function upperCaseFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function getShortName(service) {
  let namespace = stripSlashes(service)
  if (Array.isArray(namespace)) {
    namespace = namespace.slice(-1)
  } else if (namespace.includes('/')) {
    namespace = namespace.slice(namespace.lastIndexOf('/') + 1)
  }
  return namespace
}

export function getNameFromPath(service) {
  return stripSlashes(service)
}

// Reads and returns the contents of a cookie with the provided name.
export function readCookie(cookies, name) {
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

// Pass a decoded payload and it will return a boolean based on if it hasn't expired.
export function payloadIsValid(payload) {
  return payload && payload.exp * 1000 > new Date().getTime()
}

// from https://github.com/iliakan/detect-node
export const isNode =
  Object.prototype.toString.call(
    typeof process !== 'undefined' ? process : 0
  ) === '[object process]'

export const isBrowser = !isNode

const authDefaults = {
  commit: undefined,
  req: undefined,
  moduleName: 'auth',
  cookieName: 'feathers-jwt'
}

export function getValidPayloadFromToken(token) {
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

export const initAuth = function initAuth(options) {
  const { commit, req, moduleName, cookieName, feathersClient } = Object.assign(
    {},
    authDefaults,
    options
  )

  if (typeof commit !== 'function') {
    throw new Error(
      'You must pass the `commit` function in the `initAuth` function options.'
    )
  }
  if (!req) {
    throw new Error(
      'You must pass the `req` object in the `initAuth` function options.'
    )
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

export function checkId(id, item, debug) {
  if (id === undefined || id === null) {
    if (debug) {
      console.error(
        'No id found for item. Do you need to customize the `idField`?',
        item
      )
    }
    return false
  }
  return true
}

// Creates a Model class name from the last part of the servicePath
export function getModelName(Model) {
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

export function registerModel(Model, globalModels, apiPrefix, servicePath) {
  const modelName = getModelName(Model)
  let path = apiPrefix ? `${apiPrefix}.${modelName}` : modelName

  setByDot(globalModels, path, Model)
  globalModels.byServicePath[servicePath] = Model
  return {
    path,
    name: modelName
  }
}

export function getServicePrefix(servicePath) {
  const parts = servicePath.split('/')
  let name = parts[parts.length - 1]
  // name = inflection.underscore(name)
  name = name.replace('-', '_')
  name = inflection.camelize(name, true)
  return name
}

export function getServiceCapitalization(servicePath) {
  const parts = servicePath.split('/')
  let name = parts[parts.length - 1]
  // name = inflection.underscore(name)
  name = name.replace('-', '_')
  name = inflection.camelize(name)
  return name
}

export function diffFunctions() {
  return diff
}

export function updateOriginal(newData, existingItem) {
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
    } else if (
      (oldProp === null || oldProp === undefined) &&
      (newProp !== null && newProp !== undefined)
    ) {
      shouldCopyProp = true
      // If both old and new are arrays
    } else if (Array.isArray(oldProp) && Array.isArray(newProp)) {
      shouldCopyProp = true
    } else if (_isObject(oldProp)) {
      shouldCopyProp = true
    } else if (
      oldProp !== newProp &&
      !Array.isArray(oldProp) &&
      !Array.isArray(newProp)
    ) {
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

export function makeNamespace(namespace, servicePath, nameStyle) {
  const nameStyles = {
    short: getShortName,
    path: getNameFromPath
  }
  return namespace || nameStyles[nameStyle](servicePath)
}

/**
 * Gets the service path or name from the service.  The modelname is provided
 * to allow easier discovery if there's a problem.
 * @param service
 * @param modelName
 */
export function getServicePath(service: any, modelName: string) {
  if (!service.name) {
    throw new Error(
      `Service for model named ${modelName} is missing a path or name property. The feathers adapter needs to be updated with a PR to expose this property. You can work around this by passing a 'servicePath' attribute in the options: makeServicePlugin({servicePath: '/path/to/my/service'})`
    )
  }
  return service.path || service.name
}

export function randomString(length) {
  let text = ''
  let possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

export function createRelatedInstance({ item, Model, idField, store }) {
  // Create store instances (if data contains an idField)
  const model = new Model(item)
  const id = model[idField]
  const storedModel = store.state[model.constructor.namespace].keyedById[id]

  return { model, storedModel }
}

export function mergeWithAccessors(dest, source) {
  const sourceProps = Object.getOwnPropertyNames(source)
  const destProps = Object.getOwnPropertyNames(dest)
  const sourceIsVueObservable = sourceProps.includes('__ob__')
  const destIsVueObservable = destProps.includes('__ob__')
  sourceProps.forEach(key => {
    const desc = Object.getOwnPropertyDescriptor(source, key)

    if (!desc.enumerable) {
      return
    }

    // If we're dealing with a Vue Observable, just assign the values.
    if (destIsVueObservable || sourceIsVueObservable) {
      if (_isObject(source[key])) {
        dest[key] = fastCopy(source[key])
      } else {
        dest[key] = source[key]
      }
      return
    }

    // Handle defining accessors
    if (typeof desc.get === 'function' || typeof desc.set === 'function') {
      if (destIsVueObservable) {
        dest[key] = desc.value
      } else {
        Object.defineProperty(dest, key, desc)
      }
      return
    }

    // Assign values
    // Do not allow sharing of deeply-nested objects between instances
    // Potentially breaks accessors on nested data. Needs recursion if this is an issue
    if (_isPlainObject(desc.value)) {
      desc.value = fastCopy(desc.value)
    }
    dest[key] = desc.value
  })
  return dest
}

export function cloneWithAccessors(obj) {
  const clone = {}

  const props = Object.getOwnPropertyNames(obj)
  props.forEach(key => {
    const desc = Object.getOwnPropertyDescriptor(obj, key)

    // Do not allow sharing of deeply-nested objects between instances
    if (_isPlainObject(desc.value)) {
      desc.value = fastCopy(desc.value)
    }

    Object.defineProperty(clone, key, desc)
  })

  return clone
}
