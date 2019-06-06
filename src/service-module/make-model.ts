/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { FeathersVuexOptions } from './types'
import { globalModels, prepareAddModel } from './global-models'
import { mergeWithAccessors, separateAccessors, checkNamespace } from '../utils'
import { get as _get, merge as _merge } from 'lodash'

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
export default function makeModel(options: FeathersVuexOptions) {
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
    // eslint-disable-next-line
    public static instanceDefaults(data, { models, store }) {
      return data
    }
    // eslint-disable-next-line
    public static setupInstance(data, { models, store }) {
      return data
    }

    // Monkey patched onto the Model class in `makeServicePlugin()`
    public static store: Record<string, any>

    public static idField: string = options.idField
    public static tempIdField: string = options.tempIdField
    public static preferUpdate: boolean = options.preferUpdate
    public static serverAlias: string = options.serverAlias

    public static readonly models = globalModels // Can access other Models here
    public static readonly copiesById = {}

    public __id: string
    public __isClone: boolean
    public data: Record<string, any>

    public static merge = mergeWithAccessors
    public static modelName = 'BaseModel'

    public constructor(data, options: BaseModelInstanceOptions) {
      // You have to pass at least an empty object to get a tempId.
      const originalData = data
      options = Object.assign({}, defaultOptions, options)
      const {
        store,
        models,
        instanceDefaults,
        idField,
        tempIdField,
        setupInstance,
        getFromStore,
        _commit
      } = this.constructor as typeof BaseModel
      const id = data && (data[idField] || data[tempIdField])
      const hasValidId = id !== null && id !== undefined

      data = data || {}

      // If it already exists, update the original and return
      if (hasValidId && !options.clone) {
        const existingItem = getFromStore.call(this.constructor, id)
        if (existingItem) {
          _commit.call(this.constructor, 'updateItem', data)
          return existingItem
        }
      }

      // Mark as a clone
      if (options.clone) {
        Object.defineProperty(this, '__isClone', {
          value: true,
          enumerable: false
        })
      }

      // Setup instanceDefaults, separate out accessors
      if (instanceDefaults && typeof instanceDefaults === 'function') {
        const defaults = instanceDefaults.call(this, data, { models, store })
        const { accessors, values } = separateAccessors(defaults)
        mergeWithAccessors(this, accessors)
        mergeWithAccessors(this, values)
      }

      // Handles Vue objects or regular ones. We can't simply assign or return
      // the data due to how Vue wraps everything into an accessor.
      if (options.merge !== false) {
        mergeWithAccessors(
          this,
          setupInstance.call(this, data, { models, store })
        )
      }

      // Add the item to the store
      // Make sure originalData wasn't an empty object.
      if (!options.clone && options.commit !== false && store && originalData) {
        _commit.call(this.constructor, 'addItem', this)
      }
      return this
    }

    public static getId(record: Record<string, any>): string {
      const { idField } = this.constructor as typeof BaseModel
      return record[idField]
    }

    public static find(params) {
      this._dispatch('find', params)
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

      if (checkNamespace(namespace, this)) {
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

      if (checkNamespace(namespace, this)) {
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

      if (checkNamespace(namespace, this)) {
        return store.dispatch(`${namespace}/${method}`, payload)
      }
    }

    /**
     * clone the current record using the `createCopy` mutation
     */
    public clone() {
      const { idField, tempIdField } = this.constructor as typeof BaseModel
      if (this.__isClone) {
        throw new Error('You cannot clone a copy')
      }
      const id = this[idField] || this[tempIdField]
      return this._clone(id)
    }

    private _clone(id) {
      const { store, copiesById, namespace, _commit, _getters } = this
        .constructor as typeof BaseModel
      const { keepCopiesInStore } = store.state[namespace]

      _commit.call(this.constructor, `createCopy`, id)

      if (keepCopiesInStore) {
        return _getters.call(this.constructor, 'getCopyById', id)
      } else {
        return copiesById[id]
      }
    }
    /**
     * Reset a clone to match the instance in the store.
     */
    public reset() {
      const { idField, tempIdField, _commit } = this
        .constructor as typeof BaseModel
      if (this.__isClone) {
        const id = this[idField] || this[tempIdField]
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
        const id = this[idField] || this[tempIdField]
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
      const id = this[idField]
      if (id) {
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

      if (!this[idField]) {
        const error = new Error(
          `Missing ${
          options.idField
          } property. You must create the data before you can patch with this data`
        )
        return Promise.reject(error)
      }
      return _dispatch.call(this.constructor, 'patch', [
        this[idField],
        this,
        params
      ])
    }

    /**
     * Calls service update with the current instance data
     * @param params
     */
    public update(params) {
      const { idField, _dispatch } = this.constructor as typeof BaseModel

      if (!this[idField]) {
        const error = new Error(
          `Missing ${
          options.idField
          } property. You must create the data before you can update with this data`
        )
        return Promise.reject(error)
      }
      return _dispatch.call(this.constructor, 'update', [
        this[idField],
        this,
        params
      ])
    }

    /**
     * Calls service remove with the current instance id
     * @param params
     */
    public remove(params) {
      const { idField, tempIdField, _dispatch, _commit } = this
        .constructor as typeof BaseModel

      if (this.hasOwnProperty(idField)) {
        if (params && params.eager) {
          _commit.call(this.constructor, 'removeItem', this[idField])
        }
        return _dispatch.call(this.constructor, 'remove', [
          this[idField],
          params
        ])
      } else {
        _commit.call(this.constructor, 'removeTemps', [this[tempIdField]])
        return Promise.resolve(this)
      }
    }

    public toJSON() {
      return _merge({}, this)
    }
  }
  addModel(BaseModel)
  return BaseModel
}
