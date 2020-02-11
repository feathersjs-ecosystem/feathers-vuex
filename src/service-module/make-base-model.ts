/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { FeathersVuexOptions } from './types'
import { globalModels, prepareAddModel } from './global-models'
import { mergeWithAccessors, checkNamespace, getId } from '../utils'
import _merge from 'lodash/merge'
import _get from 'lodash/get'
import EventEmitter from 'events'

// A hack to prevent error with this.constructor.preferUpdate
interface Function {
  preferUpdate: boolean
}

interface BaseModelInstanceOptions {
  clone?: boolean
  commit?: boolean
  merge?: boolean
}
interface ChildClassOptions {
  merge?: boolean
}

const defaultOptions = {
  clone: false,
  commit: true,
  merge: true
}

/**
 *
 * @param options
 */
export default function makeBaseModel(options: FeathersVuexOptions) {
  const addModel = prepareAddModel(options)
  const { serverAlias } = options

  // If this serverAlias already has a BaseModel, nreturn it
  const ExistingBaseModel = _get(globalModels, `[${serverAlias}].BaseModel`)
  if (ExistingBaseModel) {
    return ExistingBaseModel
  }

  abstract class BaseModel {
    // Think of these as abstract static properties
    public static servicePath: string
    public static namespace: string
    public static keepCopiesInStore = options.keepCopiesInStore
    // eslint-disable-next-line
    public static instanceDefaults(data, { models, store }) {
      return data
    }
    // eslint-disable-next-line
    public static setupInstance(data, { models, store }) {
      return data
    }
    public static diffOnPatch(data) {
      return data
    }

    // Monkey patched onto the Model class in `makeServicePlugin()`
    public static store: Record<string, any>

    public static idField: string = options.idField
    public static tempIdField: string = options.tempIdField
    public static preferUpdate: boolean = options.preferUpdate
    public static serverAlias: string = options.serverAlias

    public static readonly models = globalModels // Can access other Models here
    public static copiesById = {}

    public __id: string
    public __isClone: boolean
    public data: Record<string, any>

    public static merge = mergeWithAccessors
    public static modelName = 'BaseModel'

    public constructor(data, options: BaseModelInstanceOptions) {
      // You have to pass at least an empty object to get a tempId.
      data = data || {}
      options = Object.assign({}, defaultOptions, options)

      const {
        store,
        keepCopiesInStore,
        copiesById: copiesByIdOnModel,
        models,
        instanceDefaults,
        idField,
        tempIdField,
        setupInstance,
        getFromStore,
        namespace,
        _commit
      } = this.constructor as typeof BaseModel
      const id = getId(data, idField)
      const hasValidId = id !== null && id !== undefined
      const tempId =
        data && data.hasOwnProperty(tempIdField) ? data[tempIdField] : undefined
      const hasValidTempId = tempId !== null && tempId !== undefined
      const copiesById = keepCopiesInStore
        ? store.state[namespace].copiesById
        : copiesByIdOnModel

      const existingItem =
        hasValidId && !options.clone
          ? getFromStore.call(this.constructor, id)
          : null

      // If it already exists, update the original and return
      if (existingItem) {
        data = setupInstance.call(this, data, { models, store }) || data
        _commit.call(this.constructor, 'mergeInstance', data)
        return existingItem
      }

      // If cloning and a clone already exists, update and return the original clone. Only one clone is allowed.
      const existingClone =
        (hasValidId || hasValidTempId) && options.clone
          ? copiesById[id] || copiesById[tempId]
          : null
      if (existingClone) {
        // This must be done in a mutation to avoid Vuex errors.
        _commit.call(this.constructor, 'merge', {
          dest: existingClone,
          source: data
        })
        return existingClone
      }

      // Mark as a clone
      if (options.clone) {
        Object.defineProperty(this, '__isClone', {
          value: true,
          enumerable: false
        })
      }

      // Setup instanceDefaults
      if (instanceDefaults && typeof instanceDefaults === 'function') {
        const defaults =
          instanceDefaults.call(this, data, { models, store }) || data
        mergeWithAccessors(this, defaults)
      }

      // Handles Vue objects or regular ones. We can't simply assign or return
      // the data due to how Vue wraps everything into an accessor.
      if (options.merge !== false) {
        mergeWithAccessors(
          this,
          setupInstance.call(this, data, { models, store }) || data
        )
      }

      // Add the item to the store
      if (!options.clone && options.commit !== false && store) {
        _commit.call(this.constructor, 'addItem', this)
      }
      return this
    }

    public static getId(record: Record<string, any>): string {
      const { idField } = this.constructor as typeof BaseModel
      return getId(record, idField)
    }

    public static find(params) {
      return this._dispatch('find', params)
    }

    public static findInStore(params) {
      return this._getters('find', params)
    }

    public static get(id, params) {
      if (params) {
        return this._dispatch('get', [id, params])
      } else {
        return this._dispatch('get', id)
      }
    }

    public static getFromStore(id, params?) {
      if (params) {
        return this._getters('get', [id, params])
      } else {
        return this._getters('get', id)
      }
    }

    /**
     * An alias for store.getters
     * @param method the vuex getter name without the namespace
     * @param payload if provided, the getter will be called as a function
     */
    public static _getters(name: string, payload?: any) {
      const { namespace, store } = this

      if (checkNamespace(namespace, this, options.debug)) {
        if (!store.getters.hasOwnProperty(`${namespace}/${name}`)) {
          throw new Error(`Could not find getter named ${namespace}/${name}`)
        }
        if (payload !== undefined) {
          return store.getters[`${namespace}/${name}`](payload)
        } else {
          return store.getters[`${namespace}/${name}`]
        }
      }
    }
    /**
     * An alias for store.commit
     * @param method the vuex mutation name without the namespace
     * @param payload the payload for the mutation
     */
    public static _commit(method: string, payload: any): void {
      const { namespace, store } = this

      if (checkNamespace(namespace, this, options.debug)) {
        store.commit(`${namespace}/${method}`, payload)
      }
    }
    /**
     * An alias for store.dispatch
     * @param method the vuex action name without the namespace
     * @param payload the payload for the action
     */
    public static _dispatch(method: string, payload: any) {
      const { namespace, store } = this

      if (checkNamespace(namespace, this, options.debug)) {
        return store.dispatch(`${namespace}/${method}`, payload)
      }
    }

    /**
     * make the server side documents hydrated on client a FeathersVuexModel
     */
    public static hydrateAll() {
      const { namespace, store } = this
      const state = store.state[namespace]
      const commit = store.commit
      // Replace each plain object with a model instance.
      Object.keys(state.keyedById).forEach(id => {
        const record = state.keyedById[id]
        commit(`${namespace}/removeItem`, record)
        commit(`${namespace}/addItem`, record)
      })
    }

    /**
     * clone the current record using the `createCopy` mutation
     */
    public clone() {
      const { idField, tempIdField } = this.constructor as typeof BaseModel
      if (this.__isClone) {
        throw new Error('You cannot clone a copy')
      }
      const id =
        getId(this, idField) != null ? getId(this, idField) : this[tempIdField]
      return this._clone(id)
    }

    private _clone(id) {
      const { store, namespace, _commit, _getters } = this
        .constructor as typeof BaseModel
      const { keepCopiesInStore } = store.state[namespace]

      _commit.call(this.constructor, `createCopy`, id)

      if (keepCopiesInStore) {
        return _getters.call(this.constructor, 'getCopyById', id)
      } else {
        // const { copiesById } = this.constructor as typeof BaseModel
        return (this.constructor as typeof BaseModel).copiesById[id]
      }
    }
    /**
     * Reset a clone to match the instance in the store.
     */
    public reset() {
      const { idField, tempIdField, _commit } = this
        .constructor as typeof BaseModel

      if (this.__isClone) {
        const id =
          getId(this, idField) != null
            ? getId(this, idField)
            : this[tempIdField]
        _commit.call(this.constructor, 'resetCopy', id)
        return this
      } else {
        throw new Error('You cannot reset a non-copy')
      }
    }

    /**
     * Update a store instance to match a clone.
     */
    public commit() {
      const { idField, tempIdField, _commit, _getters } = this
        .constructor as typeof BaseModel
      if (this.__isClone) {
        const id =
          getId(this, idField) != null
            ? getId(this, idField)
            : this[tempIdField]
        _commit.call(this.constructor, 'commitCopy', id)

        return _getters.call(this.constructor, 'get', id)
      } else {
        throw new Error('You cannot call commit on a non-copy')
      }
    }

    /**
     * A shortcut to either call create or patch/update
     * @param params
     */
    public save(params) {
      const { idField, preferUpdate } = this.constructor as typeof BaseModel
      const id = getId(this, idField)
      if (id != null) {
        return preferUpdate ? this.update(params) : this.patch(params)
      } else {
        return this.create(params)
      }
    }
    /**
     * Calls service create with the current instance data
     * @param params
     */
    public create(params) {
      const { _dispatch } = this.constructor as typeof BaseModel
      const data = Object.assign({}, this)
      if (data[options.idField] === null) {
        delete data[options.idField]
      }
      return _dispatch.call(this.constructor, 'create', [data, params])
    }

    /**
     * Calls service patch with the current instance data
     * @param params
     */
    public patch(params?) {
      const { idField, _dispatch } = this.constructor as typeof BaseModel
      const id = getId(this, idField)

      if (id == null) {
        const error = new Error(
          `Missing ${idField} property. You must create the data before you can patch with this data`
        )
        return Promise.reject(error)
      }
      return _dispatch.call(this.constructor, 'patch', [id, this, params])
    }

    /**
     * Calls service update with the current instance data
     * @param params
     */
    public update(params) {
      const { idField, _dispatch } = this.constructor as typeof BaseModel
      const id = getId(this, idField)

      if (!id) {
        const error = new Error(
          `Missing ${idField} property. You must create the data before you can update with this data`
        )
        return Promise.reject(error)
      }
      return _dispatch.call(this.constructor, 'update', [id, this, params])
    }

    /**
     * Calls service remove with the current instance id
     * @param params
     */
    public remove(params) {
      const { idField, tempIdField, _dispatch, _commit } = this
        .constructor as typeof BaseModel
      const id = getId(this, idField)

      if (id != null) {
        if (params && params.eager) {
          _commit.call(this.constructor, 'removeItem', id)
        }
        return _dispatch.call(this.constructor, 'remove', [id, params])
      } else {
        _commit.call(this.constructor, 'removeTemps', [this[tempIdField]])
        return Promise.resolve(this)
      }
    }

    public toJSON() {
      return _merge({}, this)
    }
  }
  for (const n in EventEmitter.prototype) {
    BaseModel[n] = EventEmitter.prototype[n]
  }

  addModel(BaseModel)
  return BaseModel
}
