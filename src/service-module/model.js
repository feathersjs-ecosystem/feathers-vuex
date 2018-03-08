const defaults = {
  idField: 'id',
  preferUpdate: false,
  _defaults: {}
}

export default function (options) {
  options = Object.assign({}, defaults, options)
  const { idField, preferUpdate, _defaults } = options

  return class FeathersVuexModel {
    constructor (data, options = {}) {
      if (options.isClone) {
        Object.defineProperty(this, 'isClone', { value: true })
      }
      Object.assign(this, this._defaults, data)
    }

    _defaults: _defaults

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
        return preferUpdate ? this.update(null, params) : this.patch(null, params)
      } else {
        return this.create(params)
      }
    }

    create (params) {
      return this._create(this, params)
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
}
