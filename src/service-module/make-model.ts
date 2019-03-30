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
}
interface ChildClassOptions {
  merge?: boolean
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
    public static instanceDefaults
    public static serialize

    // Monkey patched onto the Model class in `makeServicePlugin()`
    public static store: Record<string, any>

    public static idField: string = options.idField
    public static tempIdField: string = options.tempIdField
    public static preferUpdate: boolean = options.preferUpdate
    public static serverAlias: string = options.serverAlias

    public static readonly models = globalModels // Can access other Models here
    public static readonly copiesById = {}

    protected __isClone: boolean

    public __id: string
    public data: Record<string, any>

    public static merge = mergeWithAccessors

    public constructor(
      data,
      options: BaseModelInstanceOptions = {},
      childClassOptions: ChildClassOptions = { merge: true }
    ) {
      data = data || {}
      const { merge } = childClassOptions
      const { idField, tempIdField } = BaseModel
      const id = data[idField] || data[tempIdField]
      const hasValidId = id !== null && id !== undefined

      // If it already exists, update the original and return
      if (hasValidId && !options.clone) {
        const existingItem = BaseModel.getFromStore.call(this, id)
        if (existingItem) {
          BaseModel._commit('updateItem', data)
          return existingItem
        }
      }

      // Mark as a clone
      if (options.clone) {
        Object.defineProperty(this, '__isClone', {
          value: true,
          enumerable: false,
          writable: false
        })
      }

      // Setup instanceDefaults, separate out accessors
      if (BaseModel.instanceDefaults) {
        const instanceDefaults = BaseModel.instanceDefaults()
        const separatedDefaults = separateAccessors(instanceDefaults)
        mergeWithAccessors(this, separatedDefaults.accessors)
        mergeWithAccessors(this, separatedDefaults.values)
      }

      // Handles Vue objects or regular ones. We can't simply assign or return
      // the data due to how Vue wraps everything into an accessor.
      if (merge !== false) {
        mergeWithAccessors(this, data)
      }

      // Add the item to the store
      if (!options.clone && options.commit !== false && BaseModel.store) {
        BaseModel._commit.call(this, 'addItem', this)
      }
      return this
    }

    public static getId(record: Record<string, any>): string {
      return record[BaseModel.idField]
    }

    public static find(params) {
      BaseModel._dispatch.call('find', params)
    }

    public static findInStore(params) {
      return BaseModel._getters('find', params)
    }

    public static get(id, params) {
      if (params) {
        return BaseModel._dispatch.call(this, 'get', [id, params])
      } else {
        return BaseModel._dispatch.call(this, 'get', id)
      }
    }

    public static getFromStore(id, params?) {
      if (params) {
        return BaseModel._getters.call(this, 'get', [id, params])
      } else {
        return BaseModel._getters.call(this, 'get', id)
      }
    }

    /**
     * An alias for store.getters
     * @param method the vuex getter name without the namespace
     * @param payload if provided, the getter will be called as a function
     */
    public static _getters(name: string, payload?: any) {
      const { namespace } = this.constructor as typeof BaseModel
      checkNamespace(namespace, this)
      if (payload !== undefined) {
        return BaseModel.store.getters[`${namespace}/${name}`](payload)
      } else {
        return BaseModel.store.getters[`${namespace}/${name}`]
      }
    }
    /**
     * An alias for store.commit
     * @param method the vuex mutation name without the namespace
     * @param payload the payload for the mutation
     */
    public static _commit(method: string, payload: any): void {
      const { namespace } = this.constructor as typeof BaseModel
      checkNamespace(namespace, this)

      BaseModel.store.commit(`${namespace}/${method}`, payload)
    }
    /**
     * An alias for store.dispatch
     * @param method the vuex action name without the namespace
     * @param payload the payload for the action
     */
    public static _dispatch(method: string, payload: any) {
      const { namespace } = this.constructor as typeof BaseModel
      checkNamespace(namespace, this)
      return BaseModel.store.dispatch(`${namespace}/${method}`, payload)
    }

    /**
     * clone the current record using the `createCopy` mutation
     */
    public clone() {
      if (this.__isClone) {
        throw new Error('You cannot clone a copy')
      }
      const id = this[BaseModel.idField] || this[BaseModel.tempIdField]
      return this._clone(id)
    }

    private _clone(id) {
      const { store, copiesById, namespace } = this
        .constructor as typeof BaseModel
      checkNamespace(namespace, this)
      const { keepCopiesInStore } = store.state[namespace]
      // const { store } = this.constructor
      store.commit(`${namespace}/createCopy`, id)

      if (keepCopiesInStore) {
        return BaseModel._getters('getCopyById', id)
      } else {
        return copiesById[id]
      }
    }
    /**
     * Reset a clone to match the instance in the store.
     */
    public reset() {
      if (this.__isClone) {
        const id = this[BaseModel.idField] || this[BaseModel.tempIdField]
        BaseModel._commit('resetCopy', id)
      } else {
        throw new Error('You cannot reset a non-copy')
      }
    }

    /**
     * Update a store instance to match a clone.
     */
    public commit() {
      if (this.__isClone) {
        const id = this[BaseModel.idField] || this[BaseModel.tempIdField]
        BaseModel._commit('commitCopy', id)

        return this
      } else {
        throw new Error('You cannot call commit on a non-copy')
      }
    }

    /**
     * A shortcut to either call create or patch/update
     * @param params
     */
    public save(params) {
      const id = this[options.idField]
      if (id) {
        const preferUpdate = Object.getPrototypeOf(this).constructor
          .preferUpdate
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
      const data = Object.assign({}, this)
      if (data[options.idField] === null) {
        delete data[options.idField]
      }
      return BaseModel._dispatch.call(this, 'create', [data, params])
    }

    /**
     * Calls service patch with the current instance data
     * @param params
     */
    public patch(params?) {
      if (!this[options.idField]) {
        const error = new Error(
          `Missing ${
            options.idField
          } property. You must create the data before you can patch with this data`
        )
        return Promise.reject(error)
      }
      return BaseModel._dispatch.call(this, 'patch', [
        this[BaseModel.idField],
        this,
        params
      ])
    }

    /**
     * Calls service update with the current instance data
     * @param params
     */
    public update(params) {
      if (!this[options.idField]) {
        const error = new Error(
          `Missing ${
            options.idField
          } property. You must create the data before you can update with this data`
        )
        return Promise.reject(error)
      }
      return BaseModel._dispatch.call(this, 'update', [
        this[BaseModel.idField],
        this,
        params
      ])
    }

    /**
     * Calls service remove with the current instance id
     * @param params
     */
    public remove(params) {
      return BaseModel._dispatch.call(this, 'remove', [
        this[BaseModel.idField],
        params
      ])
    }

    public toJSON() {
      const { serialize } = Object.getPrototypeOf(this).constructor
      const obj = serialize(this)
      const data = _merge({}, obj)
      return data
    }
  }
  addModel(BaseModel)
  return BaseModel
}
