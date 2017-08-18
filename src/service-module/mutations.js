import _merge from 'lodash.merge'
import _cloneDeep from 'lodash.clonedeep'
import serializeError from 'serialize-error'
import isObject from 'lodash.isobject'

export default function makeServiceMutations (service) {
  const { vuexOptions } = service
  const idField = vuexOptions.module.idField || vuexOptions.global.idField
  const customMutations = (vuexOptions.module && vuexOptions.module.mutations) || {}

  function addItem (state, item) {
    let id = item[idField]

    // Only add the id if it's not already in the `ids` list.
    if (!state.ids.includes(id)) {
      state.ids.push(id)
    }

    state.keyedById = {
      ...state.keyedById,
      [id]: item
    }
  }

  function updateItem (state, item) {
    let id = item[idField]
    state.keyedById[id] = item
  }

  return {
    addItem (state, item) {
      addItem(state, item)
    },
    addItems (state, items) {
      items.forEach(item => addItem(state, item))
    },
    updateItem (state, item) {
      updateItem(state, item)
    },
    updateItems (state, items) {
      if (!Array.isArray(items)) {
        throw new Error('You must provide an array to the `removeItems` mutation.')
      }
      items.forEach(item => updateItem(state, item))
    },

    removeItem (state, item) {
      const idToBeRemoved = isObject(item) ? item[idField] : item
      const keyedById = {}
      const { currentId } = state

      state.ids = state.ids.filter(id => {
        if (id === idToBeRemoved) {
          return false
        } else {
          keyedById[id] = state.keyedById[id]
          return true
        }
      })

      state.keyedById = keyedById

      if (currentId === idToBeRemoved) {
        state.currentId = undefined
        state.copy = undefined
      }
    },

    removeItems (state, items) {
      if (!Array.isArray(items)) {
        throw new Error('You must provide an array to the `removeItems` mutation.')
      }
      const containsObjects = items[0] && isObject(items[0])
      const keyedById = {}
      const currentId = state.currentId
      let idsToRemove = items
      const mapOfIdsToRemove = {}

      // If the array contains objects, create an array of ids. Assume all are the same.
      if (containsObjects) {
        idsToRemove = items.map(item => item[idField])
      }

      // Make a hash map of the idsToRemove, so we don't have to iterate inside a loop
      idsToRemove.forEach(idToRemove => {
        mapOfIdsToRemove[idToRemove] = idToRemove
      })

      // Filter the ids to be those we're keeping. Also create new keyedById.
      state.ids = state.ids.filter(id => {
        if (mapOfIdsToRemove[id]) {
          return false
        } else {
          keyedById[id] = state.keyedById[id]
          return true
        }
      })

      state.keyedById = keyedById

      if (currentId && mapOfIdsToRemove[currentId]) {
        state.currentId = undefined
        state.copy = undefined
      }
    },

    clearAll (state) {
      state.ids = []
      state.currentId = undefined
      state.copy = undefined
      state.keyedById = {}
    },

    clearList (state) {
      let currentId = state.currentId
      let current = state.keyedById[currentId]

      if (currentId && current) {
        state.keyedById = {
          [currentId]: current
        }
        state.ids = [currentId]
      } else {
        state.keyedById = {}
        state.ids = []
      }
    },

    setCurrent (state, item) {
      let id = isObject(item) ? item[idField] : item
      state.currentId = id
      state.copy = _cloneDeep(item)
    },

    clearCurrent (state) {
      state.currentId = undefined
      state.copy = undefined
    },

    // Deep assigns current to copy
    rejectCopy (state) {
      let current = state.keyedById[state.currentId]
      _merge(state.copy, current)
    },

    // Deep assigns copy to current
    commitCopy (state) {
      let current = state.keyedById[state.currentId]
      _merge(current, state.copy)
    },

    setFindPending (state) {
      state.isFindPending = true
    },
    unsetFindPending (state) {
      state.isFindPending = false
    },
    setGetPending (state) {
      state.isGetPending = true
    },
    unsetGetPending (state) {
      state.isGetPending = false
    },
    setCreatePending (state) {
      state.isCreatePending = true
    },
    unsetCreatePending (state) {
      state.isCreatePending = false
    },
    setUpdatePending (state) {
      state.isUpdatePending = true
    },
    unsetUpdatePending (state) {
      state.isUpdatePending = false
    },
    setPatchPending (state) {
      state.isPatchPending = true
    },
    unsetPatchPending (state) {
      state.isPatchPending = false
    },
    setRemovePending (state) {
      state.isRemovePending = true
    },
    unsetRemovePending (state) {
      state.isRemovePending = false
    },

    setFindError (state, payload) {
      state.errorOnFind = Object.assign({}, serializeError(payload))
    },
    clearFindError (state) {
      state.errorOnFind = undefined
    },
    setGetError (state, payload) {
      state.errorOnGet = Object.assign({}, serializeError(payload))
    },
    clearGetError (state) {
      state.errorOnGet = undefined
    },
    setCreateError (state, payload) {
      state.errorOnCreate = Object.assign({}, serializeError(payload))
    },
    clearCreateError (state) {
      state.errorOnCreate = undefined
    },
    setUpdateError (state, payload) {
      state.errorOnUpdate = Object.assign({}, serializeError(payload))
    },
    clearUpdateError (state) {
      state.errorOnUpdate = undefined
    },
    setPatchError (state, payload) {
      state.errorOnPatch = Object.assign({}, serializeError(payload))
    },
    clearPatchError (state) {
      state.errorOnPatch = undefined
    },
    setRemoveError (state, payload) {
      state.errorOnRemove = Object.assign({}, serializeError(payload))
    },
    clearRemoveError (state) {
      state.errorOnRemove = undefined
    },

    ...customMutations
  }
}
