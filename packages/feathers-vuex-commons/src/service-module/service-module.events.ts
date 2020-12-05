import { getId } from '../utils'
import _debounce from 'lodash/debounce'
import { globalModels } from './global-models'

export interface ServiceEventsDebouncedQueue {
  addOrUpdateById: {}
  removeItemById: {}
  enqueueAddOrUpdate(item: any): void
  enqueueRemoval(item: any): void
  flushAddOrUpdateQueue(): void
  flushRemoveItemQueue(): void
}

export default function enableServiceEvents({
  service,
  Model,
  store,
  options,
}): ServiceEventsDebouncedQueue {
  const debouncedQueue: ServiceEventsDebouncedQueue = {
    addOrUpdateById: {},
    removeItemById: {},
    enqueueAddOrUpdate(item): void {
      const id = getId(item, options.idField)
      this.addOrUpdateById[id] = item
      if (this.removeItemById.hasOwnProperty(id)) {
        delete this.removeItemById[id]
      }
      this.flushAddOrUpdateQueue()
    },
    enqueueRemoval(item): void {
      const id = getId(item, options.idField)
      this.removeItemById[id] = item
      if (this.addOrUpdateById.hasOwnProperty(id)) {
        delete this.addOrUpdateById[id]
      }
      this.flushRemoveItemQueue()
    },
    flushAddOrUpdateQueue: _debounce(
      async function () {
        const values = Object.values(this.addOrUpdateById)
        if (values.length === 0) return
        await store.dispatch(`${options.namespace}/addOrUpdateList`, {
          data: values,
          disableRemove: true,
        })
        this.addOrUpdateById = {}
      },
      options.debounceEventsTime || 20,
      { maxWait: options.debounceEventsMaxWait }
    ),
    flushRemoveItemQueue: _debounce(
      function () {
        const values = Object.values(this.removeItemById)
        if (values.length === 0) return
        store.commit(`${options.namespace}/removeItems`, values)
        this.removeItemById = {}
      },
      options.debounceEventsTime || 20,
      { maxWait: options.debounceEventsMaxWait }
    ),
  }

  const handleEvent = (eventName, item, mutationName): void => {
    const handler = options.handleEvents[eventName]
    const confirmOrArray = handler(item, {
      model: Model,
      models: globalModels,
    })
    const [affectsStore, modified = item] = Array.isArray(confirmOrArray)
      ? confirmOrArray
      : [confirmOrArray]
    if (affectsStore) {
      if (!options.debounceEventsTime) {
        eventName === 'removed'
          ? store.commit(`${options.namespace}/removeItem`, modified)
          : store.dispatch(`${options.namespace}/${mutationName}`, modified)
      } else {
        eventName === 'removed'
          ? debouncedQueue.enqueueRemoval(item)
          : debouncedQueue.enqueueAddOrUpdate(item)
      }
    }
  }

  // Listen to socket events when available.
  service.on('created', item => {
    handleEvent('created', item, 'addOrUpdate')
    Model.emit && Model.emit('created', item)
  })
  service.on('updated', item => {
    handleEvent('updated', item, 'addOrUpdate')
    Model.emit && Model.emit('updated', item)
  })
  service.on('patched', item => {
    handleEvent('patched', item, 'addOrUpdate')
    Model.emit && Model.emit('patched', item)
  })
  service.on('removed', item => {
    handleEvent('removed', item, 'removeItem')
    Model.emit && Model.emit('removed', item)
  })

  return debouncedQueue
}
