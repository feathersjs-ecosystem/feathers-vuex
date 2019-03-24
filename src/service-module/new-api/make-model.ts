/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import globalModels from './global-models'
import Vue from 'vue'

export default function makeModel(options) {
  abstract class FeathersVuexModel {
    abstract servicePath: string
    public static idField: string = options.idField
    public static models = globalModels // Can access other Models here
    public static copiesById = {}
    public static serverAlias: string = options.serverAlias
    public static store: Record<string, any>
    protected isClone: boolean

    public _data: Record<string, any>
    public constructor(data) {
      this._data = Vue.observable(data)
    }

    public static getId(record: Record<string, any>): string {
      return record[FeathersVuexModel.idField]
    }

    public clone() {
      const { store, copiesById } = FeathersVuexModel
      if (this.isClone) {
        throw new Error('You cannot clone a copy')
      }
      const id = this[FeathersVuexModel.idField]

      store.commit(`${options.namespace}/createCopy`, id)

      if (store.state[options.namespace].keepCopiesInStore) {
        return store.getters[`${options.namespace}/getCopyById`](id)
      } else {
        return copiesById[id]
      }
    }
  }
  return FeathersVuexModel
}
