import assert from 'chai/chai'
import makeServiceMutations from '~/src/service-module/mutations'
import makeServiceState from '~/src/service-module/state'
import errors from 'feathers-errors'

const dummyService = {
  vuexOptions: {
    module: {
      idField: '_id'
    }
  }
}

const {
  addItem,
  addItems,
  updateItem,
  updateItems,
  removeItem,
  clearAll,
  clearList,
  setCurrent,
  clearCurrent,
  rejectCopy,
  commitCopy,
  setFindPending,
  unsetFindPending,
  setGetPending,
  unsetGetPending,
  setCreatePending,
  unsetCreatePending,
  setUpdatePending,
  unsetUpdatePending,
  setPatchPending,
  unsetPatchPending,
  setRemovePending,
  unsetRemovePending,
  setFindError,
  clearFindError,
  setGetError,
  clearGetError,
  setCreateError,
  clearCreateError,
  setUpdateError,
  clearUpdateError,
  setPatchError,
  clearPatchError,
  setRemoveError,
  clearRemoveError
} = makeServiceMutations(dummyService)

describe('Service Module - Mutations', () => {
  it('addItem', () => {
    const state = makeServiceState(dummyService)
    const item1 = {
      _id: 1,
      test: true
    }
    const item2 = {
      _id: 2,
      test: true
    }

    addItem(state, item1)
    assert(state.ids.length === 1)
    assert(state.ids[0] === 1)
    assert(state.keyedById[1] === item1)

    // Add item 2
    addItem(state, item2)
    assert(state.ids.length === 2)
    assert(state.ids[1] === 2)
    assert(state.keyedById[2] === item2)

    // Re-add item 1
    addItem(state, item1)
    assert(state.ids.length === 2, 'still only two items in the ids array')
    assert(state.ids[0] === 1)
    assert(state.keyedById[1] === item1)
    assert(state.ids[1] === 2)
    assert(state.keyedById[2] === item2)
  })

  it('addItems', () => {
    const state = makeServiceState(dummyService)
    const item1 = {
      _id: 1,
      test: true
    }
    const item2 = {
      _id: 2,
      test: true
    }
    const items = [item1, item2]
    addItems(state, items)
    assert(state.ids.length === 2, 'still only two items in the ids array')
    assert(state.ids[0] === 1)
    assert(state.keyedById[1] === item1)
    assert(state.ids[1] === 2)
    assert(state.keyedById[2] === item2)
  })

  it('updateItem', () => {
    const state = makeServiceState(dummyService)
    const item1 = {
      _id: 1,
      test: true
    }
    const items = [item1]
    addItems(state, items)

    const item1updated = {
      _id: 1,
      test: false
    }
    updateItem(state, item1updated)

    assert(state.keyedById[1].test === false)
  })

  it('updateItems', () => {
    const state = makeServiceState(dummyService)
    const item1 = {
      _id: 1,
      test: true
    }
    const item2 = {
      _id: 2,
      test: true
    }
    const items = [item1, item2]
    addItems(state, items)

    const item1updated = {
      _id: 1,
      test: false
    }
    const item2updated = {
      _id: 2,
      test: false
    }
    const itemsToUpdate = [item1updated, item2updated]
    updateItems(state, itemsToUpdate)

    assert(state.keyedById[1].test === false)
    assert(state.keyedById[2].test === false)
  })

  it('removeItem', () => {
    const state = makeServiceState(dummyService)

    addItem(state, {_id: 1, test: true})
    removeItem(state, 1)

    assert(state.ids.length === 0)
    assert(Object.keys(state.keyedById).length === 0)
  })

  it('clearAll', () => {
    const state = makeServiceState(dummyService)
    const item1 = {
      _id: 1,
      test: true
    }
    const item2 = {
      _id: 2,
      test: true
    }
    const items = [item1, item2]
    addItems(state, items)

    clearAll(state)
    assert(state.ids.length === 0)
    assert(Object.keys(state.keyedById).length === 0)
  })

  it('clearList', () => {
    const state = makeServiceState(dummyService)
    const item1 = {
      _id: 1,
      test: true
    }
    const item2 = {
      _id: 2,
      test: true
    }
    const items = [item1, item2]
    addItems(state, items)
    setCurrent(state, item2)

    clearList(state)
    assert(state.ids.length === 1, 'only one id was left in the list')
    assert(state.ids[0] === 2, 'the remaining id is for the current item')
    assert(state.keyedById[1] === undefined, 'item1 is removed from keyedById')
    assert(state.keyedById[2] === item2, 'the item is still in keyedById')
  })

  it('setCurrent', () => {
    const state = makeServiceState(dummyService)
    const item1 = {
      _id: 1,
      test: true
    }
    const item2 = {
      _id: 2,
      test: true
    }
    const items = [item1, item2]
    addItems(state, items)
    setCurrent(state, item2)

    assert(state.currentId === 2)
    assert.deepEqual(state.copy, item2)
  })

  it('clearCurrent', () => {
    const state = makeServiceState(dummyService)
    const item1 = {
      _id: 1,
      test: true
    }
    const item2 = {
      _id: 2,
      test: true
    }
    const items = [item1, item2]
    addItems(state, items)
    setCurrent(state, item2)
    clearCurrent(state)

    assert(state.currentId === undefined)
    assert(state.copy === undefined)
  })

  it('rejectCopy', () => {
    const state = makeServiceState(dummyService)
    const item1 = {
      _id: 1,
      test: true
    }
    addItem(state, item1)
    setCurrent(state, item1)
    state.copy.test = false
    assert(item1.test === true, `the original item didn't change when copy was changed`)

    rejectCopy(state)
    assert(state.copy.test === true, 'the copy was reset')
  })

  it('commitCopy', () => {
    const state = makeServiceState(dummyService)
    const item1 = {
      _id: 1,
      test: true
    }
    addItem(state, item1)
    setCurrent(state, item1)
    state.copy.test = false

    commitCopy(state)
    assert(state.copy.test === false, `the copy wasn't changed after commitCopy`)
    assert(item1.test === false, 'the original item was updated after commitCopy')
  })

  describe('Pending', () => {
    it('setFindPending', () => {
      const state = makeServiceState(dummyService)
      assert(!state.isFindPending)
      setFindPending(state)
      assert(state.isFindPending)
    })

    it('setFindPending', () => {
      const state = makeServiceState(dummyService)
      setFindPending(state)
      unsetFindPending(state)
      assert(!state.isFindPending)
    })

    it('setGetPending', () => {
      const state = makeServiceState(dummyService)
      assert(!state.isGetPending)
      setGetPending(state)
      assert(state.isGetPending)
    })

    it('setGetPending', () => {
      const state = makeServiceState(dummyService)
      setGetPending(state)
      unsetGetPending(state)
      assert(!state.isGetPending)
    })

    it('setCreatePending', () => {
      const state = makeServiceState(dummyService)
      assert(!state.isCreatePending)
      setCreatePending(state)
      assert(state.isCreatePending)
    })

    it('setCreatePending', () => {
      const state = makeServiceState(dummyService)
      setCreatePending(state)
      unsetCreatePending(state)
      assert(!state.isCreatePending)
    })

    it('setUpdatePending', () => {
      const state = makeServiceState(dummyService)
      assert(!state.isUpdatePending)
      setUpdatePending(state)
      assert(state.isUpdatePending)
    })

    it('setUpdatePending', () => {
      const state = makeServiceState(dummyService)
      setUpdatePending(state)
      unsetUpdatePending(state)
      assert(!state.isUpdatePending)
    })

    it('setPatchPending', () => {
      const state = makeServiceState(dummyService)
      assert(!state.isPatchPending)
      setPatchPending(state)
      assert(state.isPatchPending)
    })

    it('setPatchPending', () => {
      const state = makeServiceState(dummyService)
      setPatchPending(state)
      unsetPatchPending(state)
      assert(!state.isPatchPending)
    })

    it('setRemovePending', () => {
      const state = makeServiceState(dummyService)
      assert(!state.isRemovePending)
      setRemovePending(state)
      assert(state.isRemovePending)
    })

    it('setRemovePending', () => {
      const state = makeServiceState(dummyService)
      setRemovePending(state)
      unsetRemovePending(state)
      assert(!state.isRemovePending)
    })
  })

  describe('Errors', () => {
    it('setFindError', () => {
      const state = makeServiceState(dummyService)
      setFindError(state, new Error('This is a test'))
      assert(state.errorOnFind.message)
      assert(state.errorOnFind.name)
      assert(state.errorOnFind.stack)
    })

    it('setFindError with feathers-errors', () => {
      const state = makeServiceState(dummyService)
      setFindError(state, new errors.NotAuthenticated('You are not logged in'))
      assert(state.errorOnFind.className)
      assert(state.errorOnFind.code)
      assert(state.errorOnFind.hasOwnProperty('errors'))
      assert(state.errorOnFind.hasOwnProperty('data'))
      assert(state.errorOnFind.message)
      assert(state.errorOnFind.name)
      assert(state.errorOnFind.stack)
    })

    it('clearFindError', () => {
      const state = makeServiceState(dummyService)
      setFindError(state, new Error('This is a test'))
      clearFindError(state)
      assert(!state.errorOnFind, 'errorOnFind was cleared')
    })

    it('setGetError', () => {
      const state = makeServiceState(dummyService)
      setGetError(state, new Error('This is a test'))
      assert(state.errorOnGet.message)
      assert(state.errorOnGet.name)
      assert(state.errorOnGet.stack)
    })

    it('clearGetError', () => {
      const state = makeServiceState(dummyService)
      setGetError(state, new Error('This is a test'))
      clearGetError(state)
      assert(!state.errorOnGet, 'errorOnGet was cleared')
    })

    it('setCreateError', () => {
      const state = makeServiceState(dummyService)
      setCreateError(state, new Error('This is a test'))
      assert(state.errorOnCreate.message)
      assert(state.errorOnCreate.name)
      assert(state.errorOnCreate.stack)
    })

    it('clearCreateError', () => {
      const state = makeServiceState(dummyService)
      setCreateError(state, new Error('This is a test'))
      clearCreateError(state)
      assert(!state.errorOnCreate, 'errorOnCreate was cleared')
    })

    it('setUpdateError', () => {
      const state = makeServiceState(dummyService)
      setUpdateError(state, new Error('This is a test'))
      assert(state.errorOnUpdate.message)
      assert(state.errorOnUpdate.name)
      assert(state.errorOnUpdate.stack)
    })

    it('clearUpdateError', () => {
      const state = makeServiceState(dummyService)
      setUpdateError(state, new Error('This is a test'))
      clearUpdateError(state)
      assert(!state.errorOnUpdate, 'errorOnUpdate was cleared')
    })

    it('setPatchError', () => {
      const state = makeServiceState(dummyService)
      setPatchError(state, new Error('This is a test'))
      assert(state.errorOnPatch.message)
      assert(state.errorOnPatch.name)
      assert(state.errorOnPatch.stack)
    })

    it('clearPatchError', () => {
      const state = makeServiceState(dummyService)
      setPatchError(state, new Error('This is a test'))
      clearPatchError(state)
      assert(!state.errorOnPatch, 'errorOnPatch was cleared')
    })

    it('setRemoveError', () => {
      const state = makeServiceState(dummyService)
      setRemoveError(state, new Error('This is a test'))
      assert(state.errorOnRemove.message)
      assert(state.errorOnRemove.name)
      assert(state.errorOnRemove.stack)
    })

    it('clearRemoveError', () => {
      const state = makeServiceState(dummyService)
      setRemoveError(state, new Error('This is a test'))
      clearRemoveError(state)
      assert(!state.errorOnRemove, 'errorOnRemove was cleared')
    })
  })
})
