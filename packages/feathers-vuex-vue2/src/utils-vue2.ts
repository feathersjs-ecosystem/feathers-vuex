import Vue from 'vue'
import fastCopy from 'fast-copy'
import _isObject from 'lodash/isObject'
import { isBaseModelInstance } from '@feathersjs/vuex-commons'

export function updateOriginal(original, newData) {
  Object.keys(newData).forEach(key => {
    const newProp = newData[key]
    const oldProp = original[key]
    let shouldCopyProp = false

    if (newProp === oldProp) {
      return
    }

    // If the old item doesn't already have this property, update it
    if (!original.hasOwnProperty(key)) {
      shouldCopyProp = true
      // If the old prop is null or undefined, and the new prop is neither
    } else if (
      (oldProp === null || oldProp === undefined) &&
      newProp !== null &&
      newProp !== undefined
    ) {
      shouldCopyProp = true
      // If both old and new are arrays
    } else if (Array.isArray(oldProp) && Array.isArray(newProp)) {
      shouldCopyProp = true
    } else if (_isObject(oldProp)) {
      shouldCopyProp = true
    } else if (oldProp !== newProp && !Array.isArray(oldProp) && !Array.isArray(newProp)) {
      shouldCopyProp = true
    }

    if (shouldCopyProp) {
      if (original.hasOwnProperty(key)) {
        original[key] = newProp
      } else {
        Vue.set(original, key, newProp)
      }
    }
  })
}

export function mergeWithAccessors(dest, source, blacklist = ['__isClone', '__ob__']) {
  const sourceProps = Object.getOwnPropertyNames(source)
  const destProps = Object.getOwnPropertyNames(dest)
  const sourceIsVueObservable = sourceProps.includes('__ob__')
  const destIsVueObservable = destProps.includes('__ob__')
  sourceProps.forEach(key => {
    const sourceDesc = Object.getOwnPropertyDescriptor(source, key)
    const destDesc = Object.getOwnPropertyDescriptor(dest, key)

    // if (Array.isArray(source[key]) && source[key].find(i => i.__ob__)) {
    //   sourceIsVueObservable = true
    // }
    // if (Array.isArray(dest[key]) && dest[key].find(i => i.__ob__)) {
    //   destIsVueObservable = true
    // }

    // This might have to be uncommented, but we'll try it this way, for now.
    // if (!sourceDesc.enumerable) {
    //   return
    // }

    // If the destination is not writable, return. Also ignore blacklisted keys.
    // Must explicitly check if writable is false
    if ((destDesc && destDesc.writable === false) || blacklist.includes(key)) {
      return
    }

    // Handle Vue observable objects
    if (destIsVueObservable || sourceIsVueObservable) {
      const isObject = _isObject(source[key])
      const isFeathersVuexInstance =
        isObject && !!(source[key].constructor.modelName || source[key].constructor.namespace)
      // Do not use fastCopy directly on a feathers-vuex BaseModel instance to keep from breaking reactivity.
      if (isObject && !isFeathersVuexInstance) {
        try {
          dest[key] = fastCopy(source[key])
        } catch (err) {
          if (!err.message.includes('getter')) {
            throw err
          }
        }
      } else {
        try {
          dest[key] = source[key]
        } catch (err) {
          if (!err.message.includes('getter')) {
            throw err
          }
        }
      }
      return
    }

    // Handle defining accessors
    if (typeof sourceDesc.get === 'function' || typeof sourceDesc.set === 'function') {
      Object.defineProperty(dest, key, sourceDesc)
      return
    }

    // Do not attempt to overwrite a getter in the dest object
    if (destDesc && typeof destDesc.get === 'function') {
      return
    }

    // Assign values
    // Do not allow sharing of deeply-nested objects between instances
    // Potentially breaks accessors on nested data. Needs recursion if this is an issue
    let value
    if (_isObject(sourceDesc.value) && !isBaseModelInstance(sourceDesc.value)) {
      value = fastCopy(sourceDesc.value)
    }
    dest[key] = value || sourceDesc.value
  })
  return dest
}
