import fastCopy from 'fast-copy'
import isPlainObject from 'lodash.isplainobject'
import merge from 'lodash.merge'
import { updateOriginal } from '../utils'

const defaults = {
  idField: 'id',
  preferUpdate: false,
  instanceDefaults: {}
}

export default function (options) {
  options = Object.assign({}, defaults, options)
  const { idField, preferUpdate, globalModels, modelName } = options
  const instanceDefaults = options.instanceDefaults || {}

  class FeathersVuexModel {
    constructor (data = {}, options = {}) {
      const { store, namespace } = this.constructor
      const existingItem = data[idField] && FeathersVuexModel.getFromStore(data[idField])
      const _relationships = {}
      let fnDefaults

      if (options.isClone) {
        Object.defineProperty(this, 'isClone', { value: true })
      }

      Object.defineProperty(this, 'isFeathersVuexInstance', { value: true })

      if (existingItem && !options.isClone) {
        if (!data.isFeathersVuexInstance) {
          updateOriginal(data, existingItem)
        }
        return existingItem
      }

      // Don't modify the original instanceDefaults. Clone it with accessors intact
      if (typeof instanceDefaults === 'function') {
        fnDefaults = instanceDefaults(data, { store, Model: this.constructor, Models: globalModels })
      }
      const _instanceDefaults = cloneWithAccessors(fnDefaults || instanceDefaults)

      Object.keys(_instanceDefaults).forEach(key => {
        // Prevent getters and setters from firing before the instance is constructed
        const desc = Object.getOwnPropertyDescriptor(_instanceDefaults, key)
        if (desc.get || desc.set || typeof desc.value === 'function') {
          return
        }

        // If the default value for an instanceDefault matches a model name...
        const modelName = _instanceDefaults[key]
        if (globalModels.hasOwnProperty(modelName)) {
          // Store the relationship
          _relationships[key] = globalModels[modelName]
          // Reset the instance default for this prop to null
          _instanceDefaults[key] = null
        }

        // Or if the value is a Date
        if (modelName === Date) {
          // Store the relationships
          _relationships[key] = Date

          // Reset the instance default for this prop to null
          _instanceDefaults[key] = null
        }
      })

      // Check the relationships to instantiate.
      Object.keys(_relationships).forEach(prop => {
        const Model = _relationships[prop]
        const related = data[prop]

        if (related) {
          // Handle arrays
          if (Array.isArray(related)) {
            related.forEach((item, index) => {
              if (Model === Date) {
                related[index] = new Date(item)
              } else {
                const { model, storedModel } = createRelatedInstance({ item, Model, idField, store })

                // Replace the original array index with a reference to the model
                related[index] = storedModel || model
              }
            })

          // Handle objects
          } else {
            if (Model === Date) {
              data[prop] = new Date(data[prop])
            } else {
              const { model, storedModel } = createRelatedInstance({ item: related, Model, idField, store })

              // Replace the data's prop value with a reference to the model
              data[prop] = storedModel || model
            }
          }
        }
      })

      // Copy all instanceDefaults, including accessors
      const props = Object.getOwnPropertyNames(_instanceDefaults)
      props.forEach(key => {
        var desc = Object.getOwnPropertyDescriptor(_instanceDefaults, key)
        Object.defineProperty(this, key, desc)
      })

      // Copy over all instance data
      const dataProps = Object.getOwnPropertyNames(data)
      dataProps.forEach(key => {
        const desc = Object.getOwnPropertyDescriptor(data, key)
        const propertyExists = this.hasOwnProperty(key)
        const isComputed = desc.get || desc.set || typeof desc.value === 'function'
        if (propertyExists && isComputed) {
          return
        }
        Object.defineProperty(this, key, desc)
      })

      // If this record has an id, addOrUpdate the store
      if (data[idField] && !options.isClone && !options.skipCommit) {
        store.dispatch(`${namespace}/addOrUpdate`, this)
      }
    }

    clone () {
      if (this.isClone) {
        throw new Error('You cannot clone a copy')
      }
      const id = this[idField]

      return this._clone(id)
    }
    _clone (id) {}

    reset () {
      if (this.isClone) {
        const id = this[idField]
        this._reset(id)
      } else {
        throw new Error('You cannot reset a non-copy')
      }
    }
    _reset () {}

    commit () {
      if (this.isClone) {
        const id = this[idField]
        return this._commit(id)
      } else {
        throw new Error('You cannnot call commit on a non-copy')
      }
    }
    _commit (id) {}

    save (params) {
      if (this[idField]) {
        return preferUpdate
          ? this.update(params)
          : this.patch(params)
      } else {
        return this.create(params)
      }
    }

    create (params) {
      const data = Object.assign({}, this)
      if (data[idField] === null) {
        delete data[idField]
      }
      return this._create(data, params)
    }
    _create (data, params) {}

    patch (params) {
      if (!this[idField]) {
        const error = new Error(`Missing ${idField} property. You must create the data before you can patch with this data`, this)
        return Promise.reject(error)
      }
      return this._patch(this[idField], this, params)
    }
    _patch () {}

    update (params) {
      if (!this[idField]) {
        const error = new Error(`Missing ${idField} property. You must create the data before you can update with this data`, this)
        return Promise.reject(error)
      }
      return this._update(this[idField], this, params)
    }
    _update () {}

    remove (params) {
      return this._remove(this[idField], params)
    }
    _remove () {}

    toJSON () {
      return merge({}, this)
    }
  }

  Object.assign(FeathersVuexModel, {
    options,
    copiesById: {}, // For cloned data
    modelName
  })

  return FeathersVuexModel
}

function createRelatedInstance ({ item, Model, idField, store }) {
  // Create store instances (if data contains an idField)
  const model = new Model(item)
  const id = model[idField]
  const storedModel = store.state[model.constructor.namespace].keyedById[id]

  return { model, storedModel }
}

function cloneWithAccessors (obj) {
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
