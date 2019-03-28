/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import Vue from 'vue'
import serializeError from 'serialize-error'
import isObject from 'lodash.isobject'
import { checkId, updateOriginal, mergeWithAccessors } from '../utils'
import { globalModels } from './global-models'
import { get as _get } from 'lodash'

export default function makeServiceMutations() {
  function addItems(state, items) {
    const { idField, debug, servicePath } = state
    const Model = _get(
      globalModels,
      `[${state.serverAlias}].byServicePath[${servicePath}]`
    )

    let newKeyedById = { ...state.keyedById }

    for (let item of items) {
      let id = item[idField]
      const isIdOk = checkId(id, item, debug)

      if (isIdOk) {
        if (Model && !item.isFeathersVuexInstance) {
          item = new Model(item)
        }

        // Only add the id if it's not already in the `ids` list.
        if (!state.ids.includes(id)) {
          state.ids.push(id)
        }

        newKeyedById[id] = item
      }
    }

    state.keyedById = newKeyedById
  }

  function updateItems(state, items) {
    const { idField, replaceItems, addOnUpsert, debug, servicePath } = state
    const Model = _get(
      globalModels,
      `[${state.serverAlias}].byServicePath[${servicePath}]`
    )

    for (let item of items) {
      let id = item[idField]
      const isIdOk = checkId(id, item, debug)

      // Update the record
      if (isIdOk) {
        if (state.ids.includes(id)) {
          // Completely replace the item
          if (replaceItems) {
            if (Model && !item.isFeathersVuexInstance) {
              item = new Model(item)
            }
            Vue.set(state.keyedById, id, item)
            // Merge in changes
          } else {
            updateOriginal(item, state.keyedById[id])
          }

          // if addOnUpsert then add the record into the state, else discard it.
        } else if (addOnUpsert) {
          state.ids.push(id)
          Vue.set(state.keyedById, id, item)
        }
        continue
      }
    }
  }

  return {
    addItem(state, item) {
      addItems(state, [item])
    },
    addItems,
    updateItem(state, item) {
      updateItems(state, [item])
    },
    updateItems(state, items) {
      if (!Array.isArray(items)) {
        throw new Error(
          'You must provide an array to the `updateItems` mutation.'
        )
      }
      updateItems(state, items)
    },

    removeItem(state, item) {
      const { idField, debug } = state
      const idToBeRemoved = isObject(item) ? item[idField] : item
      const isIdOk = checkId(idToBeRemoved, item, debug)
      const index = state.ids.findIndex(i => i === idToBeRemoved)

      if (isIdOk && index !== null && index !== undefined) {
        Vue.delete(state.ids, index)
        Vue.delete(state.keyedById, idToBeRemoved)
      }
    },

    removeItems(state, items) {
      const { idField } = state

      if (!Array.isArray(items)) {
        throw new Error(
          'You must provide an array to the `removeItems` mutation.'
        )
      }
      // Make sure we have an array of ids. Assume all are the same.
      const containsObjects = items[0] && isObject(items[0])
      const idsToRemove = containsObjects
        ? items.map(item => item[idField])
        : items
      const mapOfIdsToRemove = idsToRemove.reduce((map, id) => {
        map[id] = true
        return map
      }, {})
      idsToRemove.forEach(id => {
        Vue.delete(state.keyedById, id)
      })

      // Get indexes to remove from the ids array.
      const mapOfIndexesToRemove = state.ids.reduce((map, id, index) => {
        if (mapOfIdsToRemove[id]) {
          map[index] = true
        }
        return map
      }, {})
      // Remove highest indexes first, so the indexes don't change
      const indexesInReverseOrder = Object.keys(mapOfIndexesToRemove).sort(
        (a, b) => {
          if (a < b) {
            return 1
          } else if (a > b) {
            return -1
          } else {
            return 0
          }
        }
      )
      indexesInReverseOrder.forEach(indexInIdsArray => {
        Vue.delete(state.ids, indexInIdsArray)
      })
    },

    clearAll(state) {
      state.ids = []
      state.keyedById = {}
    },

    // Creates a copy of the record with the passed-in id, stores it in copiesById
    createCopy(state, id) {
      const { servicePath, keepCopiesInStore } = state
      const current = state.keyedById[id]
      const Model = _get(
        globalModels,
        `[${state.serverAlias}].byServicePath[${servicePath}]`
      )

      if (Model) {
        var model = new Model(current, { isClone: true })
      } else {
        var copyData = mergeWithAccessors({}, current)
      }

      let item = model || copyData
      if (keepCopiesInStore) {
        state.copiesById[id] = item
      } else {
        if (!item.hasOwnProperty('__ob__')) {
          item = Vue.observable(item)
        }
        Model.copiesById[id] = item
      }
    },

    // Resets the copy to match the original record, locally
    resetCopy(state, id) {
      const { debug, servicePath, keepCopiesInStore } = state
      checkId(id, undefined, debug)
      const Model = _get(
        globalModels,
        `[${state.serverAlias}].byServicePath[${servicePath}]`
      )
      const copy = keepCopiesInStore
        ? state.copiesById[id]
        : Model && _get(Model, `copiesById[${id}]`)

      if (copy) {
        mergeWithAccessors(copy, state.keyedById[id])
      }
    },

    // Deep assigns copy to original record, locally
    commitCopy(state, id) {
      const { debug, servicePath, keepCopiesInStore } = state
      checkId(id, undefined, debug)
      const Model = _get(
        globalModels,
        `[${state.serverAlias}].byServicePath[${servicePath}]`
      )
      const copy = keepCopiesInStore
        ? state.copiesById[id]
        : Model && _get(Model, `copiesById[${id}]`)

      if (copy) {
        mergeWithAccessors(state.keyedById[id], copy)
      }
    },

    // Removes the copy from copiesById
    clearCopy(state, id) {
      const newCopiesById = Object.assign({}, state.copiesById)
      delete newCopiesById[id]
      state.copiesById = newCopiesById
    },

    /**
     * Stores pagination data on state.pagination based on the query identifier
     * (qid) The qid must be manually assigned to `params.qid`
     */
    updatePaginationForQuery(state, { qid, response, query }) {
      const { data, limit, skip, total } = response
      const { idField } = state
      const ids = data.map(item => {
        return item[idField]
      })
      const queriedAt = new Date().getTime()
      Vue.set(state.pagination, qid, {
        limit,
        skip,
        total,
        ids,
        query,
        queriedAt
      })
    },

    setPending(state, method: string): void {
      const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
      state[`is${uppercaseMethod}Pending`] = true
    },
    unsetPending(state, method: string): void {
      const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
      state[`is${uppercaseMethod}Pending`] = false
    },

    setError(state, payload: { method: string; error: Error }): void {
      const { method, error } = payload
      const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
      state[`errorOn${uppercaseMethod}`] = Object.assign(
        {},
        serializeError(error)
      )
    },
    clearError(state, method: string): void {
      const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
      state[`errorOn${uppercaseMethod}`] = null
    }
  }
}
