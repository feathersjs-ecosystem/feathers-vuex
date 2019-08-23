/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import Vue from 'vue'
import serializeError from 'serialize-error'
import {
  updateOriginal,
  mergeWithAccessors,
  assignTempId,
  getId,
  getQueryInfo
} from '../utils'
import { globalModels as models } from './global-models'
import _omit from 'lodash/omit'
import _get from 'lodash/get'
import _isObject from 'lodash/isObject'

export default function makeServiceMutations() {
  function addItems(state, items) {
    const { serverAlias, idField, tempIdField, modelName } = state
    const Model = _get(models, `[${serverAlias}][${modelName}]`)
    const BaseModel = _get(models, `[${state.serverAlias}].BaseModel`)

    const newKeyedById = { ...state.keyedById }
    const newTempsById = { ...state.tempsById }

    for (let item of items) {
      const id = getId(item, idField)
      const isTemp = id === null || id === undefined

      // If the response contains a real id, remove isTemp
      if (id != null) {
        delete item.__isTemp
      }

      if (Model && !(item instanceof BaseModel) && !(item instanceof Model)) {
        item = new Model(item)
      }

      if (isTemp) {
        if (!item[tempIdField]) {
          var tempId = assignTempId(state, item)
        }
        item.__isTemp = true
        newTempsById[tempId] = item
      } else {
        // Only add the id if it's not already in the `ids` list.
        if (!state.ids.includes(id)) {
          state.ids.push(id)
        }
        newKeyedById[id] = item
      }
    }

    state.keyedById = newKeyedById
    state.tempsById = newTempsById
  }

  function updateItems(state, items) {
    const { idField, replaceItems, addOnUpsert, serverAlias, modelName } = state
    const Model = _get(models, `[${serverAlias}][${modelName}]`)
    const BaseModel = _get(models, `[${state.serverAlias}].BaseModel`)

    for (let item of items) {
      const id = getId(item, idField)

      // If the response contains a real id, remove isTemp
      if (id != null) {
        delete item.__isTemp
      }

      // Update the record
      if (id !== null && id !== undefined) {
        if (state.ids.includes(id)) {
          // Completely replace the item
          if (replaceItems) {
            if (Model && !item.isFeathersVuexInstance) {
              item = new Model(item)
            }
            Vue.set(state.keyedById, id, item)
            // Merge in changes
          } else {
            /**
             * If we have a Model class, calling new Model(incomingData) will call update
             * the original record with the accessors and setupInstance data.
             * This means that date objects and relationships will be preserved.
             *
             * If there's no Model class, just call updateOriginal on the incoming data.
             */
            if (Model && !(item instanceof BaseModel) && !(item instanceof Model)) {
              item = new Model(item)
            }
            const original = state.keyedById[id]
            updateOriginal(original, item)
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

  function mergeInstance(state, item) {
    const { serverAlias, idField, tempIdField, modelName } = state
    const id = getId(item, idField)
    const existingItem = state.keyedById[id]
    if (existingItem) {
      mergeWithAccessors(existingItem, item)
    }
  }

  function merge(state, { dest, source }) {
    mergeWithAccessors(dest, source)
  }

  return {
    mergeInstance,
    merge,
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
      const { idField } = state
      const idToBeRemoved = _isObject(item) ? getId(item, idField) : item
      const isIdOk = idToBeRemoved !== null && idToBeRemoved !== undefined
      const index = state.ids.findIndex(i => i === idToBeRemoved)

      if (isIdOk && index !== null && index !== undefined) {
        Vue.delete(state.ids, index)
        Vue.delete(state.keyedById, idToBeRemoved)
      }
    },

    // Removes temp records
    removeTemps(state, tempIds) {
      state.tempsById = _omit(state.tempsById, tempIds)
    },

    removeItems(state, items) {
      const { idField } = state

      if (!Array.isArray(items)) {
        throw new Error(
          'You must provide an array to the `removeItems` mutation.'
        )
      }
      // Make sure we have an array of ids. Assume all are the same.
      const containsObjects = items[0] && _isObject(items[0])
      const idsToRemove = containsObjects
        ? items.map(item => getId(item, idField))
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
      const { servicePath, keepCopiesInStore, serverAlias } = state
      const current = state.keyedById[id] || state.tempsById[id]
      const Model = _get(
        models,
        `[${serverAlias}].byServicePath[${servicePath}]`
      )

      if (Model) {
        var model = new Model(current, { clone: true })
      } else {
        var copyData = mergeWithAccessors({}, current)
      }

      let item = model || copyData
      if (keepCopiesInStore) {
        state.copiesById[id] = item
      } else {
        // Since it won't be added to the store, make it a Vue object
        if (!item.hasOwnProperty('__ob__')) {
          item = Vue.observable(item)
        }
        Model.copiesById[id] = item
      }
    },

    // Resets the copy to match the original record, locally
    resetCopy(state, id) {
      const { servicePath, keepCopiesInStore } = state
      const Model = _get(
        models,
        `[${state.serverAlias}].byServicePath[${servicePath}]`
      )
      const copy = keepCopiesInStore
        ? state.copiesById[id]
        : Model && _get(Model, `copiesById[${id}]`)

      if (copy) {
        const original = copy.__isTemp
          ? state.tempsById[id]
          : state.keyedById[id]
        mergeWithAccessors(copy, original)
      }
    },

    // Deep assigns copy to original record, locally
    commitCopy(state, id) {
      const { servicePath, keepCopiesInStore } = state
      const Model = _get(
        models,
        `[${state.serverAlias}].byServicePath[${servicePath}]`
      )
      const copy = keepCopiesInStore
        ? state.copiesById[id]
        : Model && _get(Model, `copiesById[${id}]`)

      if (copy) {
        const original = copy.__isTemp
          ? state.tempsById[id]
          : state.keyedById[id]
        mergeWithAccessors(original, copy)
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
    updatePaginationForQuery(state, { qid, response, query = {} }) {
      const { data, total } = response
      const { idField } = state
      const ids = data.map(i => i[idField])
      const queriedAt = new Date().getTime()
      const {
        queryId,
        queryParams,
        pageId,
        pageParams
      } = getQueryInfo({ qid, query }, response)

      if (!state.pagination[qid]) {
        Vue.set(state.pagination, qid, {})
      }
      if (!query.hasOwnProperty('$limit') && response.hasOwnProperty('limit')) {
        Vue.set(state.pagination, 'defaultLimit', response.limit)
      }
      if (!query.hasOwnProperty('$skip') && response.hasOwnProperty('skip')) {
        Vue.set(state.pagination, 'defaultSkip', response.skip)
      }

      const mostRecent = {
        query,
        queryId,
        queryParams,
        pageId,
        pageParams,
        queriedAt,
        total
      }

      const qidData = state.pagination[qid] || {}
      Object.assign(qidData, { mostRecent })
      qidData[queryId] = qidData[queryId] || {}
      const queryData = {
        total,
        queryParams
      }
      Object.assign(qidData[queryId], queryData)

      const pageData = {
        [pageId]: { pageParams, ids, queriedAt }
      }
      Object.assign(qidData[queryId], pageData)

      const newState = Object.assign({}, state.pagination[qid], qidData)

      Vue.set(state.pagination, qid, newState)
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
