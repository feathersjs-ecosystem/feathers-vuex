import deepAssign from 'deep-assign'
import serializeError from 'serialize-error'

export default function makeServiceMutations (service) {
  const { vuexOptions } = service
  const idField = vuexOptions.module.idField || vuexOptions.global.idField

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
    addItem (state, payload) {
      addItem(state, payload)
    },
    addItems (state, payload) {
      payload.forEach(item => addItem(state, item))
    },
    updateItem (state, payload) {
      updateItem(state, payload)
    },
    updateItems (state, payload) {
      payload.forEach(item => updateItem(state, item))
    },
    removeItem (state, id) {
      var keyedById = {}
      state.ids = state.ids.filter(currentId => {
        let notSame = currentId !== id
        if (notSame) {
          keyedById[currentId] = state.keyedById[currentId]
        }
        return notSame
      })

      state.keyedById = keyedById

      if (state.currentId === id) {
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
      state.keyedById = {
        [currentId]: current
      }
      state.ids = [currentId]
    },

    setCurrent (state, payload) {
      let id = payload[idField]
      state.currentId = id
      state.copy = deepAssign({}, payload)
    },
    clearCurrent (state) {
      state.currentId = undefined
      state.copy = undefined
    },
    // Deep assigns current to copy
    rejectCopy (state) {
      let current = state.keyedById[state.currentId]
      deepAssign(state.copy, current)
    },
    // Deep assigns copy to current
    commitCopy (state) {
      let current = state.keyedById[state.currentId]
      deepAssign(current, state.copy)
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
    }
  }
}
