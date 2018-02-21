export default function ({ state, actions }) {
  const { idProp, preferUpdate } = state

  return class FeathersVuexModel {
    constructor (data) {
      Object.assign(this, data)
    }

    save (params) {
      if (this[idProp]) {
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

      if (!this[idProp]) {
        const error = new Error(`Missing ${idProp} property. You must create the data before you can patch with this data`, data)
        return Promise.reject(error)
      }
      return this._patch(this[idProp], data, params)
    }
    _patch () {}

    update (newData, params) {
      const data = newData || this

      if (!this[idProp]) {
        const error = new Error(`Missing ${idProp} property. You must create the data before you can update with this data`, data)
        return Promise.reject(error)
      }
      return this._update(this[idProp], data, params)
    }
    _update () {}

    remove () {
      return this._remove(this[idProp])
    }
    _remove () {}
  }
}
