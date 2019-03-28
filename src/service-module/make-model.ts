/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { FeathersVuexOptions } from './types'
import { globalModels, prepareAddModel } from './global-models'
import { mergeWithAccessors } from '../utils'
import { get as _get } from 'lodash'

interface BaseConstructor {
  store: {}
}
interface BaseModelConstructorOptions {
  isClone?: boolean
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

    public static idField: string = options.idField
    public static preferUpdate: boolean = options.preferUpdate
    public static serverAlias: string = options.serverAlias

    public static readonly models = globalModels // Can access other Models here
    public static readonly copiesById = {}

    protected isClone: boolean

    public data: Record<string, any>
    public constructor(data, options: BaseModelConstructorOptions = {}) {
      if (options.isClone) {
        Object.defineProperty(this, 'isClone', {
          value: true,
          enumerable: false,
          writable: false
        })
      }

      mergeWithAccessors(this, data)
    }

    public static getId(record: Record<string, any>): string {
      return record[BaseModel.idField]
    }

    public static find(params) {
      return BaseModel.store.dispatch(`${BaseModel.namespace}/find`, params)
    }

    public static findInStore(params) {
      return BaseModel.store.getters[`${BaseModel.namespace}/find`](params)
    }

    public static get(id, params) {
      const { store } = BaseModel
      if (params) {
        return store.dispatch(`${BaseModel.namespace}/get`, [id, params])
      } else {
        return store.dispatch(`${BaseModel.namespace}/get`, id)
      }
    }

    public static getFromStore(id, params) {
      const { store } = BaseModel
      if (params) {
        return store.getters[`${BaseModel.namespace}/get`]([id, params])
      } else {
        return store.getters[`${BaseModel.namespace}/get`](id)
      }
    }

    /**
     * clone the current record using the `createCopy` mutation
     */
    public clone() {
      if (this.isClone) {
        throw new Error('You cannot clone a copy')
      }
      const id = this[BaseModel.idField]
      return this._clone(id)
    }

    private _clone(id) {
      const { store, copiesById, namespace } = BaseModel
      // const { store } = this.constructor
      store.commit(`${namespace}/createCopy`, id)

      if (store.state[namespace].keepCopiesInStore) {
        return store.getters[`${namespace}/getCopyById`](id)
      } else {
        return copiesById[id]
      }
    }

    /**
     * Reset a clone to match the instance in the store.
     */
    public reset() {
      if (this.isClone) {
        const id = this[BaseModel.idField]
        BaseModel.store.commit(`${BaseModel.namespace}/resetCopy`, id)
      } else {
        throw new Error('You cannot reset a non-copy')
      }
    }

    /**
     * Update a store instance to match a clone.
     */
    public commit() {
      if (this.isClone) {
        const id = this[BaseModel.idField]
        BaseModel.store.commit(`${BaseModel.namespace}/commitCopy`, id)

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
      return store.dispatch(`${BaseModel.namespace}/create`, [data, params])
    }

    /**
     * Calls service patch with the current instance data
     * @param params
     */
    public patch(params) {
      if (!this[options.idField]) {
        const error = new Error(
          `Missing ${
            options.idField
          } property. You must create the data before you can patch with this data`
        )
        return Promise.reject(error)
      }
      return BaseModel.store.dispatch(`${BaseModel.namespace}/patch`, [
        this[options.idField],
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
      return BaseModel.store.dispatch(`${BaseModel.namespace}/update`, [
        this[options.idField],
        this,
        params
      ])
    }

    /**
     * Calls service remove with the current instance id
     * @param params
     */
    public remove(params) {
      return BaseModel.store.dispatch(`${BaseModel.namespace}/remove`, [
        this[options.idField],
        params
      ])
    }
  }
  addModel(BaseModel)
  return BaseModel
}
