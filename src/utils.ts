/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import decode from 'jwt-decode'
import inflection from 'inflection'
import Vue from 'vue'
import fastCopy from 'fast-copy'
import _isPlainObject from 'lodash/isPlainObject'
import _isObject from 'lodash/isObject'
import _trim from 'lodash/trim'
import _omit from 'lodash/omit'
import _get from 'lodash/get'
import ObjectID from 'bson-objectid'
import { globalModels as models } from './service-module/global-models'
import stringify from 'fast-json-stable-stringify'

interface Query {
  [key: string]: any
}
interface PaginationOptions {
  default: number
  max: number
}
interface Params {
  query?: Query
  paginate?: false | Pick<PaginationOptions, 'max'>
  provider?: string
  route?: { [key: string]: string }
  headers?: { [key: string]: any }

  [key: string]: any // (JL) not sure if we want this
}
interface Paginated<T> {
  total: number
  limit: number
  skip: number
  data: T[]
}

export function stripSlashes(location: string) {
  return _trim(location, '/')
}

export function setByDot(obj, path, value, ifDelete?) {
  if (ifDelete) {
    // eslint-disable-next-line no-console
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
      return feathersClient.authentication
        .setAccessToken(accessToken)
        .then(() => payload)
    }
  }
  return Promise.resolve(payload)
}

/**
 * Generate a new tempId and mark the record as a temp
 * @param state
 * @param item
 */
export function assignTempId(state, item) {
  const { debug, tempIdField } = state
  if (debug) {
    // eslint-disable-next-line no-console
    console.info('assigning temporary id to item', item)
  }
  const newId = new ObjectID().toHexString()
  item[tempIdField] = newId
  return newId
}

/**
 * Get the id from a record in this order:
 *   1. id
 *   2. _id
 *   3. the `idField`
 * @param item
 */
export function getId(item, idField) {
  if (!item) {
    return
  }
  if (item.id != null || item.hasOwnProperty('id')) {
    return item.id
  }
  if (item._id != null || item.hasOwnProperty('_id')) {
    return item._id
  }
  if (item[idField] != null || item.hasOwnProperty(idField)) {
    return item[idField]
  }
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

export function updateOriginal(original, newData) {
  Object.keys(newData).forEach(key => {
    const newProp = newData[key]
    const oldProp = original[key]
    let shouldCopyProp = false

    if (newProp === oldProp) {
      return
    }

    // If the old item doesn't already have this property, update it
    if (!original.hasOwnProperty(key)) {
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
      if (original.hasOwnProperty(key)) {
        original[key] = newProp
      } else {
        Vue.set(original, key, newProp)
      }
    }
  })
}

//@ts-ignore
export function getQueryInfo(params: Params = {}, response: Paginated = {}) {
  const query = params.query || {}
  const qid = params.qid || 'default'
  const $limit =
    response.limit !== null && response.limit !== undefined
      ? response.limit
      : query.$limit
  const $skip =
    response.skip !== null && response.skip !== undefined
      ? response.skip
      : query.$skip

  const queryParams = _omit(query, ['$limit', '$skip'])
  const queryId = stringify(queryParams)
  const pageParams = $limit !== undefined ? { $limit, $skip } : undefined
  const pageId = pageParams ? stringify(pageParams) : undefined

  return {
    qid,
    query,
    queryId,
    queryParams,
    pageParams,
    pageId
  }
}

export function getItemsFromQueryInfo(pagination, queryInfo, keyedById) {
  const { queryId, pageId } = queryInfo
  const queryLevel = pagination[queryId]
  const pageLevel = queryLevel && queryLevel[pageId]
  const ids = pageLevel && pageLevel.ids

  if (ids && ids.length) {
    return ids.map(id => keyedById[id])
  } else {
    return []
  }
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
export function getServicePath(service: any, Model: 'any') {
  // @ts-ignore
  if (!service.name && !service.path && !Model.servicePath) {
    throw new Error(
      `Service for model named ${
        // @ts-ignore
        Model.name
      } is missing a path or name property. The feathers adapter needs to be updated with a PR to expose this property. You can work around this by adding a static servicePath =  passing a 'servicePath' attribute in the options: makeServicePlugin({servicePath: '/path/to/my/service'})`
    )
  }
  // @ts-ignore
  return service.path || service.name || Model.servicePath
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
  const id = getId(model, idField)
  const storedModel = store.state[model.constructor.namespace].keyedById[id]

  return { model, storedModel }
}

export function isBaseModelInstance(item) {
  const baseModels = Object.keys(models).map(alias => models[alias].BaseModel)
  return !!baseModels.find(BaseModel => {
    return item instanceof BaseModel
  })
}

export function mergeWithAccessors(
  dest,
  source,
  blacklist = ['__isClone', '__ob__']
) {
  const sourceProps = Object.getOwnPropertyNames(source)
  const destProps = Object.getOwnPropertyNames(dest)
  let sourceIsVueObservable = sourceProps.includes('__ob__')
  let destIsVueObservable = destProps.includes('__ob__')
  sourceProps.forEach(key => {
    const sourceDesc = Object.getOwnPropertyDescriptor(source, key)
    const destDesc = Object.getOwnPropertyDescriptor(dest, key)

    // if (Array.isArray(source[key]) && source[key].find(i => i.__ob__)) {
    //   sourceIsVueObservable = true
    // }
    // if (Array.isArray(dest[key]) && dest[key].find(i => i.__ob__)) {
    //   destIsVueObservable = true
    // }

    // This might have to be uncommented, but we'll try it this way, for now.
    // if (!sourceDesc.enumerable) {
    //   return
    // }

    // If the destination is not writable, return. Also ignore blacklisted keys.
    // Must explicitly check if writable is false
    if ((destDesc && destDesc.writable === false) || blacklist.includes(key)) {
      return
    }

    // Handle Vue observable objects
    if (destIsVueObservable || sourceIsVueObservable) {
      const isObject = _isObject(source[key])
      const isFeathersVuexInstance =
        isObject &&
        !!(
          source[key].constructor.modelName || source[key].constructor.namespace
        )
      // Do not use fastCopy directly on a feathers-vuex BaseModel instance to keep from breaking reactivity.
      if (isObject && !isFeathersVuexInstance) {
        try {
          const sourceObject = source[key]
          dest[key] = fastCopy(source[key])
        } catch (err) {
          if (!err.message.includes('getter')) {
            throw err
          }
        }
      } else {
        try {
          dest[key] = source[key]
        } catch (err) {
          if (!err.message.includes('getter')) {
            throw err
          }
        }
      }
      return
    }

    // Handle defining accessors
    if (
      typeof sourceDesc.get === 'function' ||
      typeof sourceDesc.set === 'function'
    ) {
      Object.defineProperty(dest, key, sourceDesc)
      return
    }

    // Do not attempt to overwrite a getter in the dest object
    if (destDesc && typeof destDesc.get === 'function') {
      return
    }

    // Assign values
    // Do not allow sharing of deeply-nested objects between instances
    // Potentially breaks accessors on nested data. Needs recursion if this is an issue
    if (_isObject(sourceDesc.value) && !isBaseModelInstance(sourceDesc.value)) {
      var value = fastCopy(sourceDesc.value)
    }
    dest[key] = value || sourceDesc.value
  })
  return dest
}

export function checkNamespace(namespace, item, debug) {
  if (!namespace && debug) {
    // eslint-disable-next-line no-console
    console.error(
      'A `namespace` was not available on the Model for this item:',
      item,
      'this can be caused by not passing the Model into the makeServicePlugin function'
    )
  }
  return namespace !== null && namespace !== undefined
}

export function assignIfNotPresent(Model, props): void {
  for (let key in props) {
    if (!Model.hasOwnProperty(key)) {
      Model[key] = props[key]
    }
  }
}
