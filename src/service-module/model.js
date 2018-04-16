const defaults = {
  idField: 'id',
  preferUpdate: false,
  instanceDefaults: {}
}

export default function (options) {
  options = Object.assign({}, defaults, options)
  const { idField, preferUpdate, instanceDefaults, globalModels } = options
  // Don't modify the original instanceDefaults. Clone it with accessors intact
  let _instanceDefaults = cloneWithAccessors(instanceDefaults)

  class FeathersVuexModel {
    constructor (data = {}, options = {}) {
      const { store, namespace } = this.constructor
      const relationships = {}

      Object.keys(_instanceDefaults).forEach(key => {
        const modelName = instanceDefaults[key]

        // If the default value for an instanceDefault matches a model name...
        if (globalModels.hasOwnProperty(modelName)) {
          // Store the relationship
          relationships[key] = globalModels[modelName]
          // Reset the instance default for this prop to null
          _instanceDefaults[key] = null
        }
      })

      if (options.isClone) {
        Object.defineProperty(this, 'isClone', { value: true })
      }

      Object.defineProperty(this, 'isFeathersVuexInstance', { value: true })

      // Check the relationships to instantiate.
      Object.keys(relationships).forEach(prop => {
        const Model = relationships[prop]
        const related = data[prop]

        if (related) {
          // Handle arrays
          if (Array.isArray(related)) {
            related.forEach((item, index) => {
              const { model, storedModel } = createRelatedInstance({ item, Model, idField, store })

              // Replace the original array value with a reference to the model
              related[index] = storedModel || model
            })

          // Handle objects
          } else {
            const { model, storedModel } = createRelatedInstance({ item: related, Model, idField, store })

            // Replace the data's prop value with a reference to the model
            data[prop] = storedModel || model
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
      Object.assign(this, data)

      // If this record has an id, addOrUpdate the store
      if (data[idField] && !options.isClone) {
        store.dispatch(`${namespace}/addOrUpdate`, this)
      }
    }

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
  }

  Object.assign(FeathersVuexModel, {
    options,
    copiesById: {} // For cloned data
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
  var clone = Object.create(Object.getPrototypeOf(obj))

  var props = Object.getOwnPropertyNames(obj)
  props.forEach(key => {
    var desc = Object.getOwnPropertyDescriptor(obj, key)
    Object.defineProperty(clone, key, desc)
  })

  return clone
}
