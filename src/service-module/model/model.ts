/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import fastCopy from 'fast-copy'
import isPlainObject from 'lodash.isplainobject'
import merge from 'lodash.merge'
import { getShortName, getNameFromPath } from '../../utils'
// import { updateOriginal } from '../../utils'

const defaults = {
  idField: 'id',
  nameStyle: 'short',
  preferUpdate: false,
  instanceDefaults: {}
}

interface FeathersVuexModelOptions {
  idField?: string
  preferUpdate?: boolean
  nameStyle?: string
  namespace?: string
  store: any
}

function makeModel(options: FeathersVuexModelOptions) {
  options = Object.assign({}, defaults, options)
  const { idField, preferUpdate, nameStyle, store } = options
  let { namespace } = options
  const nameStyles = {
    short: getShortName,
    path: getNameFromPath
  }
  const servicePath = 'test'
  namespace = namespace || nameStyles[nameStyle](servicePath)

  return class FeathersVuexModel {
    protected isClone: boolean

    // static copiesById: Object
    public static idField: string = idField
    // static instanceDefaults: Object
    // public static modelName: string
    // public static options: FeathersVuexModelOptions
    public static preferUpdate: boolean = preferUpdate
    private static globalModels: Record<string, any>
    protected static nameStyle = nameStyle
    public static namespace: string = namespace
    public static store: any = store

    // public static getFromStore(id: string) {}
    public static getId(record: Record<string, any>): string {
      return record[FeathersVuexModel.idField]
    }

    public constructor() {}

    public clone() {
      if (this.isClone) {
        throw new Error('You cannot clone a copy')
      }
      const id = this[FeathersVuexModel.idField]

      return this._clone(id)
    }
    public _clone(id) {}

    public reset() {
      if (this.isClone) {
        const id = this[FeathersVuexModel.idField]
        this._reset(id)
      } else {
        throw new Error('You cannot reset a non-copy')
      }
    }
    public _reset(id: string) {}

    public commit() {
      if (this.isClone) {
        const id = this[FeathersVuexModel.idField]
        return this._commit(id)
      } else {
        throw new Error('You cannnot call commit on a non-copy')
      }
    }
    public _commit(id) {}

    public save(params) {
      if (this[idField]) {
        return preferUpdate ? this.update(params) : this.patch(params)
      } else {
        return this.create(params)
      }
    }

    public create(params) {
      const data = Object.assign({}, this)
      if (data[idField] === null) {
        delete data[idField]
      }
      // return store.dispatch(`${namespace}/create`, [data, params])
      // return this._create(data, params)
    }
    public _create(data, params) {}

    public patch(params) {
      if (!this[idField]) {
        const error = new Error(
          `Missing ${idField} property. You must create the data before you can patch with this data`
        )
        return Promise.reject(error)
      }
      // return this._patch(this[idField], this, params)
    }
    public _patch(idField: string) {}

    public update(params) {
      if (!this[idField]) {
        const error = new Error(
          `Missing ${idField} property. You must create the data before you can update with this data`
        )
        return Promise.reject(error)
      }
      // return this._update(this[idField], this, params)
    }
    public _update() {}

    public remove(params) {
      // return this._remove(this[idField], params)
    }
    public _remove() {}

    public toJSON() {
      return merge({}, this)
    }
  }
}

function createRelatedInstance({ item, Model, idField, store }) {
  // Create store instances (if data contains an idField)
  const model = new Model(item)
  const id = model[idField]
  const storedModel = store.state[model.constructor.namespace].keyedById[id]

  return { model, storedModel }
}

function cloneWithAccessors(obj) {
  const clone = {}

  const props = Object.getOwnPropertyNames(obj)
  props.forEach(key => {
    const desc = Object.getOwnPropertyDescriptor(obj, key)

    // Do not allow sharing of deeply-nested objects between instances
    if (isPlainObject(desc.value)) {
      desc.value = fastCopy(desc.value)
    }

    Object.defineProperty(clone, key, desc)
  })

  return clone
}

export default makeModel
