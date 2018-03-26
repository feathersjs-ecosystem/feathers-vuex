const defaults = {
  idField: 'id',
  preferUpdate: false,
  instanceDefaults: {}
}

export default function (options) {
  options = Object.assign({}, defaults, options)
  const { idField, preferUpdate, instanceDefaults, globalModels } = options

  class FeathersVuexModel {
    constructor (data = {}, options = {}) {
      const { store, namespace } = this.constructor
      const relationships = {}

      Object.keys(instanceDefaults).forEach(key => {
        const modelName = instanceDefaults[key]

        // If the default value for an instanceDefault matches a model name...
        if (globalModels.hasOwnProperty(modelName)) {
          // Store the relationship
          relationships[key] = globalModels[modelName]
          // Reset the instance default for this prop to null
          instanceDefaults[key] = null
        }
      })

      if (options.isClone) {
        Object.defineProperty(this, 'isClone', { value: true })
      }

      Object.defineProperty(this, 'isFeathersVuexInstance', { value: true })

      // Check the relationships to
      Object.keys(relationships).forEach(prop => {
        const Model = relationships[prop]

        if (data[prop]) {
          // Create store instances (if data contains an idField)
          const model = new Model(data[prop])
          const id = model[idField]
          const storedModel = store.state[model.constructor.namespace].keyedById[id]

          // Replace the data's prop value with a reference to the model
          data[prop] = storedModel || model
        }
      })

      Object.assign(this, instanceDefaults, data)

      // If this record has an id, addOrUpdate the store
      if (data[idField]) {
        store.dispatch(`${namespace}/addOrUpdate`, this)
      }
    }

    // servicePath - the path of the service which this Model uses
    // store - a reference to the store gets added by service-module.js

    _addItem () {}

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
        this._commit(id)
      } else {
        throw new Error('You cannnot call commit on a non-copy')
      }
    }
    _commit (id) {}

    save () {
      if (this[idField]) {
        return preferUpdate ? this.update(null, this) : this.patch(null, this)
      } else {
        return this.create(this)
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

    patch (newData, params) {
      const data = newData || this

      if (!this[idField]) {
        const error = new Error(`Missing ${idField} property. You must create the data before you can patch with this data`, data)
        return Promise.reject(error)
      }
      return this._patch(this[idField], data, params)
    }
    _patch () {}

    update (newData, params) {
      const data = newData || this

      if (!this[idField]) {
        const error = new Error(`Missing ${idField} property. You must create the data before you can update with this data`, data)
        return Promise.reject(error)
      }
      return this._update(this[idField], data, params)
    }
    _update () {}

    remove () {
      return this._remove(this[idField])
    }
    _remove () {}
  }

  Object.assign(FeathersVuexModel, { options: options })

  return FeathersVuexModel
}
