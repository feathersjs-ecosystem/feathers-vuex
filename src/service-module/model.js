export default function (moduleOrOptions) {
  let idField = 'id'
  let preferUpdate = false

  if (moduleOrOptions.hasOwnProperty('state')) {
    idField = moduleOrOptions.state.idField
    preferUpdate = moduleOrOptions.state.preferUpdate
  } else {
    idField = moduleOrOptions.idField
    preferUpdate = moduleOrOptions.preferUpdate
  }

  return class FeathersVuexModel {
    constructor (data) {
      Object.assign(this, data)
    }

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
