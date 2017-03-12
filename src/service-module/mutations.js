import deepAssign from 'deep-assign'

export default function makeServiceMutations (service) {
  const { vuexOptions } = service
  const idField = vuexOptions.module.idField || vuexOptions.global.idField
  return {
    addItem (state, payload) {
      let id = payload[idField]
      state.ids.push(id)
      state.keyedById = {
        ...state.keyedById,
        [id]: payload
      }
    },
    removeData (state, id) {
      state.data = state.data.filter(item => item[service.id] !== id)
      if (state.currentId === id) {
        state.currentId = undefined
        state.copy = undefined
      }
    },
    updateItem (state, payload) {
      let id = payload[idField]
      state.keyedById[id] = payload
    },

    clearAll (state) {
      state.ids = []
      state.currentId = undefined
      state.copy = undefined
      state.keyedById = {}
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
      state.isPending.find = true
    },
    unsetFindPending (state) {
      state.isPending.find = false
    },
    setGetPending (state) {
      state.isPending.get = true
    },
    unsetGetPending (state) {
      state.isPending.get = false
    },
    setCreatePending (state) {
      state.isPending.create = true
    },
    unsetCreatePending (state) {
      state.isPending.create = false
    },
    setUpdatePending (state) {
      state.isPending.update = true
    },
    unsetUpdatePending (state) {
      state.isPending.update = false
    },
    setPatchPending (state) {
      state.isPending.patch = true
    },
    unsetPatchPending (state) {
      state.isPending.patch = false
    },
    setRemovePending (state) {
      state.isPending.remove = true
    },
    unsetRemovePending (state) {
      state.isPending.remove = false
    },

    },
    }
  }
}
