/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { FeathersVuexOptions } from './types'
import { globalModels, prepareAddModel } from './global-models'
import { mergeWithAccessors, separateAccessors } from '../utils'
import { get as _get } from 'lodash'

interface BaseConstructor {
  store: {}
}
interface BaseModelConstructorOptions {
  isClone?: boolean
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
    // Monkey patched onto the Model class in `makeServicePlugin()`
    public static store: Record<string, any>
    public static namespace: string
    public static servicePath: string

    public static instanceDefaults

    public static idField: string = options.idField
    public static preferUpdate: boolean = options.preferUpdate
    public static serverAlias: string = options.serverAlias

    public static readonly models = globalModels // Can access other Models here
    public static readonly copiesById = {}

    protected __isClone: boolean

    public data: Record<string, any>

    public static merge = mergeWithAccessors

    public constructor(
      data,
      options: BaseModelConstructorOptions = {},
      childClassOptions: ChildClassOptions = { merge: true }
    ) {
      data = data || {}
      const { merge } = childClassOptions
      const { idField } = BaseModel
      const id = data[idField]
      const hasValidId = !options.isClone && id !== null && id !== undefined

      // Update original item if it already exists.
      if (hasValidId) {
        const existingItem = BaseModel.getFromStore(id)
        if (existingItem) {
          BaseModel.commit('updateItem', data)
          return existingItem
        }
      }

      if (options.isClone) {
        Object.defineProperty(this, '__isClone', {
          value: true,
          enumerable: false,
          writable: false
        })
      }

      if (BaseModel.instanceDefaults) {
        const instanceDefaults = BaseModel.instanceDefaults()
        const separatedDefaults = separateAccessors(instanceDefaults)
        mergeWithAccessors(this, separatedDefaults.accessors)
        mergeWithAccessors(this, separatedDefaults.values)
      }

      // Handles Vue objects or regular ones. We can't simply assign or return
      // the data due to how Vue wraps everything into an accessor.
      mergeWithAccessors(this, data)

      // Add the item to the store
      if (hasValidId && merge !== false) {
        BaseModel.commit('addItem', this)
      }
      return this
    }

    public static getId(record: Record<string, any>): string {
      return record[BaseModel.idField]
    }

    public static find(params) {
      this.dispatch('find', params)
    }

    public static findInStore(params) {
      return BaseModel.getters('find', params)
    }

    public static get(id, params) {
      if (params) {
        return BaseModel.dispatch('get', [id, params])
      } else {
        return BaseModel.dispatch('get', id)
      }
    }

    public static getFromStore(id, params?) {
      if (params) {
        return BaseModel.getters('get', [id, params])
      } else {
        return BaseModel.getters('get', id)
      }
    }

    /**
     * An alias for store.getters
     * @param method the vuex getter name without the namespace
     * @param payload if provided, the getter will be called as a function
     */
    public static getters(name: string, payload?: any) {
      if (payload !== undefined) {
        return BaseModel.store.getters[`${BaseModel.namespace}/${name}`](
          payload
        )
      } else {
        return BaseModel.store.getters[`${BaseModel.namespace}/${name}`]
      }
    }
    /**
     * An alias for store.commit
     * @param method the vuex mutation name without the namespace
     * @param payload the payload for the mutation
     */
    public static commit(method: string, payload: any): void {
      BaseModel.store.commit(`${BaseModel.namespace}/${method}`, payload)
    }
    /**
     * An alias for store.dispatch
     * @param method the vuex action name without the namespace
     * @param payload the payload for the action
     */
    public static dispatch(method: string, payload: any) {
      return BaseModel.store.dispatch(
        `${BaseModel.namespace}/${method}`,
        payload
      )
    }

    /**
     * clone the current record using the `createCopy` mutation
     */
    public clone() {
      if (this.__isClone) {
        throw new Error('You cannot clone a copy')
      }
      const id = this[BaseModel.idField]
      return this._clone(id)
    }

    private _clone(id) {
      const { store, copiesById, namespace } = BaseModel
      const { keepCopiesInStore } = store.state[namespace]
      // const { store } = this.constructor
      store.commit(`${namespace}/createCopy`, id)

      if (keepCopiesInStore) {
        return BaseModel.getters('getCopyById', id)
      } else {
        return copiesById[id]
      }
    }

    /**
     * Reset a clone to match the instance in the store.
     */
    public reset() {
      if (this.__isClone) {
        const id = this[BaseModel.idField]
        BaseModel.commit('resetCopy', id)
      } else {
        throw new Error('You cannot reset a non-copy')
      }
    }

    /**
     * Update a store instance to match a clone.
     */
    public commit() {
      if (this.__isClone) {
        const id = this[BaseModel.idField]
        BaseModel.commit('commitCopy', id)

        return this
      } else {
        throw new Error('You cannnot call commit on a non-copy')
      }
    }

    /**
     * A shortcut to either call create or patch/update
     * @param params
     */
    public save(params) {
      if (this[options.idField]) {
        return options.preferUpdate ? this.update(params) : this.patch(params)
      } else {
        return this.create(params)
      }
    }
    /**
     * Calls service create with the current instance data
     * @param params
     */
    public create(params) {
      const { store } = BaseModel
      const data = Object.assign({}, this)
      if (data[options.idField] === null) {
        delete data[options.idField]
      }
      return BaseModel.dispatch('create', [data, params])
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
      return BaseModel.dispatch('patch', [
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
      return BaseModel.dispatch('update', [
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
      return BaseModel.dispatch('remove', [this[BaseModel.idField], params])
    }
  }
  addModel(BaseModel)
  return BaseModel
}
