/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { GlobalOptions } from './types'
import globalModels from './global-models'
import { getNamespace } from '../../utils'
import Vue from 'vue'

/**
 *
 * @param options
 */
export default function makeModel(options: GlobalOptions) {
  abstract class FeathersVuexModel {
    abstract servicePath: string

    // Monkey patched onto the Model class in `makeServicePlugin()`
    public static namespace: string
    public static store: Record<string, any>

    public static idField: string = options.idField
    public static models = globalModels // Can access other Models here
    public static copiesById = {}
    public static serverAlias: string = options.serverAlias
    protected isClone: boolean

    public _data: Record<string, any>
    public constructor(data) {
      this._data = Vue.observable(data)
    }

    public static getId(record: Record<string, any>): string {
      return record[FeathersVuexModel.idField]
    }

    public static getNamespace() {
      // return (
      //   FeathersVuexModel.namespace ||
      //   getNamespace(FeathersVuexModel.servicePath, options.nameStyle)
      // )
    }

    public static find(params) {
      return FeathersVuexModel.store.dispatch(
        `${options.namespace}/find`,
        params
      )
    }

    public static findInStore(params) {
      return FeathersVuexModel.store.getters[`${options.namespace}/find`](
        params
      )
    }

    public static get(id, params) {
      const { store } = FeathersVuexModel
      if (params) {
        return store.dispatch(`${options.namespace}/get`, [id, params])
      } else {
        return store.dispatch(`${options.namespace}/get`, id)
      }
    }

    public static getFromStore(id, params) {
      const { store } = FeathersVuexModel
      if (params) {
        return store.getters[`${options.namespace}/get`]([id, params])
      } else {
        return store.getters[`${options.namespace}/get`](id)
      }
    }

    /**
     * Use the `createCopy` mutation to clone the current record. Return the
     * clone
     */
    public clone() {
      if (this.isClone) {
        throw new Error('You cannot clone a copy')
      }
      const id = this[FeathersVuexModel.idField]
      this._clone(id)
    }
    private _clone(id) {
      const { store, copiesById } = FeathersVuexModel
      store.commit(`${options.namespace}/createCopy`, id)

      if (store.state[options.namespace].keepCopiesInStore) {
        return store.getters[`${options.namespace}/getCopyById`](id)
      } else {
        return copiesById[id]
      }
    }

    /**
     * Reset a clone to match the instance in the store.
     */
    public reset() {
      if (this.isClone) {
        const id = this[FeathersVuexModel.idField]
        FeathersVuexModel.store.commit(`${options.namespace}/rejectCopy`, id)
      } else {
        throw new Error('You cannot reset a non-copy')
      }
    }

    /**
     * Update a store instance to match a clone.
     */
    public commit() {
      if (this.isClone) {
        const id = this[FeathersVuexModel.idField]
        FeathersVuexModel.store.commit(`${options.namespace}/commitCopy`, id)

        return this._clone(id)
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
      const { store } = FeathersVuexModel
      const data = Object.assign({}, this)
      if (data[options.idField] === null) {
        delete data[options.idField]
      }
      return store.dispatch(`${options.namespace}/create`, [data, params])
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
      return FeathersVuexModel.store.dispatch(`${options.namespace}/patch`, [
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
      return FeathersVuexModel.store.dispatch(`${options.namespace}/update`, [
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
      return FeathersVuexModel.store.dispatch(`${options.namespace}/remove`, [
        this[options.idField],
        params
      ])
    }
  }
  return FeathersVuexModel
}
